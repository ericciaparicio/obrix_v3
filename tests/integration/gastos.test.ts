import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import * as authModule from "@/lib/auth";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentConstructor: vi.fn() };
});

// contracts/gastos.md, contracts/reporte-historial.md — AC-10 a AC-17, AC-30
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createConstructorConObra(emailLocalPart: string, presupuestoInicial = 100000) {
  const constructor = await prisma.constructor.create({
    data: {
      email: `${emailLocalPart}${TEST_EMAIL_DOMAIN}`,
      passwordHash: "irrelevante",
      nombre: "Test",
      apellido: "Test",
      celular: "+5491100000000",
    },
  });
  const obra = await prisma.obra.create({
    data: {
      constructorId: constructor.id,
      nombre: "Obra Test",
      pais: "Argentina",
      provincia: "Buenos Aires",
      localidad: "CABA",
      direccion: "Calle 123",
      latitud: -34.6,
      longitud: -58.4,
      fechaInicio: new Date("2026-01-01"),
      presupuestoInicial,
    },
  });
  return { constructor, obra };
}

function mockLoggedInAs(constructor: { id: string; email: string }) {
  vi.mocked(authModule.getCurrentConstructor).mockResolvedValue({
    id: constructor.id,
    email: constructor.email,
    nombre: "Test",
    apellido: "Test",
  });
}

beforeEach(async () => {
  // IMPORTANTE: scopeado por email de test — un deleteMany({}) sin filtro
  // borra TODOS los gastos de la base, incluidos los de uso real (bug real
  // que borró un gasto cargado a mano; no repetir este patrón).
  await prisma.gasto.deleteMany({
    where: { obra: { propietario: { email: { endsWith: TEST_EMAIL_DOMAIN } } } },
  });
  await prisma.obra.deleteMany({
    where: { propietario: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
  });
  await prisma.constructor.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
  });
});

afterEach(async () => {
  vi.clearAllMocks();
});

describe("GET /api/tipos-gasto — AC-30", () => {
  it("devuelve los 5 tipos de gasto precargados", async () => {
    const { GET } = await import("@/app/api/tipos-gasto/route");
    const { constructor } = await createConstructorConObra("tipos-gasto");
    mockLoggedInAs(constructor);

    const res = await GET();
    expect(res.status).toBe(200);
    const tipos = await res.json();
    expect(tipos.map((t: { nombre: string }) => t.nombre).sort()).toEqual(
      [
        "Administrativos",
        "Dirección de Obra",
        "Mano de Obra",
        "Materiales",
        "Otros",
      ].sort(),
    );
  });
});

describe("POST /api/obra/:obraId/gastos", () => {
  it("registra un gasto válido (201) — AC-10", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { constructor, obra } = await createConstructorConObra("gasto-valido");
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const res = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 5000,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(201);
  });

  it("rechaza monto cero o negativo (400) — AC-11", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { constructor, obra } = await createConstructorConObra("gasto-monto-invalido");
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const res = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 0,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });

  it("rechaza si falta el tipo de gasto (400) — AC-12", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { constructor, obra } = await createConstructorConObra("gasto-sin-tipo");
    mockLoggedInAs(constructor);

    const res = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        monto: 5000,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });

  it("rechaza si falta la fecha (400) — AC-14", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { constructor, obra } = await createConstructorConObra("gasto-sin-fecha");
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const res = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 5000,
        moneda: "ARS",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });

  it("rechaza moneda distinta de ARS (400) — AC-15", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { constructor, obra } = await createConstructorConObra("gasto-moneda-invalida");
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const res = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 5000,
        moneda: "USD",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });

  it("responde 403 si la obra pertenece a otro constructor", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { obra } = await createConstructorConObra("gasto-dueno-a");
    const { constructor: constructorB } = await createConstructorConObra("gasto-dueno-b");
    mockLoggedInAs(constructorB);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const res = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 5000,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(403);
  });

  it("responde 404 si la obra no existe", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { constructor } = await createConstructorConObra("gasto-obra-inexistente");
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const res = await POST(
      req(`http://localhost/api/obra/no-existe/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 5000,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: "no-existe" }) },
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/obra/:obraId/reporte con gastos — AC-16, AC-17", () => {
  it("refleja el gasto acumulado, disponible y desglose por tipo", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { GET: GET_REPORTE } = await import("@/app/api/obra/[obraId]/reporte/route");
    const { constructor, obra } = await createConstructorConObra("reporte-con-gastos", 100000);
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 30000,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );

    const res = await GET_REPORTE(req(`http://localhost/api/obra/${obra.id}/reporte`, "GET"), {
      params: Promise.resolve({ obraId: obra.id }),
    });
    const reporte = await res.json();
    expect(reporte.gastado).toBe(30000);
    expect(reporte.disponible).toBe(70000);
    expect(reporte.porcentajeConsumido).toBe(30);
    expect(reporte.desglosePorTipo).toHaveLength(1);
    expect(reporte.desglosePorTipo[0].monto).toBe(30000);
  });

  it("permite que el gasto supere el presupuesto y muestra disponible negativo — AC-16", async () => {
    const { POST } = await import("@/app/api/obra/[obraId]/gastos/route");
    const { GET: GET_REPORTE } = await import("@/app/api/obra/[obraId]/reporte/route");
    const { constructor, obra } = await createConstructorConObra("reporte-sobregasto", 10000);
    mockLoggedInAs(constructor);
    const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();

    const postRes = await POST(
      req(`http://localhost/api/obra/${obra.id}/gastos`, "POST", {
        tipoGastoId: tipoGasto.id,
        monto: 50000,
        moneda: "ARS",
        fecha: "2026-02-01",
      }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(postRes.status).toBe(201);

    const res = await GET_REPORTE(req(`http://localhost/api/obra/${obra.id}/reporte`, "GET"), {
      params: Promise.resolve({ obraId: obra.id }),
    });
    const reporte = await res.json();
    expect(reporte.disponible).toBe(-40000);
  });
});

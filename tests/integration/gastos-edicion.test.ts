import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import * as authModule from "@/lib/auth";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentConstructor: vi.fn() };
});

// contracts/gastos.md PATCH/DELETE /api/obra/:obraId/gastos/:gastoId — AC-26 a AC-28
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createConstructorConObraYGasto(emailLocalPart: string) {
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
      presupuestoInicial: 100000,
    },
  });
  const tipoGasto = await prisma.tipoGasto.findFirstOrThrow();
  const gasto = await prisma.gasto.create({
    data: {
      obraId: obra.id,
      tipoGastoId: tipoGasto.id,
      monto: 10000,
      moneda: "ARS",
      fecha: new Date("2026-02-01"),
    },
  });
  return { constructor, obra, gasto, tipoGasto };
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
  await prisma.gasto.deleteMany({});
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

describe("PATCH /api/obra/:obraId/gastos/:gastoId", () => {
  it("edita un gasto existente (200) — AC-26", async () => {
    const { PATCH } = await import("@/app/api/obra/[obraId]/gastos/[gastoId]/route");
    const { constructor, obra, gasto } = await createConstructorConObraYGasto("editar-gasto");
    mockLoggedInAs(constructor);

    const res = await PATCH(
      req(`http://localhost/api/obra/${obra.id}/gastos/${gasto.id}`, "PATCH", { monto: 15000 }),
      { params: Promise.resolve({ obraId: obra.id, gastoId: gasto.id }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.monto).toBe(15000);
  });

  it("responde 403 si el gasto pertenece a la obra de otro constructor — AC-28", async () => {
    const { PATCH } = await import("@/app/api/obra/[obraId]/gastos/[gastoId]/route");
    const { obra, gasto } = await createConstructorConObraYGasto("gasto-dueno-a");
    const { constructor: constructorB } = await createConstructorConObraYGasto("gasto-dueno-b");
    mockLoggedInAs(constructorB);

    const res = await PATCH(
      req(`http://localhost/api/obra/${obra.id}/gastos/${gasto.id}`, "PATCH", { monto: 15000 }),
      { params: Promise.resolve({ obraId: obra.id, gastoId: gasto.id }) },
    );
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/obra/:obraId/gastos/:gastoId", () => {
  it("elimina el gasto de forma permanente (204) — AC-27", async () => {
    const { DELETE } = await import("@/app/api/obra/[obraId]/gastos/[gastoId]/route");
    const { constructor, obra, gasto } = await createConstructorConObraYGasto("eliminar-gasto");
    mockLoggedInAs(constructor);

    const res = await DELETE(
      req(`http://localhost/api/obra/${obra.id}/gastos/${gasto.id}`, "DELETE"),
      { params: Promise.resolve({ obraId: obra.id, gastoId: gasto.id }) },
    );
    expect(res.status).toBe(204);

    const stored = await prisma.gasto.findUnique({ where: { id: gasto.id } });
    expect(stored).toBeNull();
  });

  it("responde 403 si el gasto pertenece a la obra de otro constructor — AC-28", async () => {
    const { DELETE } = await import("@/app/api/obra/[obraId]/gastos/[gastoId]/route");
    const { obra, gasto } = await createConstructorConObraYGasto("eliminar-dueno-a");
    const { constructor: constructorB } = await createConstructorConObraYGasto("eliminar-dueno-b");
    mockLoggedInAs(constructorB);

    const res = await DELETE(
      req(`http://localhost/api/obra/${obra.id}/gastos/${gasto.id}`, "DELETE"),
      { params: Promise.resolve({ obraId: obra.id, gastoId: gasto.id }) },
    );
    expect(res.status).toBe(403);

    const stored = await prisma.gasto.findUnique({ where: { id: gasto.id } });
    expect(stored).not.toBeNull();
  });

  it("responde 404 si el gasto no existe", async () => {
    const { DELETE } = await import("@/app/api/obra/[obraId]/gastos/[gastoId]/route");
    const { constructor, obra } = await createConstructorConObraYGasto("eliminar-inexistente");
    mockLoggedInAs(constructor);

    const res = await DELETE(
      req(`http://localhost/api/obra/${obra.id}/gastos/no-existe`, "DELETE"),
      { params: Promise.resolve({ obraId: obra.id, gastoId: "no-existe" }) },
    );
    expect(res.status).toBe(404);
  });
});

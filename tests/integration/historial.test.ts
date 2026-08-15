import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import * as authModule from "@/lib/auth";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentConstructor: vi.fn() };
});

// contracts/reporte-historial.md GET /api/obra/:obraId/historial — AC-29, AC-20, FR-019, CHK024
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

function req(url: string) {
  return new Request(url, { method: "GET" });
}

function mockLoggedInAs(constructor: { id: string; email: string }) {
  vi.mocked(authModule.getCurrentConstructor).mockResolvedValue({
    id: constructor.id,
    email: constructor.email,
    nombre: "Test",
    apellido: "Test",
  });
}

async function setupObraConGastos(emailLocalPart: string) {
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
      presupuestoInicial: 500000,
    },
  });
  const tipos = await prisma.tipoGasto.findMany({ orderBy: { nombre: "asc" } });
  const [tipoA, tipoB] = tipos;

  await prisma.gasto.createMany({
    data: [
      { obraId: obra.id, tipoGastoId: tipoA.id, monto: 1000, moneda: "ARS", fecha: new Date("2026-01-05") },
      { obraId: obra.id, tipoGastoId: tipoB.id, monto: 2000, moneda: "ARS", fecha: new Date("2026-01-10") },
      { obraId: obra.id, tipoGastoId: tipoA.id, monto: 3000, moneda: "ARS", fecha: new Date("2026-01-20") },
    ],
  });

  return { constructor, obra, tipoA, tipoB };
}

beforeEach(async () => {
  // Scopeado: deleteMany({}) sin filtro borraría todos los gastos de la
  // base, no solo los de test.
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

describe("GET /api/obra/:obraId/historial", () => {
  it("devuelve todos los gastos ordenados cronológicamente — AC-29", async () => {
    const { GET } = await import("@/app/api/obra/[obraId]/historial/route");
    const { constructor, obra } = await setupObraConGastos("historial-sin-filtros");
    mockLoggedInAs(constructor);

    const res = await GET(req(`http://localhost/api/obra/${obra.id}/historial`), {
      params: Promise.resolve({ obraId: obra.id }),
    });
    expect(res.status).toBe(200);
    const historial = await res.json();
    expect(historial).toHaveLength(3);
    expect(historial.map((g: { monto: number }) => g.monto)).toEqual([1000, 2000, 3000]);
  });

  it("filtra por tipo de gasto", async () => {
    const { GET } = await import("@/app/api/obra/[obraId]/historial/route");
    const { constructor, obra, tipoA } = await setupObraConGastos("historial-tipo");
    mockLoggedInAs(constructor);

    const res = await GET(
      req(`http://localhost/api/obra/${obra.id}/historial?tipoGastoId=${tipoA.id}`),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    const historial = await res.json();
    expect(historial).toHaveLength(2);
    expect(historial.every((g: { tipoGastoId: string }) => g.tipoGastoId === tipoA.id)).toBe(true);
  });

  it("filtra por rango de fechas", async () => {
    const { GET } = await import("@/app/api/obra/[obraId]/historial/route");
    const { constructor, obra } = await setupObraConGastos("historial-rango");
    mockLoggedInAs(constructor);

    const res = await GET(
      req(
        `http://localhost/api/obra/${obra.id}/historial?fechaDesde=2026-01-06&fechaHasta=2026-01-15`,
      ),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    const historial = await res.json();
    expect(historial).toHaveLength(1);
    expect(historial[0].monto).toBe(2000);
  });

  it("rechaza un rango de fechas inválido (fechaDesde posterior a fechaHasta) — 400", async () => {
    const { GET } = await import("@/app/api/obra/[obraId]/historial/route");
    const { constructor, obra } = await setupObraConGastos("historial-rango-invalido");
    mockLoggedInAs(constructor);

    const res = await GET(
      req(
        `http://localhost/api/obra/${obra.id}/historial?fechaDesde=2026-01-20&fechaHasta=2026-01-01`,
      ),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });

  it("responde 403 si otro constructor intenta ver el historial — AC-20", async () => {
    const { GET } = await import("@/app/api/obra/[obraId]/historial/route");
    const { obra } = await setupObraConGastos("historial-dueno-a");
    const { constructor: constructorB } = await setupObraConGastos("historial-dueno-b");
    mockLoggedInAs(constructorB);

    const res = await GET(req(`http://localhost/api/obra/${obra.id}/historial`), {
      params: Promise.resolve({ obraId: obra.id }),
    });
    expect(res.status).toBe(403);
  });
});

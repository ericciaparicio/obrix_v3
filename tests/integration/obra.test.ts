import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import * as authModule from "@/lib/auth";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentConstructor: vi.fn() };
});

// contracts/obra.md — AC-01 a AC-05, AC-18, AC-19, AC-20
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

function obraRequest(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function validObraPayload(overrides: Record<string, unknown> = {}) {
  return {
    nombre: "Casa en Bariloche",
    pais: "Argentina",
    provincia: "Río Negro",
    localidad: "Bariloche",
    direccion: "Av. Bustillo 1234",
    latitud: -41.13,
    longitud: -71.31,
    fechaInicio: "2026-01-15",
    fechaFin: null,
    presupuestoInicial: 1000000,
    ...overrides,
  };
}

async function createConstructor(emailLocalPart: string) {
  return prisma.constructor.create({
    data: {
      email: `${emailLocalPart}${TEST_EMAIL_DOMAIN}`,
      passwordHash: "irrelevante-para-este-test",
      nombre: "Test",
      apellido: "Test",
      celular: "+5491100000000",
    },
  });
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

describe("POST /api/obra", () => {
  it("crea la obra (201) con datos válidos — AC-01, AC-04", async () => {
    const { POST } = await import("@/app/api/obra/route");
    const constructor = await createConstructor("obra-alta");
    mockLoggedInAs(constructor);

    const res = await POST(obraRequest("http://localhost/api/obra", "POST", validObraPayload()));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.presupuestoInicial).toBe(1000000);
  });

  it("rechaza si falta un campo obligatorio (400) — AC-02", async () => {
    const { POST } = await import("@/app/api/obra/route");
    const constructor = await createConstructor("obra-incompleta");
    mockLoggedInAs(constructor);

    const res = await POST(
      obraRequest("http://localhost/api/obra", "POST", validObraPayload({ nombre: "" })),
    );
    expect(res.status).toBe(400);
  });

  it("rechaza presupuesto cero, negativo o no numérico (400) — AC-05", async () => {
    const { POST } = await import("@/app/api/obra/route");
    const constructor = await createConstructor("obra-presupuesto-invalido");
    mockLoggedInAs(constructor);

    const res = await POST(
      obraRequest("http://localhost/api/obra", "POST", validObraPayload({ presupuestoInicial: 0 })),
    );
    expect(res.status).toBe(400);
  });

  it("rechaza una segunda obra del mismo constructor (409) — AC-03", async () => {
    const { POST } = await import("@/app/api/obra/route");
    const constructor = await createConstructor("obra-duplicada");
    mockLoggedInAs(constructor);

    await POST(obraRequest("http://localhost/api/obra", "POST", validObraPayload()));
    const res = await POST(obraRequest("http://localhost/api/obra", "POST", validObraPayload()));
    expect(res.status).toBe(409);
  });
});

describe("GET /api/obra/:obraId y /api/obra/me", () => {
  it("devuelve la obra propia (200) y el reporte sin gastos en cero — AC-18", async () => {
    const { POST } = await import("@/app/api/obra/route");
    const { GET: GET_BY_ID } = await import("@/app/api/obra/[obraId]/route");
    const { GET: GET_REPORTE } = await import("@/app/api/obra/[obraId]/reporte/route");
    const constructor = await createConstructor("obra-propia");
    mockLoggedInAs(constructor);

    const createRes = await POST(obraRequest("http://localhost/api/obra", "POST", validObraPayload()));
    const { id: obraId } = await createRes.json();

    const getRes = await GET_BY_ID(obraRequest(`http://localhost/api/obra/${obraId}`, "GET"), {
      params: Promise.resolve({ obraId }),
    });
    expect(getRes.status).toBe(200);

    const reporteRes = await GET_REPORTE(
      obraRequest(`http://localhost/api/obra/${obraId}/reporte`, "GET"),
      { params: Promise.resolve({ obraId }) },
    );
    expect(reporteRes.status).toBe(200);
    const reporte = await reporteRes.json();
    expect(reporte.presupuestoTotal).toBe(1000000);
    expect(reporte.gastado).toBe(0);
    expect(reporte.disponible).toBe(1000000);
    expect(reporte.porcentajeConsumido).toBe(0);
  });

  it("responde 403 si otro constructor intenta ver la obra — AC-20", async () => {
    const { POST } = await import("@/app/api/obra/route");
    const { GET: GET_BY_ID } = await import("@/app/api/obra/[obraId]/route");
    const constructorA = await createConstructor("obra-a");
    const constructorB = await createConstructor("obra-b");

    mockLoggedInAs(constructorA);
    const createRes = await POST(obraRequest("http://localhost/api/obra", "POST", validObraPayload()));
    const { id: obraId } = await createRes.json();

    mockLoggedInAs(constructorB);
    const res = await GET_BY_ID(obraRequest(`http://localhost/api/obra/${obraId}`, "GET"), {
      params: Promise.resolve({ obraId }),
    });
    expect(res.status).toBe(403);
  });

  it("responde 401 si no hay sesión", async () => {
    const { GET: GET_BY_ID } = await import("@/app/api/obra/[obraId]/route");
    vi.mocked(authModule.getCurrentConstructor).mockResolvedValue(null);

    const res = await GET_BY_ID(obraRequest("http://localhost/api/obra/inexistente", "GET"), {
      params: Promise.resolve({ obraId: "inexistente" }),
    });
    expect(res.status).toBe(401);
  });

  it("GET /api/obra/me responde 404 si el constructor no tiene obra creada", async () => {
    const { GET } = await import("@/app/api/obra/me/route");
    const constructor = await createConstructor("sin-obra");
    mockLoggedInAs(constructor);

    const res = await GET(obraRequest("http://localhost/api/obra/me", "GET"));
    expect(res.status).toBe(404);
  });
});

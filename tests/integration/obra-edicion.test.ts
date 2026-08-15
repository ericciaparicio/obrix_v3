import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import * as authModule from "@/lib/auth";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return { ...actual, getCurrentConstructor: vi.fn() };
});

// contracts/obra.md PATCH /api/obra/:obraId — AC-06 a AC-09
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

function req(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function createConstructorConObra(emailLocalPart: string) {
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
      nombre: "Obra Original",
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

describe("PATCH /api/obra/:obraId", () => {
  it("edita un dato de la obra con valor válido (200) — AC-06", async () => {
    const { PATCH } = await import("@/app/api/obra/[obraId]/route");
    const { constructor, obra } = await createConstructorConObra("editar-valido");
    mockLoggedInAs(constructor);

    const res = await PATCH(
      req(`http://localhost/api/obra/${obra.id}`, "PATCH", { direccion: "Nueva dirección 456" }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.direccion).toBe("Nueva dirección 456");
  });

  it("rechaza editar dejando un campo obligatorio vacío (400) — AC-07", async () => {
    const { PATCH } = await import("@/app/api/obra/[obraId]/route");
    const { constructor, obra } = await createConstructorConObra("editar-vacio");
    mockLoggedInAs(constructor);

    const res = await PATCH(
      req(`http://localhost/api/obra/${obra.id}`, "PATCH", { nombre: "" }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });

  it("edita el presupuesto inicial con valor válido (200) — AC-08", async () => {
    const { PATCH } = await import("@/app/api/obra/[obraId]/route");
    const { constructor, obra } = await createConstructorConObra("editar-presupuesto");
    mockLoggedInAs(constructor);

    const res = await PATCH(
      req(`http://localhost/api/obra/${obra.id}`, "PATCH", { presupuestoInicial: 250000 }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.presupuestoInicial).toBe(250000);
  });

  it("rechaza editar el presupuesto a cero, negativo o no numérico (400) — AC-09", async () => {
    const { PATCH } = await import("@/app/api/obra/[obraId]/route");
    const { constructor, obra } = await createConstructorConObra("editar-presupuesto-invalido");
    mockLoggedInAs(constructor);

    const res = await PATCH(
      req(`http://localhost/api/obra/${obra.id}`, "PATCH", { presupuestoInicial: -10 }),
      { params: Promise.resolve({ obraId: obra.id }) },
    );
    expect(res.status).toBe(400);
  });
});

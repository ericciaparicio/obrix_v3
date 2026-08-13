import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { verifyCredentials } from "@/lib/auth";
import middleware from "@/middleware";

// AC-19, AC-21, AC-25 — contracts/auth.md (login, middleware de sesión, logout)
const TEST_EMAIL = "sesion@test.obrix.local";
const TEST_PASSWORD = "SuperSegura123";

beforeAll(async () => {
  await prisma.constructor.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.constructor.create({
    data: {
      email: TEST_EMAIL,
      passwordHash: await hashPassword(TEST_PASSWORD),
      nombre: "Sesión",
      apellido: "Test",
      celular: "+5491100000000",
    },
  });
});

afterAll(async () => {
  await prisma.constructor.deleteMany({ where: { email: TEST_EMAIL } });
});

describe("Login (verifyCredentials) — AC-21", () => {
  it("rechaza credenciales con contraseña incorrecta", async () => {
    const user = await verifyCredentials(TEST_EMAIL, "contraseña-incorrecta");
    expect(user).toBeNull();
  });

  it("rechaza un email que no existe", async () => {
    const user = await verifyCredentials("no-existe@test.obrix.local", TEST_PASSWORD);
    expect(user).toBeNull();
  });

  it("acepta credenciales válidas", async () => {
    const user = await verifyCredentials(TEST_EMAIL, TEST_PASSWORD);
    expect(user).not.toBeNull();
    expect(user?.email).toBe(TEST_EMAIL);
  });
});

describe("Middleware de sesión — AC-19, AC-25", () => {
  it("responde 401 en una ruta protegida sin sesión (usuario no autenticado / tras logout)", async () => {
    const req = new NextRequest("http://localhost/api/obra/me");
    const res = await middleware(req, { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as Parameters<typeof middleware>[1]);
    expect(res?.status).toBe(401);
  });

  it("responde 401 en /api/tipos-gasto sin sesión", async () => {
    const req = new NextRequest("http://localhost/api/tipos-gasto");
    const res = await middleware(req, { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as Parameters<typeof middleware>[1]);
    expect(res?.status).toBe(401);
  });
});

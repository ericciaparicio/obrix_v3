import { describe, it, expect, afterEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";

// AC-22, AC-23, AC-24 — contracts/auth.md POST /api/auth/register
const TEST_EMAIL_DOMAIN = "@test.obrix.local";

function registerRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await prisma.constructor.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
  });
});

describe("POST /api/auth/register", () => {
  it("registra un constructor válido (201) y nunca persiste la contraseña en texto plano", async () => {
    const email = `registro-valido${TEST_EMAIL_DOMAIN}`;
    const res = await POST(
      registerRequest({
        email,
        password: "SuperSegura123",
        nombre: "Ana",
        apellido: "Gómez",
        celular: "+5491122334455",
      }),
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.email).toBe(email);
    expect(json).not.toHaveProperty("password");
    expect(json).not.toHaveProperty("passwordHash");

    const stored = await prisma.constructor.findUnique({ where: { email } });
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).not.toBe("SuperSegura123");
  });

  it("rechaza un email ya registrado (409) — AC-23", async () => {
    const email = `duplicado${TEST_EMAIL_DOMAIN}`;
    const payload = {
      email,
      password: "SuperSegura123",
      nombre: "Ana",
      apellido: "Gómez",
      celular: "+5491122334455",
    };

    await POST(registerRequest(payload));
    const res = await POST(registerRequest(payload));

    expect(res.status).toBe(409);
  });

  it("rechaza un email con formato inválido (400) — AC-24", async () => {
    const res = await POST(
      registerRequest({
        email: "no-es-un-email",
        password: "SuperSegura123",
        nombre: "Ana",
        apellido: "Gómez",
        celular: "+5491122334455",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("rechaza el registro si falta nombre, apellido o celular (400) — AC-24", async () => {
    const res = await POST(
      registerRequest({
        email: `sin-nombre${TEST_EMAIL_DOMAIN}`,
        password: "SuperSegura123",
        nombre: "",
        apellido: "Gómez",
        celular: "+5491122334455",
      }),
    );

    expect(res.status).toBe(400);
  });
});

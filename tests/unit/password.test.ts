import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

// FR-020/SC-008: las contraseñas nunca se persisten ni se devuelven en
// texto plano.
describe("hashPassword", () => {
  it("nunca devuelve la contraseña en texto plano", async () => {
    const plain = "SuperSegura123";
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash).not.toContain(plain);
  });

  it("genera un hash con el formato bcrypt ($2a$/$2b$)", async () => {
    const hash = await hashPassword("SuperSegura123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("produce hashes distintos para la misma contraseña (salt aleatorio)", async () => {
    const hash1 = await hashPassword("SuperSegura123");
    const hash2 = await hashPassword("SuperSegura123");
    expect(hash1).not.toBe(hash2);
  });

  it("verifyPassword valida correctamente contra el hash generado", async () => {
    const hash = await hashPassword("SuperSegura123");
    expect(await verifyPassword("SuperSegura123", hash)).toBe(true);
    expect(await verifyPassword("otra-contraseña", hash)).toBe(false);
  });
});

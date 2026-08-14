import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import middleware from "@/middleware";

// FR-005/RNF-03: la sesión JWT expira a los 30 minutos de inactividad.
// Mintea cookies de sesión reales (mismo secreto/algoritmo que Auth.js v5)
// para probar la expiración end-to-end a través del middleware, sin
// necesidad de esperar 30 minutos reales.
const SESSION_COOKIE_NAME = "authjs.session-token";

async function mintSessionCookie(maxAgeSeconds: number) {
  const token = await encode({
    token: { sub: "constructor-de-prueba", constructorId: "constructor-de-prueba" },
    secret: process.env.AUTH_SECRET!,
    salt: SESSION_COOKIE_NAME,
    maxAge: maxAgeSeconds,
  });
  return `${SESSION_COOKIE_NAME}=${token}`;
}

function protectedRequestWithCookie(cookie: string) {
  return new NextRequest("http://localhost/api/obra/me", {
    // Auth.js resuelve internamente una URL de acción a partir de
    // "x-forwarded-proto" (o cae a "https" si no está presente), lo que
    // determina si busca la cookie con prefijo "__Secure-". Sin este header
    // esperaría el nombre de cookie equivocado y la sesión se perdería
    // incluso siendo válida.
    headers: { cookie, "x-forwarded-proto": "http" },
  });
}

const fakeMiddlewareEvent = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as Parameters<typeof middleware>[1];

describe("Expiración de sesión por inactividad", () => {
  it("un token JWT ya vencido (30+ min de inactividad) responde 401 en una ruta protegida", async () => {
    // maxAge negativo => `exp` queda en el pasado, simulando que ya pasaron
    // los 30 minutos de inactividad sin necesidad de esperarlos.
    const cookie = await mintSessionCookie(-60);
    const res = await middleware(protectedRequestWithCookie(cookie), fakeMiddlewareEvent);
    expect(res?.status).toBe(401);
  });

  it("un token JWT todavía vigente permite el acceso a una ruta protegida", async () => {
    const cookie = await mintSessionCookie(30 * 60);
    const res = await middleware(protectedRequestWithCookie(cookie), fakeMiddlewareEvent);
    // El middleware deja pasar el request (no devuelve 401); la propia
    // ruta puede seguir aplicando sus propias reglas de negocio.
    expect(res?.status).not.toBe(401);
  });
});

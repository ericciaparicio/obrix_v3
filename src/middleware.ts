import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Instancia propia y liviana (sin el Credentials provider de src/lib/auth.ts,
// que depende de bcryptjs/Prisma — APIs de Node no soportadas en el Edge
// Runtime donde corre este middleware). Solo necesita `auth` para leer la
// sesión JWT ya emitida.
const { auth } = NextAuth(authConfig);

// FR-003/AC-19: cualquier acceso no autenticado a rutas de obra/gastos
// responde 401 sin exponer datos. Ver contracts/auth.md.
export default auth((req) => {
  if (!req.auth) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/api/obra/:path*", "/api/tipos-gasto"],
};

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

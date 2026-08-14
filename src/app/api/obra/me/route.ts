import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { obtenerObraDeConstructor } from "@/lib/services/obra";

export async function GET(_request: Request) {
  const constructor = await getCurrentConstructor();
  if (!constructor) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const obra = await obtenerObraDeConstructor(constructor.id);
  if (!obra) {
    return NextResponse.json({ error: "Todavía no registraste tu obra" }, { status: 404 });
  }

  return NextResponse.json({ ...obra, presupuestoInicial: Number(obra.presupuestoInicial) });
}

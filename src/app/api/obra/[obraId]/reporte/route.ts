import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { obtenerObraPorId } from "@/lib/services/obra";
import { calcularReporte } from "@/lib/services/reporte";

type RouteParams = { params: Promise<{ obraId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const constructor = await getCurrentConstructor();
  if (!constructor) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { obraId } = await params;
  const obra = await obtenerObraPorId(obraId);
  if (!obra) {
    return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
  }
  if (obra.constructorId !== constructor.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const reporte = await calcularReporte(obraId);
  return NextResponse.json(reporte);
}

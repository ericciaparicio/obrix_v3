import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { obtenerObraPorId } from "@/lib/services/obra";
import { obtenerHistorial } from "@/lib/services/gastos";

type RouteParams = { params: Promise<{ obraId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
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

  const url = new URL(request.url);
  const tipoGastoId = url.searchParams.get("tipoGastoId") ?? undefined;
  const fechaDesdeParam = url.searchParams.get("fechaDesde");
  const fechaHastaParam = url.searchParams.get("fechaHasta");
  const fechaDesde = fechaDesdeParam ? new Date(fechaDesdeParam) : undefined;
  const fechaHasta = fechaHastaParam ? new Date(fechaHastaParam) : undefined;

  // CHK024: rango de fechas inválido si "desde" es posterior a "hasta".
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    return NextResponse.json(
      { error: "El rango de fechas es inválido: 'desde' es posterior a 'hasta'" },
      { status: 400 },
    );
  }

  const historial = await obtenerHistorial(obraId, { tipoGastoId, fechaDesde, fechaHasta });
  return NextResponse.json(
    historial.map((g) => ({
      id: g.id,
      fecha: g.fecha,
      tipoGastoId: g.tipoGastoId,
      tipoGastoNombre: g.tipoGasto.nombre,
      monto: Number(g.monto),
      descripcion: g.descripcion,
    })),
  );
}

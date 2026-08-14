import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { obtenerGastoPorId, editarGasto, eliminarGasto } from "@/lib/services/gastos";
import { updateGastoSchema } from "@/lib/validations/gasto";

type RouteParams = { params: Promise<{ obraId: string; gastoId: string }> };

async function autorizarGasto(gastoId: string, obraId: string, constructorId: string) {
  const gasto = await obtenerGastoPorId(gastoId);
  if (!gasto || gasto.obraId !== obraId) {
    return { error: NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 }) };
  }
  if (gasto.obra.constructorId !== constructorId) {
    // AC-28: un constructor no puede editar/eliminar un gasto de otro.
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { gasto };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const constructor = await getCurrentConstructor();
  if (!constructor) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { obraId, gastoId } = await params;
  const { error } = await autorizarGasto(gastoId, obraId, constructor.id);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateGastoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de gasto inválidos" },
      { status: 400 },
    );
  }

  const actualizado = await editarGasto(gastoId, parsed.data);
  return NextResponse.json({ ...actualizado, monto: Number(actualizado.monto) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const constructor = await getCurrentConstructor();
  if (!constructor) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { obraId, gastoId } = await params;
  const { error } = await autorizarGasto(gastoId, obraId, constructor.id);
  if (error) return error;

  await eliminarGasto(gastoId);
  return new NextResponse(null, { status: 204 });
}

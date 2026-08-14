import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { obtenerObraPorId } from "@/lib/services/obra";
import { crearGasto } from "@/lib/services/gastos";
import { createGastoSchema } from "@/lib/validations/gasto";

type RouteParams = { params: Promise<{ obraId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
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

  const body = await request.json().catch(() => null);
  const parsed = createGastoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de gasto inválidos" },
      { status: 400 },
    );
  }

  // AC-16: se acepta igual aunque supere el saldo disponible de la obra —
  // no hay tope superior de validación contra el presupuesto.
  const gasto = await crearGasto(obraId, parsed.data);
  return NextResponse.json(
    { ...gasto, monto: Number(gasto.monto) },
    { status: 201 },
  );
}

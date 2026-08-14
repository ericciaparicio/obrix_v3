import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { createObraSchema } from "@/lib/validations/obra";
import { crearObra, ObraYaExisteError } from "@/lib/services/obra";

export async function POST(request: Request) {
  const constructor = await getCurrentConstructor();
  if (!constructor) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createObraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de obra inválidos" },
      { status: 400 },
    );
  }

  try {
    const obra = await crearObra(constructor.id, parsed.data);
    return NextResponse.json(
      { ...obra, presupuestoInicial: Number(obra.presupuestoInicial) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ObraYaExisteError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}

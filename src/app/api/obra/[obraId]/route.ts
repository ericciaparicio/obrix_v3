import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { updateObraSchema } from "@/lib/validations/obra";
import { obtenerObraPorId, editarObra } from "@/lib/services/obra";

type RouteParams = { params: Promise<{ obraId: string }> };

function serialize(obra: NonNullable<Awaited<ReturnType<typeof obtenerObraPorId>>>) {
  return { ...obra, presupuestoInicial: Number(obra.presupuestoInicial) };
}

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
    // AC-20: un constructor no puede ver la obra de otro.
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(serialize(obra));
}

export async function PATCH(request: Request, { params }: RouteParams) {
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
  const parsed = updateObraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de obra inválidos" },
      { status: 400 },
    );
  }

  const actualizada = await editarObra(obraId, parsed.data);
  return NextResponse.json(serialize(actualizada));
}

import { NextResponse } from "next/server";
import { getCurrentConstructor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const constructor = await getCurrentConstructor();
  if (!constructor) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const tipos = await prisma.tipoGasto.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(tipos);
}

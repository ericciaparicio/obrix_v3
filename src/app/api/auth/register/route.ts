import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos de registro inválidos" },
      { status: 400 },
    );
  }

  const { email, password, nombre, apellido, celular } = parsed.data;

  const existing = await prisma.constructor.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "El email ya está registrado" },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const constructor = await prisma.constructor.create({
    data: { email, passwordHash, nombre, apellido, celular },
  });

  return NextResponse.json(
    { id: constructor.id, email: constructor.email },
    { status: 201 },
  );
}

import { prisma } from "@/lib/prisma";
import type { CreateGastoInput } from "@/lib/validations/gasto";

export async function crearGasto(obraId: string, data: CreateGastoInput) {
  return prisma.gasto.create({
    data: {
      obraId,
      tipoGastoId: data.tipoGastoId,
      monto: data.monto,
      moneda: data.moneda,
      fecha: data.fecha,
    },
  });
}

export async function obtenerGastoPorId(gastoId: string) {
  return prisma.gasto.findUnique({ where: { id: gastoId }, include: { obra: true } });
}

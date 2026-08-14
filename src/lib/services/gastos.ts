import { prisma } from "@/lib/prisma";
import type { CreateGastoInput, UpdateGastoInput } from "@/lib/validations/gasto";

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

// Listado simple (sin filtros) para la pantalla de edición/eliminación de
// gastos (US5). El historial filtrable completo es responsabilidad de US6.
export async function listarGastosDeObra(obraId: string) {
  return prisma.gasto.findMany({
    where: { obraId },
    include: { tipoGasto: true },
    orderBy: { fecha: "desc" },
  });
}

// FR-015 (US5): edita cualquier campo de un gasto ya registrado.
export async function editarGasto(gastoId: string, data: UpdateGastoInput) {
  return prisma.gasto.update({
    where: { id: gastoId },
    data: {
      ...(data.tipoGastoId !== undefined && { tipoGastoId: data.tipoGastoId }),
      ...(data.monto !== undefined && { monto: data.monto }),
      ...(data.moneda !== undefined && { moneda: data.moneda }),
      ...(data.fecha !== undefined && { fecha: data.fecha }),
    },
  });
}

// FR-016 (US5): eliminación permanente (hard delete).
export async function eliminarGasto(gastoId: string) {
  return prisma.gasto.delete({ where: { id: gastoId } });
}

export type FiltrosHistorial = {
  tipoGastoId?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
};

// FR-017 (US6): historial ordenado cronológicamente, filtrable por tipo y
// por rango de fechas.
export async function obtenerHistorial(obraId: string, filtros: FiltrosHistorial = {}) {
  return prisma.gasto.findMany({
    where: {
      obraId,
      ...(filtros.tipoGastoId && { tipoGastoId: filtros.tipoGastoId }),
      ...(filtros.fechaDesde || filtros.fechaHasta
        ? {
            fecha: {
              ...(filtros.fechaDesde && { gte: filtros.fechaDesde }),
              ...(filtros.fechaHasta && { lte: filtros.fechaHasta }),
            },
          }
        : {}),
    },
    include: { tipoGasto: true },
    orderBy: { fecha: "asc" },
  });
}

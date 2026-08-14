import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type DesgloseTipo = {
  tipoGastoId: string;
  nombre: string;
  monto: number;
};

export type ReporteFinanciero = {
  presupuestoTotal: number;
  gastado: number;
  disponible: number;
  porcentajeConsumido: number;
  desglosePorTipo: DesgloseTipo[];
};

// FR-018: presupuesto total, gastado, disponible (puede quedar negativo,
// AC-16), % consumido (0% sin gastos, AC-18) y desglose por tipo.
export async function calcularReporte(obraId: string): Promise<ReporteFinanciero | null> {
  const obra = await prisma.obra.findUnique({ where: { id: obraId } });
  if (!obra) {
    return null;
  }

  const presupuestoTotal = Number(obra.presupuestoInicial);

  const gastosPorTipo = await prisma.gasto.groupBy({
    by: ["tipoGastoId"],
    where: { obraId },
    _sum: { monto: true },
  });

  const gastado = gastosPorTipo.reduce(
    (acc, g) => acc + Number(g._sum.monto ?? new Prisma.Decimal(0)),
    0,
  );

  const disponible = presupuestoTotal - gastado;
  // Redondeado a 2 decimales para evitar artefactos de punto flotante
  // (ej. 33.333333333333336) en la respuesta de la API.
  const porcentajeConsumido =
    presupuestoTotal > 0 ? Math.round((gastado / presupuestoTotal) * 10000) / 100 : 0;

  const desglosePorTipo: DesgloseTipo[] = await Promise.all(
    gastosPorTipo.map(async (g) => {
      const tipoGasto = await prisma.tipoGasto.findUniqueOrThrow({
        where: { id: g.tipoGastoId },
      });
      return {
        tipoGastoId: g.tipoGastoId,
        nombre: tipoGasto.nombre,
        monto: Number(g._sum.monto ?? 0),
      };
    }),
  );

  return { presupuestoTotal, gastado, disponible, porcentajeConsumido, desglosePorTipo };
}

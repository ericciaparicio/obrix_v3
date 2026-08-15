import { prisma } from "@/lib/prisma";
import type { CreateObraInput, UpdateObraInput } from "@/lib/validations/obra";

export class ObraYaExisteError extends Error {
  constructor() {
    super("Ya tenés una obra registrada; solo se permite una obra por constructor");
    this.name = "ObraYaExisteError";
  }
}

// AC-03/FR-007: unicidad de "una obra ACTIVA por constructor" reforzada acá.
// No hay constraint @unique en constructorId a nivel de schema porque un
// constructor puede tener varias filas de Obra a lo largo del tiempo (una
// activa + N dadas de baja); ver Obra.eliminadaEn.
export async function crearObra(constructorId: string, data: CreateObraInput) {
  const existing = await obtenerObraDeConstructor(constructorId);
  if (existing) {
    throw new ObraYaExisteError();
  }

  return prisma.obra.create({
    data: {
      constructorId,
      nombre: data.nombre,
      pais: data.pais,
      provincia: data.provincia,
      localidad: data.localidad,
      direccion: data.direccion,
      latitud: data.latitud,
      longitud: data.longitud,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin ?? null,
      presupuestoInicial: data.presupuestoInicial,
    },
  });
}

// Una obra dada de baja se trata como inexistente para el resto de la app
// (no aparece más, sus gastos dejan de ser accesibles) — ver eliminarObra.
export async function obtenerObraPorId(obraId: string) {
  return prisma.obra.findFirst({ where: { id: obraId, eliminadaEn: null } });
}

export async function obtenerObraDeConstructor(constructorId: string) {
  return prisma.obra.findFirst({ where: { constructorId, eliminadaEn: null } });
}

// FR-008/FR-010 (US4): edición de datos de obra y/o presupuesto.
export async function editarObra(obraId: string, data: UpdateObraInput) {
  return prisma.obra.update({
    where: { id: obraId },
    data: {
      ...(data.nombre !== undefined && { nombre: data.nombre }),
      ...(data.pais !== undefined && { pais: data.pais }),
      ...(data.provincia !== undefined && { provincia: data.provincia }),
      ...(data.localidad !== undefined && { localidad: data.localidad }),
      ...(data.direccion !== undefined && { direccion: data.direccion }),
      ...(data.latitud !== undefined && { latitud: data.latitud }),
      ...(data.longitud !== undefined && { longitud: data.longitud }),
      ...(data.fechaInicio !== undefined && { fechaInicio: data.fechaInicio }),
      ...(data.fechaFin !== undefined && { fechaFin: data.fechaFin }),
      ...(data.presupuestoInicial !== undefined && {
        presupuestoInicial: data.presupuestoInicial,
      }),
    },
  });
}

// Baja lógica: no se borra la fila ni sus Gastos (quedan archivados), solo
// se marca eliminadaEn. Libera el "cupo" de una obra activa por constructor.
export async function eliminarObra(obraId: string) {
  return prisma.obra.update({
    where: { id: obraId },
    data: { eliminadaEn: new Date() },
  });
}

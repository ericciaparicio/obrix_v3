import { prisma } from "@/lib/prisma";
import type { CreateObraInput, UpdateObraInput } from "@/lib/validations/obra";

export class ObraYaExisteError extends Error {
  constructor() {
    super("Ya tenés una obra registrada; solo se permite una obra por constructor");
    this.name = "ObraYaExisteError";
  }
}

// AC-03/FR-007: unicidad reforzada acá (mensaje claro) y por el constraint
// @unique de constructorId en el schema (protege ante condiciones de carrera).
export async function crearObra(constructorId: string, data: CreateObraInput) {
  const existing = await prisma.obra.findUnique({ where: { constructorId } });
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

export async function obtenerObraPorId(obraId: string) {
  return prisma.obra.findUnique({ where: { id: obraId } });
}

export async function obtenerObraDeConstructor(constructorId: string) {
  return prisma.obra.findUnique({ where: { constructorId } });
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

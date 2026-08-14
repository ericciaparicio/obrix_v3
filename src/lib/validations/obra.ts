import { z } from "zod";

const nonEmpty = (field: string) => z.string().trim().min(1, `${field} es obligatorio`);

export const createObraSchema = z.object({
  nombre: nonEmpty("El nombre"),
  pais: nonEmpty("El país"),
  provincia: nonEmpty("La provincia"),
  localidad: nonEmpty("La localidad"),
  direccion: nonEmpty("La dirección"),
  latitud: z.number({ message: "La latitud es obligatoria" }),
  longitud: z.number({ message: "La longitud es obligatoria" }),
  fechaInicio: z.coerce.date({ message: "La fecha de inicio es obligatoria" }),
  fechaFin: z.coerce.date().nullable().optional(),
  presupuestoInicial: z
    .number({ message: "El presupuesto es obligatorio" })
    .positive("El presupuesto debe ser mayor a cero"),
});

export type CreateObraInput = z.infer<typeof createObraSchema>;

// FR-008/FR-010: edición — mismos campos pero todos opcionales; si vienen
// presentes deben seguir cumpliendo las mismas reglas de "no vacío"/">0".
export const updateObraSchema = z.object({
  nombre: nonEmpty("El nombre").optional(),
  pais: nonEmpty("El país").optional(),
  provincia: nonEmpty("La provincia").optional(),
  localidad: nonEmpty("La localidad").optional(),
  direccion: nonEmpty("La dirección").optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  fechaInicio: z.coerce.date().optional(),
  fechaFin: z.coerce.date().nullable().optional(),
  presupuestoInicial: z
    .number()
    .positive("El presupuesto debe ser mayor a cero")
    .optional(),
});

export type UpdateObraInput = z.infer<typeof updateObraSchema>;

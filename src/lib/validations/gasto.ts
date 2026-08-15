import { z } from "zod";

const descripcionSchema = z
  .string()
  .trim()
  .max(500, "La descripción no puede superar los 500 caracteres")
  .optional();

export const createGastoSchema = z.object({
  tipoGastoId: z.string({ message: "El tipo de gasto es obligatorio" }).min(1, "El tipo de gasto es obligatorio"),
  monto: z.number({ message: "El monto es obligatorio" }).positive("El monto debe ser mayor a cero"),
  moneda: z.literal("ARS", { message: "La única moneda aceptada es pesos (ARS)" }),
  fecha: z.coerce.date({ message: "La fecha es obligatoria" }),
  // Opcional: no forma parte de los requisitos originales del PRD, se
  // agregó a pedido explícito del usuario.
  descripcion: descripcionSchema,
});

export type CreateGastoInput = z.infer<typeof createGastoSchema>;

// FR-015 (US5): edición — mismos campos, todos opcionales.
export const updateGastoSchema = z.object({
  tipoGastoId: z.string().min(1).optional(),
  monto: z.number().positive("El monto debe ser mayor a cero").optional(),
  moneda: z.literal("ARS", { message: "La única moneda aceptada es pesos (ARS)" }).optional(),
  fecha: z.coerce.date().optional(),
  descripcion: descripcionSchema,
});

export type UpdateGastoInput = z.infer<typeof updateGastoSchema>;

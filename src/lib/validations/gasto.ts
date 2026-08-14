import { z } from "zod";

export const createGastoSchema = z.object({
  tipoGastoId: z.string({ message: "El tipo de gasto es obligatorio" }).min(1, "El tipo de gasto es obligatorio"),
  monto: z.number({ message: "El monto es obligatorio" }).positive("El monto debe ser mayor a cero"),
  moneda: z.literal("ARS", { message: "La única moneda aceptada es pesos (ARS)" }),
  fecha: z.coerce.date({ message: "La fecha es obligatoria" }),
});

export type CreateGastoInput = z.infer<typeof createGastoSchema>;

// FR-015 (US5): edición — mismos campos, todos opcionales.
export const updateGastoSchema = z.object({
  tipoGastoId: z.string().min(1).optional(),
  monto: z.number().positive("El monto debe ser mayor a cero").optional(),
  moneda: z.literal("ARS", { message: "La única moneda aceptada es pesos (ARS)" }).optional(),
  fecha: z.coerce.date().optional(),
});

export type UpdateGastoInput = z.infer<typeof updateGastoSchema>;

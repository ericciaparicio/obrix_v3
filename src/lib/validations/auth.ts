import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  apellido: z.string().trim().min(1, "El apellido es obligatorio"),
  celular: z.string().trim().min(1, "El celular es obligatorio"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

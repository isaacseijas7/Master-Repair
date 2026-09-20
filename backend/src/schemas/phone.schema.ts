import { z } from "zod";

export const createPhoneSchema = z.object({
  brandId: z
    .string({ required_error: "La marca es requerida" })
    .regex(/^[0-9a-fA-F]{24}$/, "Marca inválida"),
  phoneModel: z
    .string()
    .trim()
    .min(1, "El modelo es requerido")
    .max(150, "Máximo 150 caracteres"),
  // USD con máximo 2 decimales.
  salePrice: z
    .number({ invalid_type_error: "El precio de venta debe ser un número" })
    .positive("El precio de venta debe ser mayor a 0")
    .max(1_000_000, "El precio de venta es demasiado alto")
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, {
      message: "El precio admite máximo 2 decimales",
    }),
});

export const updatePhoneSchema = createPhoneSchema.partial();

export type CreatePhoneInput = z.infer<typeof createPhoneSchema>;
export type UpdatePhoneInput = z.infer<typeof updatePhoneSchema>;

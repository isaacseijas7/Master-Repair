import { z } from "zod";

// USD, mayor a 0 y con máximo 2 decimales.
const usdPrice = (label: string) =>
  z
    .number({ invalid_type_error: `${label} debe ser un número` })
    .positive(`${label} debe ser mayor a 0`)
    .max(1_000_000, `${label} es demasiado alto`)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, {
      message: `${label} admite máximo 2 decimales`,
    });

export const createScreenSchema = z.object({
  brandId: z
    .string({ required_error: "La marca es requerida" })
    .regex(/^[0-9a-fA-F]{24}$/, "Marca inválida"),
  screenModel: z
    .string()
    .trim()
    .min(1, "El modelo es requerido")
    .max(150, "Máximo 150 caracteres"),
  salePrice: usdPrice("El precio de venta al por mayor"),
  // Opcionales; `null` los deja vacíos (permite borrar un valor al editar).
  unitSalePrice: usdPrice("El precio de venta unitario").nullable().optional(),
  purchasePrice: usdPrice("El precio de compra").nullable().optional(),
  isMechanic: z.boolean({ invalid_type_error: "Valor inválido" }).optional(),
});

export const updateScreenSchema = createScreenSchema.partial();

export type CreateScreenInput = z.infer<typeof createScreenSchema>;
export type UpdateScreenInput = z.infer<typeof updateScreenSchema>;

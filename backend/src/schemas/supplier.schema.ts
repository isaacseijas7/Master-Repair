import { z } from "zod";

// Antes no existía ningún schema de validación para Proveedor: el email no
// se validaba como email, y no había límites de longitud en ningún campo
// más allá de lo mínimo que exige Mongoose.
export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "Máximo 150 caracteres"),
  contactName: z.string().max(150, "Máximo 150 caracteres").optional().or(z.literal("")),
  email: z.string().email("Email inválido").max(150).optional().or(z.literal("")),
  phone: z.string().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  address: z.string().max(300, "Máximo 300 caracteres").optional().or(z.literal("")),
  taxId: z.string().max(50, "Máximo 50 caracteres").optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

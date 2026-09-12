import { z } from "zod";

// Antes no existía ningún schema de validación para Categoría: el campo
// "color" aceptaba cualquier string sin verificar que fuera un color
// hexadecimal válido, y no había límites de longitud más allá de lo mínimo
// que exige Mongoose. Este schema formaliza esas reglas.
const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "El color debe ser un valor hexadecimal válido (ej. #3B82F6)");

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  color: hexColor.optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

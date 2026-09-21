import { z } from "zod";

// Antes Cliente no tenía ningún schema de validación formal: el controlador
// pasaba request.body directo al servicio. Esto agrega validación de
// formato (antes solo existía para el email, de forma manual) y cierra el
// hallazgo de la auditoría sobre falta de validación de pantalla.
const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(150, "Máximo 150 caracteres"),
  email: z.string().trim().email("Email inválido").max(150).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Teléfono inválido")
    .max(30)
    .optional()
    .or(z.literal("")),
});

export const updateClientSchema = createClientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

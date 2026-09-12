import { z } from "zod";
import { UserRole } from "../models/User";

const roleEnum = z.enum([
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.CASHIER,
]);

// Misma política de complejidad que profile.schema.ts en el frontend (ver
// PasswordForm): al menos una mayúscula, una minúscula y un número.
const passwordField = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(100, "Máximo 100 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Debe incluir al menos una mayúscula, una minúscula y un número",
  );

export const createUserSchema = z.object({
  email: z.string().email("Email inválido").max(150, "Máximo 150 caracteres"),
  password: passwordField,
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  role: roleEnum,
  isActive: z.boolean().optional(),
});

// Sin password: el reseteo de contraseña de otros usuarios queda fuera de
// alcance de este módulo (cada usuario cambia la suya en Perfil > Seguridad).
export const updateUserSchema = z.object({
  email: z.string().email("Email inválido").max(150).optional(),
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

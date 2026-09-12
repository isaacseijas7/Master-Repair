import { z } from "zod";
import { UserRole } from "@/types";

const roleEnum = z.enum([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]);

// Misma regla de complejidad que profile.schema.ts (PasswordForm), para
// mantener una sola política de contraseñas en todo el sistema.
const passwordField = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(100, "Máximo 100 caracteres")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
    "Debe incluir al menos una mayúscula, una minúscula y un número",
  );

export const createUserFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  email: z.string().email("Email inválido"),
  password: passwordField,
  role: roleEnum,
  isActive: z.boolean(),
});

// Sin password: editar un usuario existente no permite fijarle una nueva
// contraseña desde este módulo.
export const updateUserFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "Máximo 50 caracteres"),
  email: z.string().email("Email inválido"),
  role: roleEnum,
  isActive: z.boolean(),
});

export type CreateUserFormData = z.infer<typeof createUserFormSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserFormSchema>;

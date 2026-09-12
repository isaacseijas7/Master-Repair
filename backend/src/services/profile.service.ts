import { User } from "../models/User";
import { authService } from "./auth.service";
import {
  UpdateProfileInput,
  ChangePasswordInput,
} from "../schemas/profile.schema";

export class ProfileService {
  async getProfile(userId: string) {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // Verificar si el email ya está en uso por otro usuario
    const existingUser = await User.findOne({
      email: data.email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new Error("El email ya está registrado por otro usuario");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      throw new Error("Usuario no encontrado");
    }

    return updatedUser;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Verificar contraseña actual
    const isPasswordValid = await user.comparePassword(data.currentPassword);
    if (!isPasswordValid) {
      throw new Error("La contraseña actual es incorrecta");
    }

    // Actualizar contraseña. tokenVersion sube para invalidar cualquier
    // token ya emitido (ver auth.middleware.ts) — si esta contraseña se
    // cambió por sospecha de robo de credenciales, cierra también las
    // sesiones que ya estuvieran abiertas con la contraseña anterior.
    user.password = data.newPassword;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();

    // Reemitimos el token de esta misma sesión con la tokenVersion nueva
    // para que quien acaba de cambiar su propia contraseña no quede
    // deslogueado de inmediato por el chequeo que él mismo activó.
    const token = authService.generateToken(user);

    return { message: "Contraseña actualizada exitosamente", token };
  }
}

export const profileService = new ProfileService();

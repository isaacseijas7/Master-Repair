import { User } from "../models/User";
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

    // Actualizar contraseña
    user.password = data.newPassword;
    await user.save();

    return { message: "Contraseña actualizada exitosamente" };
  }
}

export const profileService = new ProfileService();

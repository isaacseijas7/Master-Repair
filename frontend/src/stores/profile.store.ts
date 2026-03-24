import { create } from "zustand";
import { profileService, type User } from "@/services/profile.service";
import type {
  ProfileFormData,
  PasswordFormData,
} from "@/schemas/profile.schema";

interface ProfileState {
  user: User | null;
  isLoading: boolean;
  isUpdating: boolean;
  isChangingPassword: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: ProfileFormData) => Promise<boolean>;
  changePassword: (data: PasswordFormData) => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  user: null,
  isLoading: false,
  isUpdating: false,
  isChangingPassword: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await profileService.getProfile();
      set({ user, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al cargar el perfil",
        isLoading: false,
      });
    }
  },

  updateProfile: async (data: ProfileFormData) => {
    set({ isUpdating: true, error: null });
    try {
      const user = await profileService.updateProfile(data);
      set({ user, isUpdating: false });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al actualizar el perfil",
        isUpdating: false,
      });
      return false;
    }
  },

  changePassword: async (data: PasswordFormData) => {
    set({ isChangingPassword: true, error: null });
    try {
      await profileService.changePassword(data);
      set({ isChangingPassword: false });
      return true;
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Error al cambiar la contraseña",
        isChangingPassword: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: User) => set({ user }),
}));

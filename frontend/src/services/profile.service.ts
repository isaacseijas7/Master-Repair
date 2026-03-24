import apiClient from "./api.service";
import type { ApiResponse } from "@/types";
import type {
  ProfileFormData,
  PasswordFormData,
} from "@/schemas/profile.schema";

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'cashier';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const response =
      await apiClient.get<ApiResponse<{ user: User }>>("/profile");
    return response.data.data!.user;
  },

  async updateProfile(data: ProfileFormData): Promise<User> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      "/profile",
      data,
    );
    return response.data.data!.user;
  },

  async changePassword(data: PasswordFormData): Promise<void> {
    await apiClient.put<ApiResponse<void>>("/profile/password", data);
  },
};

import apiClient from './api.service';
import type { LoginInput, CreateUserInput, User, ApiResponse } from '@/types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  },

  async register(userData: CreateUserInput): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    return response.data.data!;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile');
    return response.data.data!.user;
  },

  async refreshToken(): Promise<{ token: string; user: User }> {
    const response = await apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/refresh');
    return response.data.data!;
  },
};

import apiClient from "./api.service";
import type {
  ApiResponse,
  CreateUserInput,
  PaginatedResponse,
  PaginationParams,
  UpdateUserInput,
  User,
} from "@/types";

export interface UserFilters extends PaginationParams {
  role?: string;
  isActive?: boolean;
}

// Deliberadamente independiente de authService.register: ese endpoint
// devuelve {user, token} y está pensado para autenticar la sesión de quien
// se registra, así que usarlo aquí cerraría la sesión del admin que está
// creando el usuario. Este service llama a /users, que solo devuelve el
// usuario creado sin tocar la sesión actual.
export const userService = {
  async getUsers(
    params: UserFilters = {},
  ): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.role) queryParams.append("role", params.role);
    if (params.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());

    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      `/users?${queryParams}`,
    );
    return response.data.data!;
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      `/users/${id}`,
    );
    return response.data.data!.user;
  },

  async createUser(data: CreateUserInput): Promise<User> {
    const response = await apiClient.post<ApiResponse<{ user: User }>>(
      "/users",
      data,
    );
    return response.data.data!.user;
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      `/users/${id}`,
      data,
    );
    return response.data.data!.user;
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

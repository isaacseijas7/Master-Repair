import { create } from "zustand";
import type { CreateUserInput, UpdateUserInput, User } from "@/types";
import { userService, type UserFilters } from "@/services/user.service";

interface UserState {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  error: string | null;

  fetchUsers: (params?: UserFilters) => Promise<void>;
  createUser: (data: CreateUserInput) => Promise<User>;
  updateUser: (id: string, data: UpdateUserInput) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  clearError: () => void;
}

// Ver client.store.ts / product.store.ts: evita que una respuesta de
// fetchUsers llegada tarde pise resultados de una búsqueda más reciente.
let latestUsersRequestId = 0;

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    const requestId = ++latestUsersRequestId;
    set({ isLoading: true, error: null });
    try {
      const response = await userService.getUsers(params);
      if (requestId !== latestUsersRequestId) return;
      set({
        users: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      if (requestId !== latestUsersRequestId) return;
      set({
        error: error.response?.data?.message || "Error al cargar usuarios",
        isLoading: false,
      });
    }
  },

  createUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userService.createUser(data);
      await get().fetchUsers();
      set({ isLoading: false });
      return user;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al crear el usuario",
        isLoading: false,
      });
      throw error;
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userService.updateUser(id, data);
      await get().fetchUsers();
      set({ isLoading: false });
      return user;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al actualizar el usuario",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await userService.deleteUser(id);
      await get().fetchUsers();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al eliminar el usuario",
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

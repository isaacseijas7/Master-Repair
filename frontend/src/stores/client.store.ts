import { create } from "zustand";
import type {
  Client,
  ClientStats,
  CreateClientInput,
  PaginationParams,
  UpdateClientInput,
} from "@/types";
import { clientService } from "@/services/client.service";

interface ClientState {
  clients: Client[];
  currentClient: Client | null;
  currentClientStats: ClientStats | null;
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

  fetchClients: (params?: PaginationParams) => Promise<void>;
  fetchClientById: (id: string) => Promise<void>;
  fetchClientStats: (id: string) => Promise<void>;
  createClient: (data: CreateClientInput) => Promise<Client>;
  updateClient: (id: string, data: UpdateClientInput) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  clearCurrentClient: () => void;
  clearError: () => void;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  currentClient: null,
  currentClientStats: null,
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

  fetchClients: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await clientService.getClients(params);
      set({
        clients: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al cargar clientes",
        isLoading: false,
      });
    }
  },

  fetchClientById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await clientService.getClientById(id);
      set({ currentClient: response, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al cargar el cliente",
        isLoading: false,
      });
    }
  },

  fetchClientStats: async (id) => {
    try {
      const stats = await clientService.getClientStats(id);
      set({ currentClientStats: stats });
    } catch (error: any) {
      console.error("Error fetching client stats:", error);
    }
  },

  createClient: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const client = await clientService.createClient(data);
      await get().fetchClients();
      set({ isLoading: false });
      return client;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al crear el cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  updateClient: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const client = await clientService.updateClient(id, data);
      set({ currentClient: client, isLoading: false });
      await get().fetchClients();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al actualizar el cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await clientService.deleteClient(id);
      await get().fetchClients();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al eliminar el cliente",
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentClient: () => set({ currentClient: null, currentClientStats: null }),
  clearError: () => set({ error: null }),
}));

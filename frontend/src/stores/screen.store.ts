import { create } from 'zustand';
import type { Screen, CreateScreenInput, ScreenFilters } from '@/types';
import { screenService } from '@/services/screen.service';

interface ScreenState {
  screens: Screen[];
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

  fetchScreens: (params?: ScreenFilters) => Promise<void>;
  createScreen: (data: CreateScreenInput) => Promise<void>;
  updateScreen: (id: string, data: Partial<CreateScreenInput>) => Promise<void>;
  deleteScreen: (id: string) => Promise<void>;
  clearError: () => void;
}

// Ver product.store.ts: evita que una respuesta llegada tarde pise
// resultados de una búsqueda más reciente.
let latestScreensRequestId = 0;

export const useScreenStore = create<ScreenState>((set, get) => ({
  screens: [],
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

  fetchScreens: async (params = {}) => {
    const requestId = ++latestScreensRequestId;
    set({ isLoading: true, error: null });
    try {
      const response = await screenService.getScreens(params);
      if (requestId !== latestScreensRequestId) return;
      set({
        screens: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      if (requestId !== latestScreensRequestId) return;
      set({
        error: error.response?.data?.message || 'Error al cargar pantallas',
        isLoading: false,
      });
    }
  },

  createScreen: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await screenService.createScreen(data);
      await get().fetchScreens();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear la pantalla',
        isLoading: false,
      });
      throw error;
    }
  },

  updateScreen: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await screenService.updateScreen(id, data);
      await get().fetchScreens();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar la pantalla',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteScreen: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await screenService.deleteScreen(id);
      await get().fetchScreens();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al eliminar la pantalla',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

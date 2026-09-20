import { create } from 'zustand';
import type { Phone, CreatePhoneInput, PhoneFilters } from '@/types';
import { phoneService } from '@/services/phone.service';

interface PhoneState {
  phones: Phone[];
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

  fetchPhones: (params?: PhoneFilters) => Promise<void>;
  createPhone: (data: CreatePhoneInput) => Promise<void>;
  updatePhone: (id: string, data: Partial<CreatePhoneInput>) => Promise<void>;
  deletePhone: (id: string) => Promise<void>;
  clearError: () => void;
}

// Ver product.store.ts: evita que una respuesta llegada tarde pise
// resultados de una búsqueda más reciente.
let latestPhonesRequestId = 0;

export const usePhoneStore = create<PhoneState>((set, get) => ({
  phones: [],
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

  fetchPhones: async (params = {}) => {
    const requestId = ++latestPhonesRequestId;
    set({ isLoading: true, error: null });
    try {
      const response = await phoneService.getPhones(params);
      if (requestId !== latestPhonesRequestId) return;
      set({
        phones: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      if (requestId !== latestPhonesRequestId) return;
      set({
        error: error.response?.data?.message || 'Error al cargar teléfonos',
        isLoading: false,
      });
    }
  },

  createPhone: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await phoneService.createPhone(data);
      await get().fetchPhones();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear el teléfono',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePhone: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await phoneService.updatePhone(id, data);
      await get().fetchPhones();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar el teléfono',
        isLoading: false,
      });
      throw error;
    }
  },

  deletePhone: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await phoneService.deletePhone(id);
      await get().fetchPhones();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al eliminar el teléfono',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

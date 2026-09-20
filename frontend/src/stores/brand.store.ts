import { create } from 'zustand';
import type { Brand, CreateBrandInput, PaginationParams } from '@/types';
import { brandService } from '@/services/brand.service';

interface BrandState {
  brands: Brand[];
  // Listado completo (sin paginar) para selectores de otros módulos.
  allBrands: Brand[];
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

  fetchBrands: (params?: PaginationParams) => Promise<void>;
  fetchAllBrands: () => Promise<void>;
  createBrand: (data: CreateBrandInput) => Promise<void>;
  updateBrand: (id: string, data: Partial<CreateBrandInput>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  clearError: () => void;
}

// Ver product.store.ts: evita que una respuesta llegada tarde pise
// resultados de una búsqueda más reciente.
let latestBrandsRequestId = 0;

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  allBrands: [],
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

  fetchBrands: async (params = {}) => {
    const requestId = ++latestBrandsRequestId;
    set({ isLoading: true, error: null });
    try {
      const response = await brandService.getBrands(params);
      if (requestId !== latestBrandsRequestId) return;
      set({
        brands: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      if (requestId !== latestBrandsRequestId) return;
      set({
        error: error.response?.data?.message || 'Error al cargar marcas',
        isLoading: false,
      });
    }
  },

  fetchAllBrands: async () => {
    try {
      const allBrands = await brandService.getAllBrands();
      set({ allBrands });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al cargar marcas' });
    }
  },

  createBrand: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await brandService.createBrand(data);
      await Promise.all([get().fetchBrands(), get().fetchAllBrands()]);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear la marca',
        isLoading: false,
      });
      throw error;
    }
  },

  updateBrand: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await brandService.updateBrand(id, data);
      await Promise.all([get().fetchBrands(), get().fetchAllBrands()]);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar la marca',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteBrand: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await brandService.deleteBrand(id);
      await Promise.all([get().fetchBrands(), get().fetchAllBrands()]);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al eliminar la marca',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';
import type { Supplier, CreateSupplierInput, PaginationParams } from '@/types';
import { supplierService } from '@/services/supplier.service';

interface SupplierState {
  suppliers: Supplier[];
  activeSuppliers: Supplier[];
  currentSupplier: Supplier | null;
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

  fetchSuppliers: (params?: PaginationParams) => Promise<void>;
  fetchActiveSuppliers: () => Promise<void>;
  fetchSupplierById: (id: string) => Promise<void>;
  createSupplier: (data: CreateSupplierInput) => Promise<void>;
  updateSupplier: (id: string, data: Partial<CreateSupplierInput>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  activeSuppliers: [],
  currentSupplier: null,
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

  fetchSuppliers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await supplierService.getSuppliers(params);
      set({
        suppliers: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar proveedores',
        isLoading: false,
      });
    }
  },

  fetchActiveSuppliers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await supplierService.getActiveSuppliers();
      set({
        activeSuppliers: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar proveedores activos',
        isLoading: false,
      });
    }
  },

  fetchSupplierById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await supplierService.getSupplierById(id);
      set({
        currentSupplier: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar el proveedor',
        isLoading: false,
      });
    }
  },

  createSupplier: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await supplierService.createSupplier(data);
      await get().fetchSuppliers();
      await get().fetchActiveSuppliers();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear el proveedor',
        isLoading: false,
      });
      throw error;
    }
  },

  updateSupplier: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await supplierService.updateSupplier(id, data);
      await get().fetchSuppliers();
      await get().fetchActiveSuppliers();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar el proveedor',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteSupplier: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await supplierService.deleteSupplier(id);
      await get().fetchSuppliers();
      await get().fetchActiveSuppliers();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al eliminar el proveedor',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

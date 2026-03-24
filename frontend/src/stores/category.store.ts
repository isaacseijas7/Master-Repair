import { create } from 'zustand';
import type { Category, CreateCategoryInput, PaginationParams } from '@/types';
import { categoryService } from '@/services/category.service';

interface CategoryState {
  categories: Category[];
  activeCategories: Category[];
  currentCategory: Category | null;
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

  fetchCategories: (params?: PaginationParams) => Promise<void>;
  fetchActiveCategories: () => Promise<void>;
  fetchCategoryById: (id: string) => Promise<void>;
  createCategory: (data: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: string, data: Partial<CreateCategoryInput>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  activeCategories: [],
  currentCategory: null,
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

  fetchCategories: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoryService.getCategories(params);
      set({
        categories: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar categorías',
        isLoading: false,
      });
    }
  },

  fetchActiveCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoryService.getActiveCategories();
      set({
        activeCategories: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar categorías activas',
        isLoading: false,
      });
    }
  },

  fetchCategoryById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await categoryService.getCategoryById(id);
      set({
        currentCategory: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar la categoría',
        isLoading: false,
      });
    }
  },

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await categoryService.createCategory(data);
      await get().fetchCategories();
      await get().fetchActiveCategories();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear la categoría',
        isLoading: false,
      });
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await categoryService.updateCategory(id, data);
      await get().fetchCategories();
      await get().fetchActiveCategories();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar la categoría',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await categoryService.deleteCategory(id);
      await get().fetchCategories();
      await get().fetchActiveCategories();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al eliminar la categoría',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

import { create } from 'zustand';
import type { Product, CreateProductInput, ProductFilters } from '@/types';
import { productService } from '@/services/product.service';

interface ProductState {
  // State
  products: Product[];
  currentProduct: Product | null;
  lowStockProducts: Product[];
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
  filters: ProductFilters;

  // Actions
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  fetchLowStockProducts: () => Promise<void>;
  createProduct: (data: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, data: Partial<CreateProductInput>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number, isAddition: boolean) => Promise<void>;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearError: () => void;
  clearCurrentProduct: () => void;
}

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
};

export const useProductStore = create<ProductState>((set, get) => ({
  // Initial state
  products: [],
  currentProduct: null,
  lowStockProducts: [],
  pagination: defaultPagination,
  isLoading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },

  // Fetch products with filters
  fetchProducts: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const currentFilters = get().filters;
      const mergedFilters = { ...currentFilters, ...filters };
      
      const response = await productService.getProducts(mergedFilters);
      
      set({
        products: response.data,
        pagination: response.pagination,
        // filters: mergedFilters,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar productos',
        isLoading: false,
      });
    }
  },

  // Fetch product by ID
  fetchProductById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productService.getProductById(id);
      set({
        currentProduct: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar el producto',
        isLoading: false,
      });
    }
  },

  // Fetch low stock products
  fetchLowStockProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await productService.getLowStockProducts();
      set({
        lowStockProducts: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar productos con stock bajo',
        isLoading: false,
      });
    }
  },

  // Create product
  createProduct: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await productService.createProduct(data);
      // Refresh products list
      await get().fetchProducts();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al crear el producto',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update product
  updateProduct: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await productService.updateProduct(id, data);
      set({
        currentProduct: response,
        isLoading: false,
      });
      // Refresh products list
      await get().fetchProducts();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar el producto',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await productService.deleteProduct(id);
      // Refresh products list
      await get().fetchProducts();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al eliminar el producto',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update stock
  updateStock: async (id, quantity, isAddition) => {
    set({ isLoading: true, error: null });
    try {
      await productService.updateStock(id, quantity, isAddition);
      // Refresh products list
      await get().fetchProducts();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al actualizar el stock',
        isLoading: false,
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear current product
  clearCurrentProduct: () => {
    set({ currentProduct: null });
  },
}));

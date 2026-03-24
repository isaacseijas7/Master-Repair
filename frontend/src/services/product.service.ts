import apiClient from './api.service';
import type { Product, CreateProductInput, ProductFilters, PaginatedResponse, ApiResponse } from '@/types';

export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.supplier) params.append('supplier', filters.supplier);
    if (filters.minStock) params.append('minStock', 'true');
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Product>>>(`/products?${params}`);
    return response.data.data!;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
    return response.data.data!.product;
  },

  async getProductBySku(sku: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/sku/${sku}`);
    return response.data.data!.product;
  },

  async createProduct(data: CreateProductInput): Promise<Product> {
    const response = await apiClient.post<ApiResponse<{ product: Product }>>('/products', data);
    return response.data.data!.product;
  },

  async updateProduct(id: string, data: Partial<CreateProductInput>): Promise<Product> {
    const response = await apiClient.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data);
    return response.data.data!.product;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async updateStock(id: string, quantity: number, isAddition: boolean): Promise<void> {
    await apiClient.patch(`/products/${id}/stock`, { quantity, isAddition });
  },

  async getLowStockProducts(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<{ products: Product[] }>>('/products/low-stock');
    return response.data.data!.products;
  },
};

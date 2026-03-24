import apiClient from './api.service';
import type { Category, CreateCategoryInput, PaginationParams, PaginatedResponse, ApiResponse } from '@/types';

export const categoryService = {
  async getCategories(params: PaginationParams = {}): Promise<PaginatedResponse<Category>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Category>>>(`/categories?${queryParams}`);
    return response.data.data!;
  },

  async getActiveCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<{ categories: Category[] }>>('/categories/active');
    return response.data.data!.categories;
  },

  async getCategoryById(id: string): Promise<Category> {
    const response = await apiClient.get<ApiResponse<{ category: Category }>>(`/categories/${id}`);
    return response.data.data!.category;
  },

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const response = await apiClient.post<ApiResponse<{ category: Category }>>('/categories', data);
    return response.data.data!.category;
  },

  async updateCategory(id: string, data: Partial<CreateCategoryInput>): Promise<Category> {
    const response = await apiClient.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data);
    return response.data.data!.category;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

import apiClient from './api.service';
import { downloadExcel } from './download';
import type { Brand, CreateBrandInput, PaginationParams, PaginatedResponse, ApiResponse } from '@/types';

export const brandService = {
  async getBrands(params: PaginationParams = {}): Promise<PaginatedResponse<Brand>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Brand>>>(`/brands?${queryParams}`);
    return response.data.data!;
  },

  async getAllBrands(): Promise<Brand[]> {
    const response = await apiClient.get<ApiResponse<{ brands: Brand[] }>>('/brands/all');
    return response.data.data!.brands;
  },

  async createBrand(data: CreateBrandInput): Promise<Brand> {
    const response = await apiClient.post<ApiResponse<{ brand: Brand }>>('/brands', data);
    return response.data.data!.brand;
  },

  async updateBrand(id: string, data: Partial<CreateBrandInput>): Promise<Brand> {
    const response = await apiClient.put<ApiResponse<{ brand: Brand }>>(`/brands/${id}`, data);
    return response.data.data!.brand;
  },

  async deleteBrand(id: string): Promise<void> {
    await apiClient.delete(`/brands/${id}`);
  },

  async exportToExcel(): Promise<void> {
    await downloadExcel('/brands/export', 'marcas');
  },
};

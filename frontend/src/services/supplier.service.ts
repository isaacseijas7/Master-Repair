import apiClient from './api.service';
import type { Supplier, CreateSupplierInput, PaginationParams, PaginatedResponse, ApiResponse } from '@/types';

export const supplierService = {
  async getSuppliers(params: PaginationParams = {}): Promise<PaginatedResponse<Supplier>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Supplier>>>(`/suppliers?${queryParams}`);
    return response.data.data!;
  },

  async getActiveSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get<ApiResponse<{ suppliers: Supplier[] }>>('/suppliers/active');
    return response.data.data!.suppliers;
  },

  async getSupplierById(id: string): Promise<Supplier> {
    const response = await apiClient.get<ApiResponse<{ supplier: Supplier }>>(`/suppliers/${id}`);
    return response.data.data!.supplier;
  },

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    const response = await apiClient.post<ApiResponse<{ supplier: Supplier }>>('/suppliers', data);
    return response.data.data!.supplier;
  },

  async updateSupplier(id: string, data: Partial<CreateSupplierInput>): Promise<Supplier> {
    const response = await apiClient.put<ApiResponse<{ supplier: Supplier }>>(`/suppliers/${id}`, data);
    return response.data.data!.supplier;
  },

  async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/suppliers/${id}`);
  },
};

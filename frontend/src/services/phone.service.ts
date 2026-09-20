import apiClient from './api.service';
import { downloadExcel } from './download';
import type {
  Phone,
  CreatePhoneInput,
  PhoneFilters,
  PhoneExportColumn,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const phoneService = {
  async getPhones(params: PhoneFilters = {}): Promise<PaginatedResponse<Phone>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.brandId) queryParams.append('brandId', params.brandId);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Phone>>>(`/phones?${queryParams}`);
    return response.data.data!;
  },

  async createPhone(data: CreatePhoneInput): Promise<Phone> {
    const response = await apiClient.post<ApiResponse<{ phone: Phone }>>('/phones', data);
    return response.data.data!.phone;
  },

  async updatePhone(id: string, data: Partial<CreatePhoneInput>): Promise<Phone> {
    const response = await apiClient.put<ApiResponse<{ phone: Phone }>>(`/phones/${id}`, data);
    return response.data.data!.phone;
  },

  async deletePhone(id: string): Promise<void> {
    await apiClient.delete(`/phones/${id}`);
  },

  // Sin brandIds (o vacío) exporta el catálogo de todas las marcas. `columns`
  // son las columnas de precio a incluir (el modelo siempre va).
  async exportToExcel(brandIds: string[], columns: PhoneExportColumn[]): Promise<void> {
    const params: Record<string, string> = { columns: columns.join(',') };
    if (brandIds.length > 0) params.brandIds = brandIds.join(',');
    await downloadExcel('/phones/export', 'telefonos', params);
  },
};

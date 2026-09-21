import apiClient from './api.service';
import { downloadExcel } from './download';
import type {
  Screen,
  CreateScreenInput,
  ScreenFilters,
  ScreenExportColumn,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const screenService = {
  async getScreens(params: ScreenFilters = {}): Promise<PaginatedResponse<Screen>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.brandId) queryParams.append('brandId', params.brandId);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Screen>>>(`/screens?${queryParams}`);
    return response.data.data!;
  },

  async createScreen(data: CreateScreenInput): Promise<Screen> {
    const response = await apiClient.post<ApiResponse<{ screen: Screen }>>('/screens', data);
    return response.data.data!.screen;
  },

  async updateScreen(id: string, data: Partial<CreateScreenInput>): Promise<Screen> {
    const response = await apiClient.put<ApiResponse<{ screen: Screen }>>(`/screens/${id}`, data);
    return response.data.data!.screen;
  },

  async deleteScreen(id: string): Promise<void> {
    await apiClient.delete(`/screens/${id}`);
  },

  // Sin brandIds (o vacío) exporta el catálogo de todas las marcas. `columns`
  // son las columnas de precio a incluir (el modelo siempre va).
  async exportToExcel(brandIds: string[], columns: ScreenExportColumn[]): Promise<void> {
    const params: Record<string, string> = { columns: columns.join(',') };
    if (brandIds.length > 0) params.brandIds = brandIds.join(',');
    await downloadExcel('/screens/export', 'pantallas', params);
  },
};

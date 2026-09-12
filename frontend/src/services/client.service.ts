import apiClient from "./api.service";
import type {
  ApiResponse,
  Client,
  ClientStats,
  CreateClientInput,
  PaginatedResponse,
  PaginationParams,
  UpdateClientInput,
} from "@/types";

export const clientService = {
  async getClients(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Client>> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Client>>>(
      `/clients?${queryParams}`,
    );
    return response.data.data!;
  },

  async getClientById(id: string): Promise<Client> {
    const response = await apiClient.get<ApiResponse<{ client: Client }>>(
      `/clients/${id}`,
    );
    return response.data.data!.client;
  },

  async createClient(data: CreateClientInput): Promise<Client> {
    const response = await apiClient.post<ApiResponse<{ client: Client }>>(
      "/clients",
      data,
    );
    return response.data.data!.client;
  },

  async updateClient(id: string, data: UpdateClientInput): Promise<Client> {
    const response = await apiClient.put<ApiResponse<{ client: Client }>>(
      `/clients/${id}`,
      data,
    );
    return response.data.data!.client;
  },

  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },

  async getClientStats(id: string): Promise<ClientStats> {
    const response = await apiClient.get<ApiResponse<ClientStats>>(
      `/clients/${id}/stats`,
    );
    return response.data.data!;
  },
};
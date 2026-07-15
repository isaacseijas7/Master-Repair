import apiClient from "./api.service";
import type {
  ApiResponse,
  Client,
  CreateClientInput,
  PaginatedResponse,
  PaginationParams,
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
};
import apiClient from "./api.service";
import type {
  Order,
  CreateOrderInput,
  OrderFilters,
  PaginatedResponse,
  ApiResponse,
} from "@/types";

export const orderService = {
  async getOrders(
    filters: OrderFilters = {},
  ): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    if (filters.search) params.append("search", filters.search);
    if (filters.type) params.append("type", filters.type);
    if (filters.status) params.append("status", filters.status);
    if (filters.supplier) params.append("supplier", filters.supplier);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Order>>>(
      `/orders?${params}`,
    );
    return response.data.data!;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<{ order: Order }>>(
      `/orders/${id}`,
    );
    return response.data.data!.order;
  },

  async createOrder(data: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<ApiResponse<{ order: Order }>>(
      "/orders",
      data,
    );
    return response.data.data!.order;
  },

  async updateOrder(id: string, data: CreateOrderInput): Promise<Order> {
    const response = await apiClient.put<ApiResponse<{ order: Order }>>(
      `/orders/${id}/update`,
      data,
    );
    return response.data.data!.order;
  },

  async updateOrderStatus(id: string, status: any): Promise<void> {
    await apiClient.patch(`/orders/${id}/status`, { status });
  },

  async cancelOrder(id: string): Promise<void> {
    await apiClient.patch(`/orders/${id}/cancel`);
  },

  async getTodaySales(): Promise<{ count: number; total: number }> {
    const response = await apiClient.get<
      ApiResponse<{ count: number; total: number }>
    >("/orders/stats/today");
    return response.data.data!;
  },

  async getMonthlySales(
    year?: number,
    month?: number,
  ): Promise<{ count: number; total: number }> {
    const params = new URLSearchParams();
    if (year) params.append("year", year.toString());
    if (month) params.append("month", month.toString());

    const response = await apiClient.get<
      ApiResponse<{ count: number; total: number }>
    >(`/orders/stats/monthly?${params}`);
    return response.data.data!;
  },

  async getTopSellingProducts(limit: number = 5): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<{ products: any[] }>>(
      `/orders/stats/top-products?limit=${limit}`,
    );
    return response.data.data!.products;
  },

  async getMonthlyRevenue(months: number = 12): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<{ revenue: any[] }>>(
      `/orders/stats/monthly-revenue?months=${months}`,
    );
    return response.data.data!.revenue;
  },

  async getPendingCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      "/orders/stats/pending-count",
    );
    return response.data.data!.count;
  },
};

import apiClient from './api.service';
import type { DashboardData, DashboardMetrics, StockAlert, TopProduct, MonthlyRevenue, ApiResponse } from '@/types';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
    return response.data.data!;
  },

  async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/dashboard/metrics');
    return response.data.data!;
  },

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const response = await apiClient.get<ApiResponse<{ products: TopProduct[] }>>(`/dashboard/top-products?limit=${limit}`);
    return response.data.data!.products;
  },

  async getMonthlyRevenue(months: number = 12): Promise<MonthlyRevenue[]> {
    const response = await apiClient.get<ApiResponse<{ revenue: MonthlyRevenue[] }>>(`/dashboard/monthly-revenue?months=${months}`);
    return response.data.data!.revenue;
  },

  async getStockAlerts(limit: number = 10): Promise<StockAlert[]> {
    const response = await apiClient.get<ApiResponse<{ alerts: StockAlert[] }>>(`/dashboard/stock-alerts?limit=${limit}`);
    return response.data.data!.alerts;
  },

  async getRecentOrders(limit: number = 5): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<{ orders: any[] }>>(`/dashboard/recent-orders?limit=${limit}`);
    return response.data.data!.orders;
  },
};

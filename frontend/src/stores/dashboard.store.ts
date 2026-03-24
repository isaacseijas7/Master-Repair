import { create } from 'zustand';
import type { DashboardMetrics, StockAlert, TopProduct, MonthlyRevenue } from '@/types';
import { dashboardService } from '@/services/dashboard.service';

interface DashboardState {
  metrics: DashboardMetrics | null;
  topProducts: TopProduct[];
  monthlyRevenue: MonthlyRevenue[];
  stockAlerts: StockAlert[];
  recentOrders: any[];
  inventoryValue: { totalValue: number; totalCost: number } | null;
  salesByCategory: any[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
  fetchMetrics: () => Promise<void>;
  fetchTopProducts: (limit?: number) => Promise<void>;
  fetchMonthlyRevenue: (months?: number) => Promise<void>;
  fetchStockAlerts: (limit?: number) => Promise<void>;
  fetchRecentOrders: (limit?: number) => Promise<void>;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  topProducts: [],
  monthlyRevenue: [],
  stockAlerts: [],
  recentOrders: [],
  inventoryValue: null,
  salesByCategory: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await dashboardService.getDashboardData();
      set({
        metrics: response.metrics,
        topProducts: response.topProducts,
        monthlyRevenue: response.monthlyRevenue,
        stockAlerts: response.stockAlerts,
        recentOrders: response.recentOrders,
        inventoryValue: response.inventoryValue,
        salesByCategory: response.salesByCategory,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar datos del dashboard',
        isLoading: false,
      });
    }
  },

  fetchMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await dashboardService.getMetrics();
      set({
        metrics: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Error al cargar métricas',
        isLoading: false,
      });
    }
  },

  fetchTopProducts: async (limit = 5) => {
    try {
      const response = await dashboardService.getTopProducts(limit);
      set({ topProducts: response });
    } catch (error: any) {
      console.error('Error fetching top products:', error);
    }
  },

  fetchMonthlyRevenue: async (months = 12) => {
    try {
      const response = await dashboardService.getMonthlyRevenue(months);
      set({ monthlyRevenue: response });
    } catch (error: any) {
      console.error('Error fetching monthly revenue:', error);
    }
  },

  fetchStockAlerts: async (limit = 10) => {
    try {
      const response = await dashboardService.getStockAlerts(limit);
      set({ stockAlerts: response });
    } catch (error: any) {
      console.error('Error fetching stock alerts:', error);
    }
  },

  fetchRecentOrders: async (limit = 5) => {
    try {
      const response = await dashboardService.getRecentOrders(limit);
      set({ recentOrders: response });
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
    }
  },

  clearError: () => set({ error: null }),
}));

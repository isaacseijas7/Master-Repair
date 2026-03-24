import { create } from "zustand";
import {
  type Order,
  type CreateOrderInput,
  type OrderFilters,
  OrderStatus,
  type PaymentTypeType,
} from "@/types";
import { orderService } from "@/services/order.service";

interface OrderState {
  orders: Order[];
  paymentType?: PaymentTypeType;
  currentOrder: Order | null;
  todaySales: { count: number; total: number };
  topProducts: any[];
  monthlyRevenue: any[];
  pendingCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  isLoading: boolean;
  error: string | null;

  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (data: CreateOrderInput) => Promise<Order>;
  updateOrderStatus: (
    id: string,
    status: (typeof OrderStatus)[keyof typeof OrderStatus],
  ) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  fetchTodaySales: () => Promise<void>;
  fetchTopProducts: (limit?: number) => Promise<void>;
  fetchMonthlyRevenue: (months?: number) => Promise<void>;
  fetchPendingCount: () => Promise<void>;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  todaySales: { count: 0, total: 0 },
  topProducts: [],
  monthlyRevenue: [],
  pendingCount: 0,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  error: null,

  fetchOrders: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderService.getOrders(filters);
      set({
        orders: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al cargar órdenes",
        isLoading: false,
      });
    }
  },

  fetchOrderById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderService.getOrderById(id);
      set({
        currentOrder: response,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al cargar la orden",
        isLoading: false,
      });
    }
  },

  createOrder: async (data: CreateOrderInput): Promise<Order> => {
    set({ isLoading: true, error: null });
    try {
      const response = await orderService.createOrder(data);
      await get().fetchOrders();
      await get().fetchTodaySales();
      await get().fetchPendingCount();
      set({ isLoading: false });
      return response; // Retorna la orden con el _id
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al crear la orden",
        isLoading: false,
      });
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await orderService.updateOrderStatus(id, status);
      await get().fetchOrders();
      await get().fetchPendingCount();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al actualizar el estado",
        isLoading: false,
      });
      throw error;
    }
  },

  cancelOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await orderService.cancelOrder(id);
      await get().fetchOrders();
      await get().fetchPendingCount();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Error al cancelar la orden",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchTodaySales: async () => {
    try {
      const response = await orderService.getTodaySales();
      set({ todaySales: response });
    } catch (error: any) {
      console.error("Error fetching today sales:", error);
    }
  },

  fetchTopProducts: async (limit = 5) => {
    try {
      const response = await orderService.getTopSellingProducts(limit);
      set({ topProducts: response });
    } catch (error: any) {
      console.error("Error fetching top products:", error);
    }
  },

  fetchMonthlyRevenue: async (months = 12) => {
    try {
      const response = await orderService.getMonthlyRevenue(months);
      set({ monthlyRevenue: response });
    } catch (error: any) {
      console.error("Error fetching monthly revenue:", error);
    }
  },

  fetchPendingCount: async () => {
    try {
      const response = await orderService.getPendingCount();
      set({ pendingCount: response });
    } catch (error: any) {
      console.error("Error fetching pending count:", error);
    }
  },

  clearError: () => set({ error: null }),
}));

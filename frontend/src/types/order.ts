export const MovementType = {
  PURCHASE: "purchase",
  SALE: "sale",
  ADJUSTMENT: "adjustment",
  RETURN: "return",
} as const;

export const OrderStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type MovementTypeValue =
  (typeof MovementType)[keyof typeof MovementType];
export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    sku: string;
    unitPrice: number;
    stock?: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  type: MovementTypeValue;
  status: OrderStatusValue;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  supplier?: {
    _id: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
  };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  type: MovementTypeValue;
  items: {
    product: string;
    quantity: number;
    unitPrice?: number;
  }[];
  tax?: number;
  discount?: number;
  supplier?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  type?: MovementTypeValue;
  status?: OrderStatusValue;
  supplier?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

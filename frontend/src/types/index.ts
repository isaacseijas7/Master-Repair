// ==================== ENUMS ====================
export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  CASHIER: "cashier",
} as const;

export enum MovementType {
  PURCHASE = "purchase",
  SALE = "sale",
  ADJUSTMENT = "adjustment",
  RETURN = "return",
}

export const OrderStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// ==================== USER TYPES ====================
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  isActive?: boolean;
}

// ==================== CATEGORY TYPES ====================
export interface Category {
  _id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

// ==================== SUPPLIER TYPES ====================
export interface Supplier {
  _id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  isActive?: boolean;
}

// ==================== PRODUCT TYPES ====================
export interface PriceTier {
  minQuantity: number;
  price: number;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category: Category | string;
  supplier?: Supplier | string;
  unitPrice: number;
  wholesalePrice?: number;
  priceTiers: PriceTier[];
  stock: number;
  minStock: number;
  maxStock?: number;
  location?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
}

export interface CreateProductInput {
  sku?: string;
  name: string;
  description?: string;
  category: string;
  supplier?: string;
  unitPrice: number;
  wholesalePrice?: number;
  priceTiers?: PriceTier[];
  stock?: number;
  minStock?: number;
  maxStock?: number;
  location?: string;
  barcode?: string;
  isActive?: boolean;
}

// ==================== ORDER TYPES ====================
export interface OrderItem {
  product: Product | string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  type: (typeof MovementType)[keyof typeof MovementType];
  status: (typeof OrderStatus)[keyof typeof OrderStatus];
  paymentType?: PaymentTypeType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  supplier?: Supplier | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  createdBy: User | string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItem {
  product: string;
  quantity: number;
  unitPrice?: number;
}

export const PaymentType = {
  CASH: "cash",
  CREDIT: "credit",
} as const;

export type PaymentTypeType = (typeof PaymentType)[keyof typeof PaymentType];

export type MovementTypeType = (typeof MovementType)[keyof typeof MovementType];

export interface CreateOrderInput {
  type: MovementTypeType;
  paymentType?: PaymentTypeType;
  items: Array<{
    product: string;
    quantity: number;
    unitPrice: number;
  }>;
  tax?: number;
  discount?: number;
  supplier?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

// ==================== PAGINATION TYPES ====================
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ==================== API RESPONSE TYPES ====================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
}

// ==================== DASHBOARD TYPES ====================
export interface DashboardMetrics {
  totalProducts: number;
  lowStockProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  todaySales: number;
  monthSales: number;
  monthRevenue: number;
  pendingOrders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  totalSold: number;
  totalRevenue: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface StockAlert {
  productId: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  missing: number;
}

export interface InventoryValue {
  totalValue: number;
  totalCost: number;
}

export interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalRevenue: number;
  totalSold: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  topProducts: TopProduct[];
  monthlyRevenue: MonthlyRevenue[];
  stockAlerts: StockAlert[];
  recentOrders: Order[];
  inventoryValue: InventoryValue;
  salesByCategory: SalesByCategory[];
}

// ==================== FILTER TYPES ====================
export interface ProductFilters extends PaginationParams {
  category?: string;
  supplier?: string;
  minStock?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface OrderFilters extends PaginationParams {
  type?: (typeof MovementType)[keyof typeof MovementType];
  status?: (typeof OrderStatus)[keyof typeof OrderStatus];
  supplier?: string;
  startDate?: string;
  endDate?: string;
}

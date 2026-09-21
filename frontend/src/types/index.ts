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

// Sin password: el reseteo de contraseña de otros usuarios queda fuera de
// alcance del módulo de administración de usuarios.
export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: (typeof UserRole)[keyof typeof UserRole];
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

// ==================== BRAND TYPES ====================
export interface Brand {
  _id: string;
  name: string;
  // Solo lo devuelve GET /brands/all
  screenCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandInput {
  name: string;
}

// ==================== SCREEN TYPES ====================
export interface Screen {
  _id: string;
  brandId: Brand | string;
  screenModel: string;
  // Precios en USD. `salePrice` es el precio de venta al por mayor.
  salePrice: number;
  unitSalePrice?: number | null;
  // Solo lo devuelve el backend a admin/manager
  purchasePrice?: number | null;
  // true si es una pantalla de mecánico. Los registros anteriores no lo traen.
  isMechanic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScreenInput {
  brandId: string;
  screenModel: string;
  salePrice: number;
  // null borra el valor al editar
  unitSalePrice?: number | null;
  purchasePrice?: number | null;
  isMechanic?: boolean;
}

export type ScreenExportColumn = 'salePrice' | 'unitSalePrice' | 'purchasePrice';

// Qué pantallas exportar: todas, solo de mecánico o solo las que no lo son.
export type ScreenExportSource = 'all' | 'mechanic' | 'regular';

export interface ScreenFilters extends PaginationParams {
  brandId?: string;
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
  brand?: string;
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
  brand?: string;
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

export interface Client {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  client?: Client | string;
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

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface ClientStats {
  totalOrders: number;
  totalSpent: number;
}

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
  client?: string;
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
  totalStock: number;
  pendingOrders: number;
  // Antes se llamaban "todaySales" (un monto en dinero) y "monthSales" (un
  // conteo de órdenes), pese al mismo patrón de nombre "Sales" para dos
  // tipos de dato distintos. Además, ahora son opcionales porque el
  // backend ya no las envía para roles sin permisos financieros (Cashier).
  todayRevenue?: number;
  monthOrders?: number;
  monthRevenue?: number;
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
  stockAlerts: StockAlert[];
  recentOrders: Order[];
  // Ausentes en la respuesta para roles sin permisos financieros (Cashier):
  // el backend ya no calcula ni envía estas secciones para ellos.
  topProducts?: TopProduct[];
  monthlyRevenue?: MonthlyRevenue[];
  inventoryValue?: InventoryValue;
  salesByCategory?: SalesByCategory[];
}

// ==================== FILTER TYPES ====================
export interface ProductFilters extends PaginationParams {
  category?: string;
  supplier?: string;
  brand?: string;
  minStock?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface OrderFilters extends PaginationParams {
  type?: (typeof MovementType)[keyof typeof MovementType];
  status?: (typeof OrderStatus)[keyof typeof OrderStatus];
  supplier?: string;
  client?: string;
  startDate?: string;
  endDate?: string;
}

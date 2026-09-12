import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { Order, MovementType, OrderStatus } from '../models/Order';

const PRIVILEGED_ROLES = ["admin", "manager"];

export class DashboardService {
  /**
   * Antes el dashboard devolvía ingresos, top productos y ventas por
   * categoría a cualquier rol autenticado, incluido Cashier, sin ninguna
   * restricción (hallazgo de la auditoría, Fase 1 y Fase 5). Un Cashier
   * sigue viendo stock, alertas y órdenes recientes (las necesita para
   * "gestión de stock" según su alcance documentado), pero ya no ve
   * ingresos, productos más vendidos ni ventas por categoría.
   */
  async getDashboardData(userRole?: string): Promise<any> {
    const isPrivileged = !!userRole && PRIVILEGED_ROLES.includes(userRole);

    const [metrics, stockAlerts, recentOrders] = await Promise.all([
      this.getMetrics(userRole),
      this.getStockAlerts(5),
      this.getRecentOrders(5),
    ]);

    if (!isPrivileged) {
      return { metrics, stockAlerts, recentOrders };
    }

    const [topProducts, monthlyRevenue, inventoryValue, salesByCategory] =
      await Promise.all([
        this.getTopProducts(5),
        this.getMonthlyRevenue(12),
        this.getInventoryValue(),
        this.getSalesByCategory(),
      ]);

    return {
      metrics,
      topProducts,
      monthlyRevenue,
      stockAlerts,
      recentOrders,
      inventoryValue,
      salesByCategory,
    };
  }

  async getMetrics(userRole?: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      totalStockResult,
      todaySales,
      monthSales,
      pendingOrders,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] }, isActive: true }),
      Category.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalStock: { $sum: '$stock' } } },
      ]),
      Order.aggregate([
        { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED, completedAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED, completedAt: { $gte: startOfMonth, $lt: startOfNextMonth } } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: OrderStatus.PENDING }),
    ]);

    const todayResult = todaySales[0] || { count: 0, total: 0 };
    const monthResult = monthSales[0] || { count: 0, total: 0 };
    const totalStock = totalStockResult[0]?.totalStock || 0;

    const baseMetrics = {
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      totalStock,
      pendingOrders,
    };

    // Antes "todaySales" guardaba un monto en dinero y "monthSales" un
    // conteo de órdenes, pese al mismo patrón de nombre "Sales" — una
    // trampa para quien reutilizara el campo sin revisar su tipo real.
    const isPrivileged = !!userRole && PRIVILEGED_ROLES.includes(userRole);
    if (!isPrivileged) {
      return baseMetrics;
    }

    return {
      ...baseMetrics,
      todayRevenue: todayResult.total,
      monthOrders: monthResult.count,
      monthRevenue: monthResult.total,
    };
  }

  async getTopProducts(limit: number = 5): Promise<any[]> {
    return Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { productId: { $toString: '$_id' }, name: '$product.name', sku: '$product.sku', totalSold: 1, totalRevenue: { $round: ['$totalRevenue', 2] } } },
    ]);
  }

  async getMonthlyRevenue(months: number = 12): Promise<any[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const results = await Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED, completedAt: { $gte: startDate } } },
      { $group: { _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, month: { $concat: [{ $toString: '$_id.year' }, '-', { $cond: { if: { $lt: ['$_id.month', 10] }, then: { $concat: ['0', { $toString: '$_id.month' }] }, else: { $toString: '$_id.month' } } }] }, revenue: { $round: ['$revenue', 2] }, orders: 1 } },
    ]);

    return this.fillMissingMonths(results, months);
  }

  private fillMissingMonths(data: any[], months: number): any[] {
    const result: any[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = data.find(d => d.month === monthKey);
      result.push(existing || { month: monthKey, revenue: 0, orders: 0 });
    }
    
    return result;
  }

  async getStockAlerts(limit: number = 10): Promise<any[]> {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] },
      isActive: true,
    }).sort({ stock: 1 }).limit(limit).lean();

    return products.map(p => ({
      productId: p._id.toString(),
      name: p.name,
      sku: p.sku,
      currentStock: p.stock,
      minStock: p.minStock,
      // Antes sumaba "+5" sin ninguna explicación ni justificación de
      // negocio documentada, mostrando al usuario un faltante inflado
      // (ej. "faltan 7" cuando en realidad faltaban 2). El faltante real es
      // simplemente la diferencia entre el mínimo y el stock actual.
      missing: Math.max(0, p.minStock - p.stock),
    }));
  }

  async getRecentOrders(limit: number = 5): Promise<any[]> {
    return Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('items.product', 'name sku')
      .populate('createdBy', 'firstName lastName')
      .lean();
  }

  /**
   * Antes también calculaba "totalCost" usando wholesalePrice (un precio de
   * venta al mayoreo) como si fuera el costo de adquisición del producto.
   * El sistema no tiene ningún campo real de costo en Producto, así que esa
   * cifra no representaba una ganancia real; además, el resultado completo
   * nunca se mostraba en ningún lado (se calculaba en cada carga del
   * dashboard sin ningún uso). Se deja solo el valor real y verificable:
   * el valor del inventario a precio de venta.
   */
  async getInventoryValue(): Promise<{ totalValue: number }> {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$unitPrice', '$stock'] } } } },
    ]);

    return result[0] ? { totalValue: result[0].totalValue } : { totalValue: 0 };
  }

  async getSalesByCategory(): Promise<any[]> {
    return Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.category', totalRevenue: { $sum: '$items.totalPrice' }, totalSold: { $sum: '$items.quantity' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { categoryId: { $toString: '$_id' }, categoryName: '$category.name', categoryColor: '$category.color', totalRevenue: { $round: ['$totalRevenue', 2] }, totalSold: 1 } },
      { $sort: { totalRevenue: -1 } },
    ]);
  }
}

export const dashboardService = new DashboardService();

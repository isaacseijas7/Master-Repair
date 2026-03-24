import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { Order, MovementType, OrderStatus } from '../models/Order';

export class DashboardService {
  async getDashboardData(): Promise<any> {
    const [
      metrics,
      topProducts,
      monthlyRevenue,
      stockAlerts,
      recentOrders,
      inventoryValue,
      salesByCategory,
    ] = await Promise.all([
      this.getMetrics(),
      this.getTopProducts(5),
      this.getMonthlyRevenue(12),
      this.getStockAlerts(5),
      this.getRecentOrders(5),
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

  async getMetrics(): Promise<any> {
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
      todaySales,
      monthSales,
      pendingOrders,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$minStock'] }, isActive: true }),
      Category.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: true }),
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

    return {
      totalProducts,
      lowStockProducts,
      totalCategories,
      totalSuppliers,
      todaySales: todayResult.total,
      monthSales: monthResult.count,
      monthRevenue: monthResult.total,
      pendingOrders,
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
      missing: p.minStock - p.stock + 5,
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

  async getInventoryValue(): Promise<{ totalValue: number; totalCost: number }> {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, totalValue: { $sum: { $multiply: ['$unitPrice', '$stock'] } }, totalCost: { $sum: { $multiply: [{ $ifNull: ['$wholesalePrice', '$unitPrice'] }, '$stock'] } } } },
    ]);

    return result[0] || { totalValue: 0, totalCost: 0 };
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

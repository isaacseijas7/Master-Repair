import { Order, IOrder, MovementType, OrderStatus } from '../models/Order';
import { Product } from '../models/Product';

export class OrderService {
  async getOrders(filters: any = {}): Promise<{ data: IOrder[]; pagination: any }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, type, status, supplier, startDate, endDate } = filters;
    
    const query: any = {};

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name sku unitPrice')
        .populate('supplier', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders as IOrder[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getOrderById(id: string): Promise<IOrder> {
    const order = await Order.findById(id)
      .populate('items.product', 'name sku unitPrice stock')
      .populate('supplier', 'name contactName email phone')
      .populate('createdBy', 'firstName lastName email');
    if (!order) throw new Error('Orden no encontrada');
    return order;
  }

  async createOrder(orderData: any, userId: string): Promise<IOrder> {
    const processedItems = [];
    let subtotal = 0;

    for (const item of orderData.items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Producto no encontrado: ${item.product}`);
      if (!product.isActive) throw new Error(`El producto ${product.name} no está activo`);

      if (orderData.type === MovementType.SALE && product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}`);
      }

      const unitPrice = item.unitPrice || product.unitPrice;
      const totalPrice = unitPrice * item.quantity;

      processedItems.push({
        product: item.product,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      subtotal += totalPrice;
    }

    const tax = orderData.tax || 0;
    const discount = orderData.discount || 0;
    const total = subtotal + tax - discount;

    const order = new Order({
      ...orderData,
      items: processedItems,
      subtotal,
      total,
      createdBy: userId,
    });

    await order.save();

    if (order.status === OrderStatus.COMPLETED) {
      await this.updateStockForOrder(order);
    }

    return order.populate(['items.product', 'supplier', 'createdBy']);
  }

  async updateOrderStatus(id: string, status: string): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) throw new Error('Orden no encontrada');

    const previousStatus = order.status;
    order.status = status as (typeof OrderStatus)[keyof typeof OrderStatus];

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
      if (previousStatus === OrderStatus.PENDING) {
        await this.updateStockForOrder(order);
      }
    }

    await order.save();
    return order.populate(['items.product', 'supplier', 'createdBy']);
  }

  private async updateStockForOrder(order: IOrder): Promise<void> {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (order.type === MovementType.PURCHASE || order.type === MovementType.RETURN) {
          product.stock += item.quantity;
        } else if (order.type === MovementType.SALE) {
          if (product.stock >= item.quantity) {
            product.stock -= item.quantity;
          }
        }
        await product.save();
      }
    }
  }

  async getTodaySales(): Promise<{ count: number; total: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED, completedAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]);

    return result[0] || { count: 0, total: 0 };
  }

  async getTopSellingProducts(limit: number = 5): Promise<any[]> {
    return Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { productId: '$_id', name: '$product.name', sku: '$product.sku', totalSold: 1, totalRevenue: 1 } },
    ]);
  }

  async getMonthlyRevenue(months: number = 12): Promise<any[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED, completedAt: { $gte: startDate } } },
      { $group: { _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: { _id: 0, month: { $concat: [{ $toString: '$_id.year' }, '-', { $cond: { if: { $lt: ['$_id.month', 10] }, then: { $concat: ['0', { $toString: '$_id.month' }] }, else: { $toString: '$_id.month' } } }] }, revenue: 1, orders: 1 } },
    ]);
  }

  async getPendingCount(): Promise<number> {
    return Order.countDocuments({ status: OrderStatus.PENDING });
  }
}

export const orderService = new OrderService();

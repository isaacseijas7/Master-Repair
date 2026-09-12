import mongoose from "mongoose";
import { Order, IOrder, MovementType, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import { clientService } from "./client.service";

// Roles que pueden crear o modificar órdenes que no sean de venta
// (compras, ajustes, devoluciones). Un Cashier solo puede operar ventas,
// según el alcance de roles documentado en el README del proyecto.
const PRIVILEGED_ROLES = ["admin", "manager"];

export class OrderService {
  /**
   * Valida los ítems de una orden contra el catálogo de productos y calcula
   * subtotal + líneas procesadas. Se usa tanto en creación como en edición
   * para que ambas compartan exactamente la misma regla de validación de
   * stock (antes estaban duplicadas con condiciones ligeramente distintas).
   */
  private async validateAndProcessItems(
    items: any[],
    effectiveType: string,
  ): Promise<{ processedItems: any[]; subtotal: number }> {
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Producto no encontrado: ${item.product}`);
      if (!product.isActive)
        throw new Error(`El producto ${product.name} no está activo`);

      if (
        effectiveType === MovementType.SALE &&
        product.stock < item.quantity
      ) {
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

    return { processedItems, subtotal };
  }

  async getOrders(
    filters: any = {},
  ): Promise<{ data: IOrder[]; pagination: any }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      type,
      status,
      supplier,
      client,
      startDate,
      endDate,
    } = filters;

    const query: any = {};

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    // Antes no existía forma de filtrar el historial de órdenes por cliente,
    // pese a que Order.client ya estaba indexado justamente para esto.
    if (client) query.client = client;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product", "name sku unitPrice")
        .populate("supplier", "name")
        .populate("client", "name email phone")
        .populate("createdBy", "firstName lastName")
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
    // Se incluyen priceTiers y wholesalePrice en el populate para que el
    // formulario de edición pueda recalcular el precio por escala al
    // cambiar la cantidad (antes solo se traía name/sku/unitPrice/stock,
    // así que al editar una orden no había forma de aplicar escalas).
    const order = await Order.findById(id)
      .populate("items.product", "name sku unitPrice stock priceTiers wholesalePrice")
      .populate("supplier", "name contactName email phone")
      .populate("client", "name email phone")
      .populate("createdBy", "firstName lastName email");
    if (!order) throw new Error("Orden no encontrada");
    return order;
  }

  async createOrder(
    orderData: any,
    userId: string,
    userRole?: string,
  ): Promise<IOrder> {
    if (
      orderData.type !== MovementType.SALE &&
      userRole &&
      !PRIVILEGED_ROLES.includes(userRole)
    ) {
      throw new Error(
        "No tiene permisos para crear órdenes que no sean de venta",
      );
    }

    if (orderData.type === MovementType.SALE) {
      if (!orderData.client) {
        throw new Error("Selecciona un cliente");
      }

      const client = await clientService.assertClientExists(orderData.client);
      orderData.customerName = client.name;
      orderData.customerEmail = client.email;
      orderData.customerPhone = client.phone;
    } else {
      orderData.client = undefined;
      orderData.customerName = undefined;
      orderData.customerEmail = undefined;
      orderData.customerPhone = undefined;
    }

    const { processedItems, subtotal } = await this.validateAndProcessItems(
      orderData.items,
      orderData.type,
    );

    const tax = orderData.tax || 0;
    const discount = orderData.discount || 0;
    const total = subtotal + tax - discount;

    const order = new Order({
      ...orderData,
      items: processedItems,
      subtotal,
      total,
      createdBy: userId,
      // paymentType se maneja automáticamente por el default en el schema
      // pero si se envía explícitamente, se usará ese valor
    });

    await order.save();

    if (order.status === OrderStatus.COMPLETED) {
      await this.updateStockForOrder(order);
    }

    return order.populate(["items.product", "supplier", "createdBy"]);
  }

  async updateOrder(
    id: string,
    orderData: any,
    userId: string,
  ): Promise<IOrder> {
    // Buscar la orden existente
    const existingOrder = await Order.findById(id);
    if (!existingOrder) throw new Error("Orden no encontrada");

    // Solo permitir editar si está en estado PENDING
    if (existingOrder.status !== OrderStatus.PENDING) {
      throw new Error("Solo se pueden editar órdenes en estado pendiente");
    }

    // Validar que el tipo no cambie (o permitirlo si tu lógica lo permite)
    // Si quieres permitir cambiar el tipo, descomenta esto:
    // if (orderData.type && orderData.type !== existingOrder.type) {
    //   throw new Error("No se puede cambiar el tipo de orden");
    // }

    // Procesar items si vienen nuevos. Se usa el mismo helper que createOrder
    // para que la regla de validación de stock sea idéntica en ambos casos
    // (antes createOrder solo validaba stock si el tipo era "sale", y
    // updateOrder usaba una condición ligeramente distinta).
    if (orderData.items && orderData.items.length > 0) {
      const effectiveType = orderData.type ?? existingOrder.type;
      const { processedItems, subtotal } = await this.validateAndProcessItems(
        orderData.items,
        effectiveType,
      );

      existingOrder.items = processedItems;
      existingOrder.subtotal = subtotal;

      // Recalcular totales
      const tax = orderData.tax ?? existingOrder.tax ?? 0;
      const discount = orderData.discount ?? existingOrder.discount ?? 0;
      existingOrder.tax = tax;
      existingOrder.discount = discount;
      existingOrder.total = subtotal + tax - discount;
    }

    // Actualizar campos permitidos
    if (orderData.supplier !== undefined)
      existingOrder.supplier = orderData.supplier;
    if (
      (orderData.type ?? existingOrder.type) === MovementType.SALE &&
      orderData.client !== undefined
    ) {
      const client = await clientService.assertClientExists(orderData.client);
      existingOrder.client = client._id;
      existingOrder.customerName = client.name;
      existingOrder.customerEmail = client.email;
      existingOrder.customerPhone = client.phone;
    }
    if ((orderData.type ?? existingOrder.type) !== MovementType.SALE) {
      existingOrder.client = undefined;
      existingOrder.customerName = undefined;
      existingOrder.customerEmail = undefined;
      existingOrder.customerPhone = undefined;
    }
    if (orderData.customerName !== undefined)
      existingOrder.customerName = orderData.customerName;
    if (orderData.customerEmail !== undefined)
      existingOrder.customerEmail = orderData.customerEmail;
    if (orderData.customerPhone !== undefined)
      existingOrder.customerPhone = orderData.customerPhone;
    if (orderData.notes !== undefined) existingOrder.notes = orderData.notes;
    if (orderData.paymentType !== undefined)
      existingOrder.paymentType = orderData.paymentType;

    existingOrder.updatedAt = new Date();
    await existingOrder.save();

    return existingOrder.populate(["items.product", "supplier", "client", "createdBy"]);
  }

  async updateOrderStatus(
    id: string,
    status: string,
    userRole?: string,
  ): Promise<IOrder> {
    const order = await Order.findById(id);
    if (!order) throw new Error("Orden no encontrada");

    const validStatuses = Object.values(OrderStatus) as string[];
    if (!validStatuses.includes(status)) {
      throw new Error("Estado de orden inválido");
    }

    if (
      order.type !== MovementType.SALE &&
      userRole &&
      !PRIVILEGED_ROLES.includes(userRole)
    ) {
      throw new Error(
        "No tiene permisos para modificar el estado de esta orden",
      );
    }

    const previousStatus = order.status;

    if (previousStatus === status) {
      throw new Error(`La orden ya está en estado "${status}"`);
    }

    // Una orden cancelada es un estado terminal: no se puede reabrir ni
    // completar después de cancelada.
    if (previousStatus === OrderStatus.CANCELLED) {
      throw new Error("No se puede modificar una orden cancelada");
    }

    // Solo se puede completar una orden que esté pendiente.
    if (status === OrderStatus.COMPLETED && previousStatus !== OrderStatus.PENDING) {
      throw new Error("Solo se puede completar una orden pendiente");
    }

    // No tiene sentido regresar una orden a "pendiente" una vez que avanzó.
    if (status === OrderStatus.PENDING) {
      throw new Error("No se puede volver una orden a estado pendiente");
    }

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
      await this.updateStockForOrder(order);
    } else if (
      status === OrderStatus.CANCELLED &&
      previousStatus === OrderStatus.COMPLETED
    ) {
      // La orden ya había afectado el stock al completarse; hay que
      // revertir ese movimiento antes de marcarla como cancelada.
      await this.reverseStockForOrder(order);
    }

    order.status = status as (typeof OrderStatus)[keyof typeof OrderStatus];
    await order.save();
    return order.populate(["items.product", "supplier", "client", "createdBy"]);
  }

  /**
   * Aplica el movimiento de stock de una orden usando operaciones atómicas
   * de MongoDB ($inc con filtro) en vez de leer el producto, calcular en
   * memoria y guardar. Con el patrón anterior (findById + save), dos ventas
   * simultáneas del mismo producto podían leer el mismo stock disponible y
   * ambas pasar la validación, generando sobreventa. Con $inc + un filtro
   * "stock >= cantidad", MongoDB serializa la operación a nivel de
   * documento: si el stock ya no alcanza en el momento exacto de aplicar el
   * descuento, la operación falla en vez de dejar el stock en negativo.
   */
  private async updateStockForOrder(order: IOrder): Promise<void> {
    for (const item of order.items) {
      if (
        order.type === MovementType.PURCHASE ||
        order.type === MovementType.RETURN ||
        order.type === MovementType.ADJUSTMENT
      ) {
        // Compra, devolución y ajuste suman stock (un ajuste representa una
        // corrección positiva, ej. unidades encontradas en un conteo).
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      } else if (order.type === MovementType.SALE) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true },
        );
        if (!updated) {
          throw new Error(
            `Stock insuficiente para completar la venta: otro movimiento consumió el stock disponible de uno de los productos`,
          );
        }
      }
    }
  }

  /**
   * Revierte exactamente el movimiento de stock que hizo updateStockForOrder,
   * usado cuando una orden completada se cancela después. También atómica,
   * y usa una pipeline de actualización para nunca dejar el stock negativo.
   */
  private async reverseStockForOrder(order: IOrder): Promise<void> {
    for (const item of order.items) {
      if (
        order.type === MovementType.PURCHASE ||
        order.type === MovementType.RETURN ||
        order.type === MovementType.ADJUSTMENT
      ) {
        await Product.findByIdAndUpdate(item.product, [
          {
            $set: {
              stock: {
                $max: [0, { $subtract: ["$stock", item.quantity] }],
              },
            },
          },
        ]);
      } else if (order.type === MovementType.SALE) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }
  }

  async getTodaySales(): Promise<{ count: number; total: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Order.aggregate([
      {
        $match: {
          type: MovementType.SALE,
          status: OrderStatus.COMPLETED,
          completedAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" } } },
    ]);

    return result[0] || { count: 0, total: 0 };
  }

  async getTopSellingProducts(limit: number = 5): Promise<any[]> {
    return Order.aggregate([
      { $match: { type: MovementType.SALE, status: OrderStatus.COMPLETED } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          name: "$product.name",
          sku: "$product.sku",
          totalSold: 1,
          totalRevenue: 1,
        },
      },
    ]);
  }

  async getMonthlyRevenue(months: number = 12): Promise<any[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return Order.aggregate([
      {
        $match: {
          type: MovementType.SALE,
          status: OrderStatus.COMPLETED,
          completedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            month: { $month: "$completedAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: {
                  if: { $lt: ["$_id.month", 10] },
                  then: { $concat: ["0", { $toString: "$_id.month" }] },
                  else: { $toString: "$_id.month" },
                },
              },
            ],
          },
          revenue: 1,
          orders: 1,
        },
      },
    ]);
  }

  async getPendingCount(): Promise<number> {
    return Order.countDocuments({ status: OrderStatus.PENDING });
  }

  /**
   * Resumen de compras de un cliente: cuántas ventas completadas tiene y
   * cuánto ha gastado en total. Antes no existía ninguna forma de consultar
   * el historial/valor de compra de un cliente específico.
   */
  async getClientStats(
    clientId: string,
  ): Promise<{ totalOrders: number; totalSpent: number }> {
    const result = await Order.aggregate([
      {
        $match: {
          client: new mongoose.Types.ObjectId(clientId),
          type: MovementType.SALE,
          status: OrderStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
    ]);

    return result[0]
      ? { totalOrders: result[0].totalOrders, totalSpent: result[0].totalSpent }
      : { totalOrders: 0, totalSpent: 0 };
  }
}

export const orderService = new OrderService();

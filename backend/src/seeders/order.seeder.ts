import { Order, MovementType, OrderStatus } from "../models/Order";
import { Product } from "../models/Product";
import mongoose from "mongoose";

interface OrderStats {
  totalOrders: number;
  sales: number;
  purchases: number;
  returns: number;
  adjustments: number;
  totalRevenue: number;
  dateRange: string;
}

export const seedOrders = async (
  products: Array<{
    id: mongoose.Types.ObjectId;
    price: number;
    name: string;
    stock: number;
  }>,
  userIds: mongoose.Types.ObjectId[],
): Promise<OrderStats> => {
  await Order.deleteMany({});
  console.log("🗑️  Colección de órdenes limpiada");

  const orders = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // Clientes realistas para ventas
  const customers = [
    { name: "Juan Pérez", email: "juan.perez@gmail.com", phone: "5512345678" },
    {
      name: "María García",
      email: "maria.garcia@hotmail.com",
      phone: "5587654321",
    },
    {
      name: "Carlos López",
      email: "carlos.lopez@outlook.com",
      phone: "5523456789",
    },
    {
      name: "Ana Martínez",
      email: "ana.martinez@yahoo.com",
      phone: "5534567890",
    },
    {
      name: "Roberto Sánchez",
      email: "roberto.sanchez@gmail.com",
      phone: "5545678901",
    },
    {
      name: "Laura Torres",
      email: "laura.torres@live.com",
      phone: "5556789012",
    },
    {
      name: "Miguel Ángel Ruiz",
      email: "miguel.ruiz@gmail.com",
      phone: "5567890123",
    },
    {
      name: "Patricia Flores",
      email: "patricia.flores@hotmail.com",
      phone: "5578901234",
    },
    {
      name: "Fernando Castillo",
      email: "fernando.castillo@outlook.com",
      phone: "5589012345",
    },
    {
      name: "Diana Hernández",
      email: "diana.hernandez@gmail.com",
      phone: "5590123456",
    },
    {
      name: "Alejandro Ramírez",
      email: "alejandro.r@gmail.com",
      phone: "5511122233",
    },
    {
      name: "Sofía Mendoza",
      email: "sofia.m@hotmail.com",
      phone: "5522233344",
    },
    {
      name: "Ricardo Vega",
      email: "ricardo.v@outlook.com",
      phone: "5533344455",
    },
    {
      name: "Carmen Ortiz",
      email: "carmen.ortiz@gmail.com",
      phone: "5544455566",
    },
    {
      name: "Jorge Morales",
      email: "jorge.morales@live.com",
      phone: "5555566677",
    },
  ];

  // Generar órdenes por día durante 6 meses
  let currentDate = new Date(sixMonthsAgo);
  let orderCounter = 1;
  let totalRevenue = 0;

  // Productos más populares (índices)
  const popularProducts = [0, 1, 4, 7, 8, 10, 15, 16, 20, 25];
  const midProducts = [2, 3, 5, 6, 9, 11, 12, 17, 18, 21, 26, 27];
  const lowProducts = [
    13, 14, 19, 22, 23, 24, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49,
  ];

  while (currentDate <= now) {
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPayday =
      currentDate.getDate() === 15 ||
      currentDate.getDate() === 30 ||
      currentDate.getDate() === 31;

    // Determinar cantidad de órdenes del día basado en patrones realistas
    let dailyOrders = Math.floor(Math.random() * 3) + 1;

    if (isWeekend) dailyOrders += 2;
    if (isPayday) dailyOrders += 3;

    // Compras a proveedores (2-3 veces por semana)
    const shouldBuy = dayOfWeek === 1 || dayOfWeek === 4;

    if (shouldBuy) {
      // Generar orden de compra
      const numItems = Math.floor(Math.random() * 5) + 3;
      const items = [];
      let subtotal = 0;

      for (let i = 0; i < numItems; i++) {
        const prodIndex = Math.floor(Math.random() * products.length);
        const product = products[prodIndex];
        const quantity = Math.floor(Math.random() * 20) + 10;

        items.push({
          product: product.id,
          quantity,
          unitPrice: product.price * 0.6,
          totalPrice: quantity * (product.price * 0.6),
        });

        subtotal += quantity * (product.price * 0.6);
      }

      const tax = subtotal * 0.16;
      const total = subtotal + tax;

      orders.push({
        orderNumber: `OC-${currentDate.getTime().toString(36).toUpperCase()}-${orderCounter}`,
        type: MovementType.PURCHASE,
        status: OrderStatus.COMPLETED,
        items,
        subtotal,
        tax,
        discount: 0,
        total,
        supplier: new mongoose.Types.ObjectId(),
        notes: `Compra semanal - ${currentDate.toLocaleDateString("es-MX")}`,
        createdBy: userIds[1],
        createdAt: new Date(currentDate.setHours(9, 0, 0, 0)),
        updatedAt: new Date(currentDate.setHours(9, 30, 0, 0)),
        completedAt: new Date(currentDate.setHours(10, 0, 0, 0)),
      });

      orderCounter++;
    }

    // Generar ventas del día
    for (let i = 0; i < dailyOrders; i++) {
      const hour = 10 + Math.floor(Math.random() * 10);
      const minute = Math.floor(Math.random() * 60);

      const orderDate = new Date(currentDate);
      orderDate.setHours(hour, minute, 0, 0);

      // Determinar tipo de orden (90% ventas, 5% devoluciones, 5% ajustes)
      const rand = Math.random();
      let orderType: (typeof MovementType)[keyof typeof MovementType] =
        MovementType.SALE;
      let orderStatus: (typeof OrderStatus)[keyof typeof OrderStatus] =
        OrderStatus.COMPLETED;

      if (rand > 0.95) {
        orderType = MovementType.RETURN;
      } else if (rand > 0.9) {
        orderType = MovementType.ADJUSTMENT;
      }

      // 10% de probabilidad de quedar pendiente
      if (Math.random() <= 0.1) {
        orderStatus = OrderStatus.PENDING;
      }

      const numItems =
        orderType === MovementType.SALE ? Math.floor(Math.random() * 3) + 1 : 1;

      const items = [];
      let subtotal = 0;

      // Seleccionar productos basado en popularidad
      let productPool = popularProducts;
      const popularityRand = Math.random();
      if (popularityRand > 0.7) productPool = midProducts;
      else if (popularityRand > 0.9) productPool = lowProducts;

      for (let j = 0; j < numItems; j++) {
        const prodIndex =
          productPool[Math.floor(Math.random() * productPool.length)];
        const product = products[prodIndex];
        const quantity =
          orderType === MovementType.SALE
            ? Math.floor(Math.random() * 2) + 1
            : 1;

        items.push({
          product: product.id,
          quantity,
          unitPrice: product.price,
          totalPrice: quantity * product.price,
        });

        subtotal += quantity * product.price;
      }

      const tax = subtotal * 0.16;
      const discount = Math.random() > 0.8 ? subtotal * 0.1 : 0;
      const total = subtotal + tax - discount;

      const customer = customers[Math.floor(Math.random() * customers.length)];

      // Generar número de orden según tipo
      let orderNumber: string;
      if (orderType === MovementType.SALE) {
        orderNumber = `VE-${orderDate.getTime().toString(36).toUpperCase()}-${orderCounter}`;
      } else if (orderType === MovementType.RETURN) {
        orderNumber = `DE-${orderDate.getTime().toString(36).toUpperCase()}-${orderCounter}`;
      } else {
        orderNumber = `AJ-${orderDate.getTime().toString(36).toUpperCase()}-${orderCounter}`;
      }

      // Determinar notas según tipo
      let notes: string | undefined;
      if (orderType === MovementType.RETURN) {
        notes = "Devolución por defecto de fábrica";
      } else if (orderType === MovementType.ADJUSTMENT) {
        notes = "Ajuste de inventario por auditoría";
      }

      // Datos de cliente solo para ventas
      const customerName =
        orderType === MovementType.SALE ? customer.name : undefined;
      const customerEmail =
        orderType === MovementType.SALE ? customer.email : undefined;
      const customerPhone =
        orderType === MovementType.SALE ? customer.phone : undefined;

      orders.push({
        orderNumber,
        type: orderType,
        status: orderStatus,
        items,
        subtotal,
        tax,
        discount,
        total,
        customerName,
        customerEmail,
        customerPhone,
        notes,
        createdBy: userIds[Math.floor(Math.random() * 3) + 2],
        createdAt: orderDate,
        updatedAt: orderDate,
        completedAt:
          orderStatus === OrderStatus.COMPLETED
            ? new Date(orderDate.getTime() + 1000 * 60 * 30)
            : undefined,
      });

      // Solo sumar ingresos si es venta completada
      if (
        orderType === MovementType.SALE &&
        orderStatus === OrderStatus.COMPLETED
      ) {
        totalRevenue += total;
      }

      orderCounter++;
    }

    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  // Insertar órdenes en batches para mejor performance
  const batchSize = 500;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    await Order.insertMany(batch);
    console.log(
      `📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(orders.length / batchSize)} insertado (${batch.length} órdenes)`,
    );
  }

  // Contar por tipo usando filter
  const sales = orders.filter((o) => o.type === MovementType.SALE).length;
  const purchases = orders.filter(
    (o) => o.type === MovementType.PURCHASE,
  ).length;
  const returns = orders.filter((o) => o.type === MovementType.RETURN).length;
  const adjustments = orders.filter(
    (o) => o.type === MovementType.ADJUSTMENT,
  ).length;

  console.log(`✅ ${orders.length} órdenes creadas en total`);
  console.log(`   • ${sales} ventas`);
  console.log(`   • ${purchases} compras`);
  console.log(`   • ${returns} devoluciones`);
  console.log(`   • ${adjustments} ajustes`);

  return {
    totalOrders: orders.length,
    sales,
    purchases,
    returns,
    adjustments,
    totalRevenue: Math.round(totalRevenue),
    dateRange: `${sixMonthsAgo.toLocaleDateString("es-MX")} - ${now.toLocaleDateString("es-MX")}`,
  };
};

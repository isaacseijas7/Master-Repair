import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { orderService } from "../services/order.service";

// Interfaces de tipo para las rutas
interface GetOrdersRoute extends RouteGenericInterface {
  Querystring: any;
}

interface GetOrderByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateOrderRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateOrderRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: { status: string };
}

interface UpdateOrderStatusRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: { status: string };
}

interface QueryLimit extends RouteGenericInterface {
  Querystring: { limit?: string };
}

interface QueryMonths extends RouteGenericInterface {
  Querystring: { months?: string };
}

export class OrderController {
  async getOrders(
    request: FastifyRequest<GetOrdersRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await orderService.getOrders(request.query);
      reply.send({
        success: true,
        message: "Órdenes obtenidas exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getOrderById(
    request: FastifyRequest<GetOrderByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const order = await orderService.getOrderById(request.params.id);
      reply.send({
        success: true,
        message: "Orden obtenida exitosamente",
        data: { order },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createOrder(
    request: FastifyRequest<CreateOrderRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      if (!request.user) throw new Error("No autenticado");
      const order = await orderService.createOrder(
        request.body,
        request.user.userId,
      );
      reply.status(201).send({
        success: true,
        message: "Orden creada exitosamente",
        data: { order },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async updateOrder(
    request: FastifyRequest<UpdateOrderRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      if (!request.user) throw new Error("No autenticado");

      const order = await orderService.updateOrder(
        request.params.id,
        request.body,
        request.user.userId,
      );

      reply.send({
        success: true,
        message: "Orden actualizada exitosamente",
        data: { order },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async updateOrderStatus(
    request: FastifyRequest<UpdateOrderStatusRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const order = await orderService.updateOrderStatus(
        request.params.id,
        request.body.status,
      );
      reply.send({
        success: true,
        message: "Estado de orden actualizado exitosamente",
        data: { order },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async getTodaySales(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await orderService.getTodaySales();
      reply.send({
        success: true,
        message: "Ventas de hoy obtenidas exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getTopSellingProducts(
    request: FastifyRequest<QueryLimit>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const limit = request.query.limit ? parseInt(request.query.limit) : 5;
      const products = await orderService.getTopSellingProducts(limit);
      reply.send({
        success: true,
        message: "Productos más vendidos obtenidos exitosamente",
        data: { products },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getMonthlyRevenue(
    request: FastifyRequest<QueryMonths>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const months = request.query.months ? parseInt(request.query.months) : 12;
      const revenue = await orderService.getMonthlyRevenue(months);
      reply.send({
        success: true,
        message: "Ingresos mensuales obtenidos exitosamente",
        data: { revenue },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getPendingOrdersCount(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const count = await orderService.getPendingCount();
      reply.send({
        success: true,
        message: "Conteo de órdenes pendientes obtenido exitosamente",
        data: { count },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }
}

export const orderController = new OrderController();

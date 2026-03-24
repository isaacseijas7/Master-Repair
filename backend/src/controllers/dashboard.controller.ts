import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { dashboardService } from "../services/dashboard.service";

// Interfaces de tipo para las rutas
interface QueryLimit extends RouteGenericInterface {
  Querystring: { limit?: string };
}

interface QueryMonths extends RouteGenericInterface {
  Querystring: { months?: string };
}

export class DashboardController {
  async getDashboardData(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const data = await dashboardService.getDashboardData();
      reply.send({
        success: true,
        message: "Datos del dashboard obtenidos exitosamente",
        data,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getMetrics(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const metrics = await dashboardService.getMetrics();
      reply.send({
        success: true,
        message: "Métricas obtenidas exitosamente",
        data: metrics,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getTopProducts(
    request: FastifyRequest<QueryLimit>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const limit = request.query.limit ? parseInt(request.query.limit) : 5;
      const products = await dashboardService.getTopProducts(limit);
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
      const revenue = await dashboardService.getMonthlyRevenue(months);
      reply.send({
        success: true,
        message: "Ingresos mensuales obtenidos exitosamente",
        data: { revenue },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getStockAlerts(
    request: FastifyRequest<QueryLimit>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const limit = request.query.limit ? parseInt(request.query.limit) : 10;
      const alerts = await dashboardService.getStockAlerts(limit);
      reply.send({
        success: true,
        message: "Alertas de stock obtenidas exitosamente",
        data: { alerts },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getRecentOrders(
    request: FastifyRequest<QueryLimit>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const limit = request.query.limit ? parseInt(request.query.limit) : 5;
      const orders = await dashboardService.getRecentOrders(limit);
      reply.send({
        success: true,
        message: "Órdenes recientes obtenidas exitosamente",
        data: { orders },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }
}

export const dashboardController = new DashboardController();

import { FastifyInstance } from "fastify";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get(
    "/",
    dashboardController.getDashboardData.bind(dashboardController),
  );
  fastify.get(
    "/metrics",
    dashboardController.getMetrics.bind(dashboardController),
  );
  fastify.get(
    "/top-products",
    dashboardController.getTopProducts.bind(dashboardController),
  );
  fastify.get(
    "/monthly-revenue",
    dashboardController.getMonthlyRevenue.bind(dashboardController),
  );
  fastify.get(
    "/stock-alerts",
    dashboardController.getStockAlerts.bind(dashboardController),
  );
  fastify.get(
    "/recent-orders",
    dashboardController.getRecentOrders.bind(dashboardController),
  );
}

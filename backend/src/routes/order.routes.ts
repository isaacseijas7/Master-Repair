import { FastifyInstance } from "fastify";
import { orderController } from "../controllers/order.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function orderRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", orderController.getOrders.bind(orderController));
  fastify.get(
    "/stats/today",
    orderController.getTodaySales.bind(orderController),
  );
  fastify.get(
    "/stats/top-products",
    orderController.getTopSellingProducts.bind(orderController),
  );
  fastify.get(
    "/stats/monthly-revenue",
    orderController.getMonthlyRevenue.bind(orderController),
  );
  fastify.get(
    "/stats/pending-count",
    orderController.getPendingOrdersCount.bind(orderController),
  );
  fastify.get("/:id", orderController.getOrderById.bind(orderController));
  fastify.post("/", orderController.createOrder.bind(orderController));
  fastify.put("/:id/update", orderController.updateOrder.bind(orderController));
  fastify.patch(
    "/:id/status",
    orderController.updateOrderStatus.bind(orderController),
  );
}

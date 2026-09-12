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

  // Crear una orden queda abierto a cualquier rol autenticado: el propio
  // servicio rechaza tipos distintos de "venta" si el usuario es cashier
  // (ver order.service.ts), porque el Cashier sí debe poder registrar ventas.
  fastify.post("/", orderController.createOrder.bind(orderController));

  // Editar una orden ya creada queda reservado a Admin/Manager: el alcance
  // de Cashier documentado en el README es únicamente crear ventas, no
  // editar órdenes existentes de ningún tipo.
  fastify.put(
    "/:id/update",
    { preHandler: [authorize("admin", "manager")] },
    orderController.updateOrder.bind(orderController),
  );

  // Cambiar el estado (completar/cancelar) queda abierto a cualquier rol
  // autenticado: el servicio valida que un Cashier solo pueda hacerlo sobre
  // órdenes de tipo "venta" (ver order.service.ts).
  fastify.patch(
    "/:id/status",
    orderController.updateOrderStatus.bind(orderController),
  );
}

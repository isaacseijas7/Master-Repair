import { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.routes";
import { productRoutes } from "./product.routes";
import { categoryRoutes } from "./category.routes";
import { supplierRoutes } from "./supplier.routes";
import { orderRoutes } from "./order.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { profileRoutes } from "./profile.routes";

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/health", async () => {
    return {
      success: true,
      message: "API funcionando correctamente",
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  });

  const apiPrefix = "/api/v1";

  await fastify.register(authRoutes, { prefix: `${apiPrefix}/auth` });
  await fastify.register(profileRoutes, { prefix: `${apiPrefix}/profile` });
  await fastify.register(productRoutes, { prefix: `${apiPrefix}/products` });
  await fastify.register(categoryRoutes, { prefix: `${apiPrefix}/categories` });
  await fastify.register(supplierRoutes, { prefix: `${apiPrefix}/suppliers` });
  await fastify.register(orderRoutes, { prefix: `${apiPrefix}/orders` });
  await fastify.register(dashboardRoutes, { prefix: `${apiPrefix}/dashboard` });
}

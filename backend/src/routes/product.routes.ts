import { FastifyInstance } from "fastify";
import { productController } from "../controllers/product.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function productRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", productController.getProducts.bind(productController));
  fastify.get(
    "/low-stock",
    productController.getLowStockProducts.bind(productController),
  );
  fastify.get("/:id", productController.getProductById.bind(productController));
  fastify.post(
    "/",
    { preHandler: [authorize("admin", "manager")] },
    productController.createProduct.bind(productController),
  );
  fastify.put(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    productController.updateProduct.bind(productController),
  );
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    productController.deleteProduct.bind(productController),
  );
}

import { FastifyInstance } from "fastify";
import { brandController } from "../controllers/brand.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function brandRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", brandController.getBrands.bind(brandController));
  fastify.get("/all", brandController.getAllBrands.bind(brandController));
  fastify.get(
    "/export",
    { preHandler: [authorize("admin", "manager")] },
    brandController.exportBrands.bind(brandController),
  );
  fastify.get("/:id", brandController.getBrandById.bind(brandController));
  fastify.post(
    "/",
    { preHandler: [authorize("admin", "manager")] },
    brandController.createBrand.bind(brandController),
  );
  fastify.put(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    brandController.updateBrand.bind(brandController),
  );
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    brandController.deleteBrand.bind(brandController),
  );
}

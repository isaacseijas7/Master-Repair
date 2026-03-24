import { FastifyInstance } from "fastify";
import { categoryController } from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function categoryRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", categoryController.getCategories.bind(categoryController));
  fastify.get(
    "/active",
    categoryController.getActiveCategories.bind(categoryController),
  );
  fastify.get(
    "/:id",
    categoryController.getCategoryById.bind(categoryController),
  );
  fastify.post(
    "/",
    { preHandler: [authorize("admin", "manager")] },
    categoryController.createCategory.bind(categoryController),
  );
  fastify.put(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    categoryController.updateCategory.bind(categoryController),
  );
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    categoryController.deleteCategory.bind(categoryController),
  );
}

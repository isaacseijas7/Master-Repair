import { FastifyInstance } from "fastify";
import { screenController } from "../controllers/screen.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function screenRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", screenController.getScreens.bind(screenController));
  fastify.get(
    "/export",
    { preHandler: [authorize("admin", "manager")] },
    screenController.exportScreens.bind(screenController),
  );
  fastify.get("/:id", screenController.getScreenById.bind(screenController));
  fastify.post(
    "/",
    { preHandler: [authorize("admin", "manager")] },
    screenController.createScreen.bind(screenController),
  );
  fastify.put(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    screenController.updateScreen.bind(screenController),
  );
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    screenController.deleteScreen.bind(screenController),
  );
}

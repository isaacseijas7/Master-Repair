import { FastifyInstance } from "fastify";
import { userController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

// Todo el módulo de administración de usuarios es exclusivo del rol admin
// (mismo precedente que /auth/register), así que authorize("admin") se
// aplica como hook global en vez de ruta por ruta.
export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);
  fastify.addHook("preHandler", authorize("admin"));

  fastify.get("/", userController.getUsers.bind(userController));
  fastify.get("/:id", userController.getUserById.bind(userController));
  fastify.post("/", userController.createUser.bind(userController));
  fastify.put("/:id", userController.updateUser.bind(userController));
  fastify.delete("/:id", userController.deleteUser.bind(userController));
}

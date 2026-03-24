import { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/login", authController.login.bind(authController));
  fastify.post("/register", authController.register.bind(authController));
  fastify.get(
    "/profile",
    { preHandler: [authenticate] },
    authController.getProfile.bind(authController),
  );
}

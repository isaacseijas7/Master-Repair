import { FastifyInstance } from "fastify";
import { authController } from "../controllers/auth.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/login", authController.login.bind(authController));

  // Solo un admin autenticado puede crear nuevas cuentas de usuario.
  // Antes este endpoint era público y aceptaba cualquier "role" del body,
  // permitiendo que cualquiera se creara una cuenta admin (hallazgo crítico
  // de la auditoría de seguridad, Fase 1).
  fastify.post(
    "/register",
    { preHandler: [authenticate, authorize("admin")] },
    authController.register.bind(authController),
  );

  fastify.get(
    "/profile",
    { preHandler: [authenticate] },
    authController.getProfile.bind(authController),
  );
}

import { FastifyInstance } from "fastify";
import { profileController } from "../controllers/profile.controller";
import { authenticate } from "../middleware/auth.middleware";

export async function profileRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/",
    { preHandler: [authenticate] },
    profileController.getProfile.bind(profileController),
  );

  fastify.put(
    "/",
    { preHandler: [authenticate] },
    profileController.updateProfile.bind(profileController),
  );

  fastify.put(
    "/password",
    { preHandler: [authenticate] },
    profileController.changePassword.bind(profileController),
  );
}

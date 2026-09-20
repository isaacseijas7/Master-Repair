import { FastifyInstance } from "fastify";
import { phoneController } from "../controllers/phone.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function phoneRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", phoneController.getPhones.bind(phoneController));
  fastify.get(
    "/export",
    { preHandler: [authorize("admin", "manager")] },
    phoneController.exportPhones.bind(phoneController),
  );
  fastify.get("/:id", phoneController.getPhoneById.bind(phoneController));
  fastify.post(
    "/",
    { preHandler: [authorize("admin", "manager")] },
    phoneController.createPhone.bind(phoneController),
  );
  fastify.put(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    phoneController.updatePhone.bind(phoneController),
  );
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    phoneController.deletePhone.bind(phoneController),
  );
}

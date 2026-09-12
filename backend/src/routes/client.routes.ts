import { FastifyInstance } from "fastify";
import { clientController } from "../controllers/client.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function clientRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);
  fastify.get("/", clientController.getClients.bind(clientController));
  fastify.get("/:id", clientController.getClientById.bind(clientController));
  fastify.get(
    "/:id/stats",
    clientController.getClientStats.bind(clientController),
  );
  fastify.post("/", clientController.createClient.bind(clientController));
  fastify.put("/:id", clientController.updateClient.bind(clientController));
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    clientController.deleteClient.bind(clientController),
  );
}
import { FastifyInstance } from "fastify";
import { supplierController } from "../controllers/supplier.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export async function supplierRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", authenticate);

  fastify.get("/", supplierController.getSuppliers.bind(supplierController));
  fastify.get(
    "/active",
    supplierController.getActiveSuppliers.bind(supplierController),
  );
  fastify.get(
    "/:id",
    supplierController.getSupplierById.bind(supplierController),
  );
  fastify.post(
    "/",
    { preHandler: [authorize("admin", "manager")] },
    supplierController.createSupplier.bind(supplierController),
  );
  fastify.put(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    supplierController.updateSupplier.bind(supplierController),
  );
  fastify.delete(
    "/:id",
    { preHandler: [authorize("admin", "manager")] },
    supplierController.deleteSupplier.bind(supplierController),
  );
}

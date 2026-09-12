// backend/src/controllers/supplier.controller.ts
import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { supplierService } from "../services/supplier.service";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../schemas/supplier.schema";

// ==========================================
// INTERFACES DE TIPO PARA LAS RUTAS
// ==========================================

interface GetSuppliersRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface GetSupplierByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateSupplierRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateSupplierRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

interface DeleteSupplierRoute extends RouteGenericInterface {
  Params: { id: string };
}

// ==========================================
// CONTROLLER
// ==========================================

export class SupplierController {
  async getSuppliers(
    request: FastifyRequest<GetSuppliersRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await supplierService.getSuppliers(request.query);
      reply.send({
        success: true,
        message: "Proveedores obtenidos exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getActiveSuppliers(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const suppliers = await supplierService.getActiveSuppliers();
      reply.send({
        success: true,
        message: "Proveedores activos obtenidos exitosamente",
        data: { suppliers },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getSupplierById(
    request: FastifyRequest<GetSupplierByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const supplier = await supplierService.getSupplierById(request.params.id);
      reply.send({
        success: true,
        message: "Proveedor obtenido exitosamente",
        data: { supplier },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createSupplier(
    request: FastifyRequest<CreateSupplierRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = createSupplierSchema.parse(request.body);
      const supplier = await supplierService.createSupplier(validatedData);
      reply.status(201).send({
        success: true,
        message: "Proveedor creado exitosamente",
        data: { supplier },
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        reply.status(400).send({
          success: false,
          message: "Error de validación",
          errors: error.errors,
        });
        return;
      }
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async updateSupplier(
    request: FastifyRequest<UpdateSupplierRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = updateSupplierSchema.parse(request.body);
      const supplier = await supplierService.updateSupplier(
        request.params.id,
        validatedData,
      );
      reply.send({
        success: true,
        message: "Proveedor actualizado exitosamente",
        data: { supplier },
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        reply.status(400).send({
          success: false,
          message: "Error de validación",
          errors: error.errors,
        });
        return;
      }
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async deleteSupplier(
    request: FastifyRequest<DeleteSupplierRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await supplierService.deleteSupplier(request.params.id);
      reply.send({
        success: true,
        message: "Proveedor eliminado exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }
}

export const supplierController = new SupplierController();

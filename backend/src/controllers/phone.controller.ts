import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import {
  phoneService,
  PHONE_EXPORT_COLUMNS,
  DEFAULT_PHONE_EXPORT_COLUMNS,
} from "../services/phone.service";
import { createPhoneSchema, updatePhoneSchema } from "../schemas/phone.schema";

// El precio de compra es un dato interno: solo admin y manager lo ven.
const canViewCost = (request: FastifyRequest) =>
  request.user?.role === "admin" || request.user?.role === "manager";

interface GetPhonesRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface ExportPhonesRoute extends RouteGenericInterface {
  // IDs de marca separados por coma; vacío = todas las marcas.
  Querystring: { brandIds?: string; columns?: string };
}

interface PhoneByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreatePhoneRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdatePhoneRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

export class PhoneController {
  async getPhones(
    request: FastifyRequest<GetPhonesRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await phoneService.getPhones(
        request.query,
        canViewCost(request),
      );
      reply.send({
        success: true,
        message: "Pantallas obtenidos exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getPhoneById(
    request: FastifyRequest<PhoneByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const phone = await phoneService.getPhoneById(
        request.params.id,
        canViewCost(request),
      );
      reply.send({
        success: true,
        message: "Pantalla obtenido exitosamente",
        data: { phone },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createPhone(
    request: FastifyRequest<CreatePhoneRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = createPhoneSchema.parse(request.body);
      const phone = await phoneService.createPhone(validatedData);
      reply.status(201).send({
        success: true,
        message: "Pantalla creado exitosamente",
        data: { phone },
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

  async updatePhone(
    request: FastifyRequest<UpdatePhoneRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = updatePhoneSchema.parse(request.body);
      const phone = await phoneService.updatePhone(
        request.params.id,
        validatedData,
      );
      reply.send({
        success: true,
        message: "Pantalla actualizado exitosamente",
        data: { phone },
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

  async deletePhone(
    request: FastifyRequest<PhoneByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await phoneService.deletePhone(request.params.id);
      reply.send({
        success: true,
        message: "Pantalla eliminado exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async exportPhones(
    request: FastifyRequest<ExportPhonesRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const brandIds = (request.query.brandIds ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (brandIds.some((id) => !/^[0-9a-fA-F]{24}$/.test(id))) {
        reply.status(400).send({ success: false, message: "Marca inválida" });
        return;
      }

      const columns = request.query.columns
        ? request.query.columns.split(",").map((c) => c.trim()).filter(Boolean)
        : DEFAULT_PHONE_EXPORT_COLUMNS;
      const validKeys = PHONE_EXPORT_COLUMNS.map((c) => c.key as string);
      if (
        columns.length === 0 ||
        columns.some((c) => !validKeys.includes(c))
      ) {
        reply.status(400).send({ success: false, message: "Columnas inválidas" });
        return;
      }

      const buffer = await phoneService.exportPhones(brandIds, columns);

      const timestamp = new Date().toISOString().split("T")[0];
      reply.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      reply.header(
        "Content-Disposition",
        `attachment; filename="telefonos-${timestamp}.xlsx"`,
      );
      reply.header("Content-Length", buffer.length);

      reply.send(buffer);
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }
}

export const phoneController = new PhoneController();

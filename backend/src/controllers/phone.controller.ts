import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { phoneService } from "../services/phone.service";
import { createPhoneSchema, updatePhoneSchema } from "../schemas/phone.schema";

interface GetPhonesRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
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
      const result = await phoneService.getPhones(request.query);
      reply.send({
        success: true,
        message: "Teléfonos obtenidos exitosamente",
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
      const phone = await phoneService.getPhoneById(request.params.id);
      reply.send({
        success: true,
        message: "Teléfono obtenido exitosamente",
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
        message: "Teléfono creado exitosamente",
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
        message: "Teléfono actualizado exitosamente",
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
        message: "Teléfono eliminado exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async exportPhones(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const buffer = await phoneService.exportPhones();

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

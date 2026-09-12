import { FastifyReply, FastifyRequest, RouteGenericInterface } from "fastify";
import { clientService } from "../services/client.service";
import { orderService } from "../services/order.service";
import { createClientSchema, updateClientSchema } from "../schemas/client.schema";

interface GetClientsRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface GetClientByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateClientRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateClientRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

interface DeleteClientRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface GetClientStatsRoute extends RouteGenericInterface {
  Params: { id: string };
}

export class ClientController {
  async getClients(
    request: FastifyRequest<GetClientsRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await clientService.getClients(request.query);
      reply.send({
        success: true,
        message: "Clientes obtenidos exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getClientById(
    request: FastifyRequest<GetClientByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const client = await clientService.getClientById(request.params.id);
      reply.send({
        success: true,
        message: "Cliente obtenido exitosamente",
        data: { client },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createClient(
    request: FastifyRequest<CreateClientRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = createClientSchema.parse(request.body);
      const client = await clientService.createClient(validatedData);
      reply.status(201).send({
        success: true,
        message: "Cliente creado exitosamente",
        data: { client },
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

  async updateClient(
    request: FastifyRequest<UpdateClientRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = updateClientSchema.parse(request.body);
      const client = await clientService.updateClient(
        request.params.id,
        validatedData,
      );
      reply.send({
        success: true,
        message: "Cliente actualizado exitosamente",
        data: { client },
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

  async getClientStats(
    request: FastifyRequest<GetClientStatsRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const stats = await orderService.getClientStats(request.params.id);
      reply.send({
        success: true,
        message: "Estadísticas del cliente obtenidas exitosamente",
        data: stats,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async deleteClient(
    request: FastifyRequest<DeleteClientRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await clientService.deleteClient(request.params.id);
      reply.send({
        success: true,
        message: "Cliente eliminado exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }
}

export const clientController = new ClientController();
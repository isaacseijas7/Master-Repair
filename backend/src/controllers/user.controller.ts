import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { userService } from "../services/user.service";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";

// ==========================================
// INTERFACES DE TIPO PARA LAS RUTAS
// ==========================================

interface GetUsersRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface GetUserByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateUserRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateUserRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

interface DeleteUserRoute extends RouteGenericInterface {
  Params: { id: string };
}

// ==========================================
// CONTROLLER
// ==========================================

export class UserController {
  async getUsers(
    request: FastifyRequest<GetUsersRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await userService.getUsers(request.query);
      reply.send({
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getUserById(
    request: FastifyRequest<GetUserByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const user = await userService.getUserById(request.params.id);
      reply.send({
        success: true,
        message: "Usuario obtenido exitosamente",
        data: { user },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createUser(
    request: FastifyRequest<CreateUserRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = createUserSchema.parse(request.body);
      const user = await userService.createUser(validatedData);
      reply.status(201).send({
        success: true,
        message: "Usuario creado exitosamente",
        data: { user },
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

  async updateUser(
    request: FastifyRequest<UpdateUserRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = updateUserSchema.parse(request.body);
      const user = await userService.updateUser(
        request.params.id,
        validatedData,
        request.user!.userId,
      );
      reply.send({
        success: true,
        message: "Usuario actualizado exitosamente",
        data: { user },
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

  async deleteUser(
    request: FastifyRequest<DeleteUserRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await userService.deleteUser(request.params.id, request.user!.userId);
      reply.send({
        success: true,
        message: "Usuario eliminado exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }
}

export const userController = new UserController();

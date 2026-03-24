import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { profileService } from "../services/profile.service";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../schemas/profile.schema";

// Interfaces de tipo para las rutas
interface UpdateProfileRoute extends RouteGenericInterface {
  Body: any;
}

interface ChangePasswordRoute extends RouteGenericInterface {
  Body: any;
}

export class ProfileController {
  async getProfile(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, message: "No autenticado" });
        return;
      }

      const profile = await profileService.getProfile(request.user.userId);
      reply.send({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: { user: profile },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async updateProfile(
    request: FastifyRequest<UpdateProfileRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, message: "No autenticado" });
        return;
      }

      const validatedData = updateProfileSchema.parse(request.body);

      const updatedProfile = await profileService.updateProfile(
        request.user.userId,
        validatedData,
      );

      reply.send({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: { user: updatedProfile },
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

  async changePassword(
    request: FastifyRequest<ChangePasswordRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      if (!request.user) {
        reply.status(401).send({ success: false, message: "No autenticado" });
        return;
      }

      const validatedData = changePasswordSchema.parse(request.body);

      const result = await profileService.changePassword(
        request.user.userId,
        validatedData,
      );

      reply.send({
        success: true,
        message: result.message,
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
}

export const profileController = new ProfileController();

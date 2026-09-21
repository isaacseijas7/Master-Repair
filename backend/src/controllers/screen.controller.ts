import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import {
  screenService,
  SCREEN_EXPORT_COLUMNS,
  DEFAULT_SCREEN_EXPORT_COLUMNS,
  SCREEN_EXPORT_SOURCES,
  ScreenExportSource,
} from "../services/screen.service";
import { createScreenSchema, updateScreenSchema } from "../schemas/screen.schema";

// El precio de compra es un dato interno: solo admin y manager lo ven.
const canViewCost = (request: FastifyRequest) =>
  request.user?.role === "admin" || request.user?.role === "manager";

interface GetScreensRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface ExportScreensRoute extends RouteGenericInterface {
  // IDs de marca separados por coma; vacío = todas las marcas.
  Querystring: { brandIds?: string; columns?: string; source?: string };
}

interface ScreenByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateScreenRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateScreenRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

export class ScreenController {
  async getScreens(
    request: FastifyRequest<GetScreensRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await screenService.getScreens(
        request.query,
        canViewCost(request),
      );
      reply.send({
        success: true,
        message: "Pantallas obtenidas exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getScreenById(
    request: FastifyRequest<ScreenByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const screen = await screenService.getScreenById(
        request.params.id,
        canViewCost(request),
      );
      reply.send({
        success: true,
        message: "Pantalla obtenida exitosamente",
        data: { screen },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createScreen(
    request: FastifyRequest<CreateScreenRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = createScreenSchema.parse(request.body);
      const screen = await screenService.createScreen(validatedData);
      reply.status(201).send({
        success: true,
        message: "Pantalla creada exitosamente",
        data: { screen },
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

  async updateScreen(
    request: FastifyRequest<UpdateScreenRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = updateScreenSchema.parse(request.body);
      const screen = await screenService.updateScreen(
        request.params.id,
        validatedData,
      );
      reply.send({
        success: true,
        message: "Pantalla actualizada exitosamente",
        data: { screen },
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

  async deleteScreen(
    request: FastifyRequest<ScreenByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await screenService.deleteScreen(request.params.id);
      reply.send({
        success: true,
        message: "Pantalla eliminada exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async exportScreens(
    request: FastifyRequest<ExportScreensRoute>,
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
        : DEFAULT_SCREEN_EXPORT_COLUMNS;
      const validKeys = SCREEN_EXPORT_COLUMNS.map((c) => c.key as string);
      if (
        columns.length === 0 ||
        columns.some((c) => !validKeys.includes(c))
      ) {
        reply.status(400).send({ success: false, message: "Columnas inválidas" });
        return;
      }

      const source = (request.query.source ?? "all") as ScreenExportSource;
      if (!SCREEN_EXPORT_SOURCES.includes(source)) {
        reply.status(400).send({ success: false, message: "Origen inválido" });
        return;
      }

      const buffer = await screenService.exportScreens(brandIds, columns, source);

      const timestamp = new Date().toISOString().split("T")[0];
      reply.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      reply.header(
        "Content-Disposition",
        `attachment; filename="pantallas-${timestamp}.xlsx"`,
      );
      reply.header("Content-Length", buffer.length);

      reply.send(buffer);
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }
}

export const screenController = new ScreenController();

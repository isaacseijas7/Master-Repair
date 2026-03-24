import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { categoryService } from "../services/category.service";

interface GetCategoriesRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface GetCategoryByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateCategoryRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateCategoryRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

interface DeleteCategoryRoute extends RouteGenericInterface {
  Params: { id: string };
}

export class CategoryController {
  async getCategories(
    request: FastifyRequest<GetCategoriesRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await categoryService.getCategories(request.query);
      reply.send({
        success: true,
        message: "Categorías obtenidas exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getActiveCategories(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const categories = await categoryService.getActiveCategories();
      reply.send({
        success: true,
        message: "Categorías activas obtenidas exitosamente",
        data: { categories },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getCategoryById(
    request: FastifyRequest<GetCategoryByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const category = await categoryService.getCategoryById(request.params.id);
      reply.send({
        success: true,
        message: "Categoría obtenida exitosamente",
        data: { category },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createCategory(
    request: FastifyRequest<CreateCategoryRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const category = await categoryService.createCategory(request.body);
      reply.status(201).send({
        success: true,
        message: "Categoría creada exitosamente",
        data: { category },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async updateCategory(
    request: FastifyRequest<UpdateCategoryRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const category = await categoryService.updateCategory(
        request.params.id,
        request.body,
      );
      reply.send({
        success: true,
        message: "Categoría actualizada exitosamente",
        data: { category },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async deleteCategory(
    request: FastifyRequest<DeleteCategoryRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await categoryService.deleteCategory(request.params.id);
      reply.send({
        success: true,
        message: "Categoría eliminada exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }
}

export const categoryController = new CategoryController();

import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { brandService } from "../services/brand.service";
import { createBrandSchema, updateBrandSchema } from "../schemas/brand.schema";

interface GetBrandsRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface BrandByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateBrandRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateBrandRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

export class BrandController {
  async getBrands(
    request: FastifyRequest<GetBrandsRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await brandService.getBrands(request.query);
      reply.send({
        success: true,
        message: "Marcas obtenidas exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getAllBrands(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const brands = await brandService.getAllBrands();
      reply.send({
        success: true,
        message: "Marcas obtenidas exitosamente",
        data: { brands },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getBrandById(
    request: FastifyRequest<BrandByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const brand = await brandService.getBrandById(request.params.id);
      reply.send({
        success: true,
        message: "Marca obtenida exitosamente",
        data: { brand },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createBrand(
    request: FastifyRequest<CreateBrandRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = createBrandSchema.parse(request.body);
      const brand = await brandService.createBrand(validatedData);
      reply.status(201).send({
        success: true,
        message: "Marca creada exitosamente",
        data: { brand },
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

  async updateBrand(
    request: FastifyRequest<UpdateBrandRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const validatedData = updateBrandSchema.parse(request.body);
      const brand = await brandService.updateBrand(
        request.params.id,
        validatedData,
      );
      reply.send({
        success: true,
        message: "Marca actualizada exitosamente",
        data: { brand },
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

  async deleteBrand(
    request: FastifyRequest<BrandByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await brandService.deleteBrand(request.params.id);
      reply.send({
        success: true,
        message: "Marca eliminada exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async exportBrands(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const buffer = await brandService.exportBrands();

      const timestamp = new Date().toISOString().split("T")[0];
      reply.header(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      reply.header(
        "Content-Disposition",
        `attachment; filename="marcas-${timestamp}.xlsx"`,
      );
      reply.header("Content-Length", buffer.length);

      reply.send(buffer);
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }
}

export const brandController = new BrandController();

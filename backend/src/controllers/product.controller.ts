import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
import { productService } from "../services/product.service";

interface GetProductsRoute extends RouteGenericInterface {
  Querystring: Record<string, any>;
}

interface GetProductByIdRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface CreateProductRoute extends RouteGenericInterface {
  Body: any;
}

interface UpdateProductRoute extends RouteGenericInterface {
  Params: { id: string };
  Body: any;
}

interface DeleteProductRoute extends RouteGenericInterface {
  Params: { id: string };
}

interface GenerateSKURoute extends RouteGenericInterface {}

export class ProductController {
  async getProducts(
    request: FastifyRequest<GetProductsRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const result = await productService.getProducts(request.query);
      reply.send({
        success: true,
        message: "Productos obtenidos exitosamente",
        data: result,
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async getProductById(
    request: FastifyRequest<GetProductByIdRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const product = await productService.getProductById(request.params.id);
      reply.send({
        success: true,
        message: "Producto obtenido exitosamente",
        data: { product },
      });
    } catch (error: any) {
      reply.status(404).send({ success: false, message: error.message });
    }
  }

  async createProduct(
    request: FastifyRequest<CreateProductRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const product = await productService.createProduct(request.body);
      reply.status(201).send({
        success: true,
        message: "Producto creado exitosamente",
        data: { product },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async updateProduct(
    request: FastifyRequest<UpdateProductRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const product = await productService.updateProduct(
        request.params.id,
        request.body,
      );
      reply.send({
        success: true,
        message: "Producto actualizado exitosamente",
        data: { product },
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async deleteProduct(
    request: FastifyRequest<DeleteProductRoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      await productService.deleteProduct(request.params.id);
      reply.send({
        success: true,
        message: "Producto eliminado exitosamente",
      });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async getLowStockProducts(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const products = await productService.getLowStockProducts();
      reply.send({
        success: true,
        message: "Productos con stock bajo obtenidos exitosamente",
        data: { products },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }

  async generateSKU(
    request: FastifyRequest<GenerateSKURoute>,
    reply: FastifyReply,
  ): Promise<void> {
    try {
      const sku = await productService.generateSKU();
      reply.send({
        success: true,
        message: "SKU generado exitosamente",
        data: { sku },
      });
    } catch (error: any) {
      reply.status(500).send({ success: false, message: error.message });
    }
  }
}

export const productController = new ProductController();

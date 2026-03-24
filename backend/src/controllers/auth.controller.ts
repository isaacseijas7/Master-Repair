import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/auth.service';

export class AuthController {
  async login(request: FastifyRequest<{ Body: any }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await authService.login(request.body);
      reply.send({ success: true, message: 'Inicio de sesión exitoso', data: result });
    } catch (error: any) {
      reply.status(401).send({ success: false, message: error.message });
    }
  }

  async register(request: FastifyRequest<{ Body: any }>, reply: FastifyReply): Promise<void> {
    try {
      const result = await authService.register(request.body);
      reply.status(201).send({ success: true, message: 'Usuario registrado exitosamente', data: result });
    } catch (error: any) {
      reply.status(400).send({ success: false, message: error.message });
    }
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) throw new Error('No autenticado');
      const user = await authService.getCurrentUser(request.user.userId);
      reply.send({ success: true, message: 'Perfil obtenido exitosamente', data: { user } });
    } catch (error: any) {
      reply.status(401).send({ success: false, message: error.message });
    }
  }
}

export const authController = new AuthController();

// backend/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { TokenPayload } from '../types/fastify';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ success: false, message: 'Token de autenticación no proporcionado' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verificar el token usando jsonwebtoken
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      reply.status(401).send({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (!user.isActive) {
      reply.status(403).send({ success: false, message: 'Usuario desactivado' });
      return;
    }

    // Asignar a request.user (que ahora tiene el tipo correcto de @fastify/jwt)
    request.user = decoded;
  } catch (error) {
    reply.status(401).send({ success: false, message: 'Token inválido o expirado' });
  }
};

export const authorize = (...roles: string[]) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    // Ahora request.user tiene el tipo correcto { userId, email, role }
    if (!request.user) {
      reply.status(401).send({ success: false, message: 'No autenticado' });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.status(403).send({ success: false, message: 'No tiene permisos para realizar esta acción' });
    }
  };
};
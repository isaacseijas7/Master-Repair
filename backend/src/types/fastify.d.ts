import { FastifyRequest } from "fastify";
import { JWT } from "@fastify/jwt";

// Extiende el tipo User de @fastify/jwt en lugar de crear uno nuevo
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role: string;
    };
    user: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

// Opcional: Si necesitas acceder a user desde FastifyRequest directamente
declare module "fastify" {
  interface FastifyRequest {
    jwt: JWT;
    // user ya viene de @fastify/jwt, no necesitas declararlo aquí
  }
}

// Exportar la interfaz para usarla en casts
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
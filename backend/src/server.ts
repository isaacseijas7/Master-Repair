import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import { registerRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { authService } from './services/auth.service';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = Fastify({
  logger: {
    level: NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

async function registerPlugins(): Promise<void> {
  await app.register(cors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(jwt, { secret: JWT_SECRET });
}

async function setupRoutes(): Promise<void> {
  await app.register(registerRoutes);
  app.setNotFoundHandler(notFoundHandler);
  app.setErrorHandler(errorHandler);
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    await registerPlugins();
    await setupRoutes();
    await authService.createInitialAdmin();

    await app.listen({ port: PORT, host: '0.0.0.0' });

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                    MÁSTER REPAIR API                       ║
╠════════════════════════════════════════════════════════════╣
║  🚀 Servidor corriendo en: http://localhost:${PORT}          ║
║  🔑 Auth: POST http://localhost:${PORT}/api/v1/auth/login    ║
╚════════════════════════════════════════════════════════════╝
    `);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await app.close();
  process.exit(0);
});

start();

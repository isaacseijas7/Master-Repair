import { FastifyRequest, FastifyReply, FastifyError } from 'fastify';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply): void => {
  let statusCode = 500;
  let message = 'Error interno del servidor';

  if ((error as any).code === 11000) {
    statusCode = 409;
    message = 'El recurso ya existe';
  } else if ((error as any).name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
  } else if ((error as any).name === 'CastError') {
    statusCode = 400;
    message = `ID inválido`;
  } else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  console.error('Error:', error);

  reply.status(statusCode).send({
    success: false,
    message,
  });
};

export const notFoundHandler = (request: FastifyRequest, reply: FastifyReply): void => {
  reply.status(404).send({
    success: false,
    message: `Ruta no encontrada: ${request.method} ${request.url}`,
  });
};

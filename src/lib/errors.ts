export class AppError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError { constructor(message = 'Recurso no encontrado') { super(message, 'NOT_FOUND', 404); } }
export class ValidationError extends AppError { constructor(message = 'Datos inválidos') { super(message, 'VALIDATION_ERROR', 400); } }
export class UnauthorizedError extends AppError { constructor(message = 'No autorizado') { super(message, 'UNAUTHORIZED', 401); } }
export class ForbiddenError extends AppError { constructor(message = 'Acceso denegado') { super(message, 'FORBIDDEN', 403); } }

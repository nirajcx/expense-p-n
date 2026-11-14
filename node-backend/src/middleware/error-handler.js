import { ApiError } from '../utils/api-error.js';

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
}

export function errorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  const known = error instanceof ApiError;
  if (!known) console.error('Unhandled request error');
  return res.status(known ? error.statusCode : 500).json({
    error: {
      code: known ? error.code : 'INTERNAL_ERROR',
      message: known ? error.message : 'An unexpected error occurred',
      ...(known && error.details ? { details: error.details } : {}),
    },
  });
}

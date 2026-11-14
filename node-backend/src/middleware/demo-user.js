import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

// Temporary local demo identity, never sourced from client headers/query/body.
// Replace this middleware with verified server-side session authentication.
export function demoUser(req, _res, next) {
  if (env.NODE_ENV !== 'development' || !env.DEMO_USER_ID) {
    return next(new ApiError(401, 'AUTH_REQUIRED', 'Session authentication is not implemented yet'));
  }
  req.user = { id: env.DEMO_USER_ID };
  return next();
}

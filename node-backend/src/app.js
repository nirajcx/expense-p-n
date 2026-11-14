import express from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { expenseRouter } from './modules/expenses/expense.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

export const app = express();
app.disable('x-powered-by');
app.use('/health', healthRouter);
app.use('/api/v1/expenses', expenseRouter);
app.use(notFound);
app.use(errorHandler);

import express from 'express';
import { healthRouter } from './routes/health.routes.js';
import { expenseRouter } from './routes/expense.routes.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';

export const app = express();
app.disable('x-powered-by');
app.use('/health', healthRouter);
app.use('/api/v1/expenses', expenseRouter);
app.use(notFound);
app.use(errorHandler);

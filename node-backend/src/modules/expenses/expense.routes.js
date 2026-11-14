import { Router } from 'express';
import { demoUser } from '../../middleware/demo-user.js';
import { getExpenses } from './expense.controller.js';

export const expenseRouter = Router();
expenseRouter.get('/', demoUser, getExpenses);

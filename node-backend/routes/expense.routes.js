import { Router } from 'express';
import { demoUser } from '../middlewares/demo-user.js';
import { getExpenses } from '../controllers/expense.controller.js';

export const expenseRouter = Router();
expenseRouter.get('/', demoUser, getExpenses);

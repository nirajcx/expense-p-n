import { desc, eq } from 'drizzle-orm';
import { db } from '../database/client.js';
import { expenses } from '../models/expense.model.js';

export async function findExpensesByUserId(userId, { page, limit }) {
  return db.select({
    id: expenses.id,
    amount: expenses.amount,
    currency: expenses.currency,
    category: expenses.category,
    reason: expenses.reason,
    spentFor: expenses.spentFor,
    paymentMethod: expenses.paymentMethod,
    expenseDate: expenses.expenseDate,
    createdAt: expenses.createdAt,
    updatedAt: expenses.updatedAt,
  }).from(expenses)
    .where(eq(expenses.userId, userId))
    .orderBy(desc(expenses.expenseDate), desc(expenses.id))
    .limit(limit + 1)
    .offset((page - 1) * limit);
}

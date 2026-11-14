import { findExpensesByUserId } from './expense.repository.js';

export async function listExpenses(userId, pagination) {
  const rows = await findExpensesByUserId(userId, pagination);
  return {
    data: rows.slice(0, pagination.limit),
    meta: { ...pagination, hasMore: rows.length > pagination.limit },
  };
}

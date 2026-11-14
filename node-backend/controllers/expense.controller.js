import { listExpensesSchema } from '../schemas/expense.schema.js';
import { listExpenses } from '../services/expense.service.js';
import { ApiError } from '../utils/api-error.js';
import { sendData } from '../utils/api-response.js';

export async function getExpenses(req, res) {
  const parsed = listExpensesSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid query parameters',
      parsed.error.issues.map(({ path, message }) => ({ field: path.join('.'), message })));
  }
  const result = await listExpenses(req.user.id, parsed.data);
  return sendData(res, result.data, result.meta);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { listExpensesSchema } from '../src/modules/expenses/expense.schema.js';

test('pagination has bounded defaults and accepts integer query strings', () => {
  assert.deepEqual(listExpensesSchema.parse({}), { page: 1, limit: 20 });
  assert.deepEqual(listExpensesSchema.parse({ page: '2', limit: '10' }), { page: 2, limit: 10 });
});

test('rejects invalid pagination and client-supplied ownership', () => {
  for (const query of [
    { page: '0' }, { page: '1.5' }, { limit: '101' }, { limit: '' },
    { page: ['1', '2'] }, { userId: 'another-user' }, { page: '10001' },
  ]) assert.equal(listExpensesSchema.safeParse(query).success, false);
});

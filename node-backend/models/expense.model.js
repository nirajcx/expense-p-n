import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, numeric, date, check, index } from 'drizzle-orm/pg-core';
import { timestamps } from '../database/columns.js';
import { users } from './user.model.js';

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR').notNull(),
  category: varchar('category', { length: 80 }).notNull(),
  reason: varchar('reason', { length: 500 }).notNull(),
  spentFor: varchar('spent_for', { length: 100 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  expenseDate: date('expense_date', { mode: 'string' }).notNull(),
  ...timestamps(),
}, (table) => [
  check('expenses_amount_positive', sql`${table.amount} > 0`),
  check('expenses_currency_format', sql`${table.currency} ~ '^[A-Z]{3}$'`),
  check('expenses_payment_method_valid', sql`${table.paymentMethod} in ('cash', 'upi', 'card', 'bank_transfer', 'other')`),
  index('expenses_user_date_idx').on(table.userId, table.expenseDate, table.id),
]);

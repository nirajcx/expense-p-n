import { timestamp } from 'drizzle-orm/pg-core';

// Return fresh column builders for each table. Updates are maintained by DB triggers.
export const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});


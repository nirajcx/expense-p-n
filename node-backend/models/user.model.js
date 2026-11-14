import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, check } from 'drizzle-orm/pg-core';
import { timestamps } from '../database/columns.js';

// Minimal owner model. Passwords, roles and sessions belong to the auth milestone.
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  ...timestamps(),
}, (table) => [check('users_email_normalized', sql`${table.email} = lower(trim(${table.email}))`)]);


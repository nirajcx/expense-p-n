import { db } from '../src/db/client.js';
import { pool } from '../src/db/pool.js';
import { users, expenses } from '../src/db/schema.js';
import { env } from '../src/config/env.js';

try {
  if (env.NODE_ENV !== 'development' || !env.DEMO_USER_ID) {
    throw new Error('Seed requires development mode and DEMO_USER_ID');
  }
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: env.DEMO_USER_ID, email: 'demo@example.test', displayName: 'Demo User',
    }).onConflictDoNothing();
    await tx.insert(expenses).values({
      id: '22222222-2222-4222-8222-222222222222', userId: env.DEMO_USER_ID,
      amount: '250.00', currency: 'INR', category: 'food', reason: 'Practice lunch expense',
      spentFor: 'Self', paymentMethod: 'upi', expenseDate: '2026-11-14',
    }).onConflictDoNothing();
  });
  console.log('Demo seed ready (safe to rerun)');
} catch {
  console.error('Seed failed. Use development mode, configure DEMO_USER_ID and run migrations first.');
  process.exitCode = 1;
} finally {
  await pool.end();
}

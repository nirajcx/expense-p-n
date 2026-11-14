import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../src/db/client.js';
import { pool } from '../src/db/pool.js';

try {
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Drizzle migrations complete');
} catch {
  console.error('Migration failed. Check database connectivity and migration SQL.');
  process.exitCode = 1;
} finally {
  await pool.end();
}

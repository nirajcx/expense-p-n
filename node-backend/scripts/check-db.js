import { pool, checkDatabase } from '../src/db/pool.js';

try {
  await checkDatabase();
  console.log('PostgreSQL connection OK');
} catch {
  console.error('PostgreSQL connection failed. Check DATABASE_URL and the container.');
  process.exitCode = 1;
} finally {
  await pool.end();
}

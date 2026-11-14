import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 5_000,
});
pool.on('error', () => console.error('Unexpected idle database connection error'));

export async function checkDatabase() {
  await pool.query('SELECT 1');
}

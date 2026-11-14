import { defineConfig } from 'drizzle-kit';
import { env } from './config/env.js';

export default defineConfig({
  dialect: 'postgresql',
  schema: './database/schema.js',
  out: './migrations',
  dbCredentials: { url: env.DATABASE_URL },
});

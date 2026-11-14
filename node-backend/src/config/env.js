import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEMO_USER_ID: z.string().uuid().optional(),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().url().refine((value) => /^postgres(ql)?:\/\//.test(value)),
});
const result = schema.safeParse(process.env);
if (!result.success) {
  // Do not print environment values: they can contain passwords.
  throw new Error(`Invalid environment fields: ${result.error.issues.map((i) => i.path.join('.')).join(', ')}`);
}
export const env = result.data;

import { Router } from 'express';
import { checkDatabase } from '../database/pool.js';

export const healthRouter = Router();
healthRouter.get('/live', (_req, res) => res.json({ status: 'ok' }));
async function readiness(_req, res) {
  try {
    await checkDatabase();
    return res.json({ status: 'ready' });
  } catch {
    return res.status(503).json({ status: 'unavailable' });
  }
}
healthRouter.get('/', readiness);
healthRouter.get('/ready', readiness);

import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';

// Opt-in: inserts unique fixtures and deletes only those fixtures in finally.
test('expense API ownership, pagination, errors and DB constraints', {
  skip: process.env.RUN_DB_TESTS !== '1',
}, async () => {
  const ownerId = randomUUID();
  const otherId = randomUUID();
  process.env.NODE_ENV = 'development';
  process.env.DEMO_USER_ID = ownerId;
  const { app } = await import('../app.js');
  const { pool } = await import('../database/pool.js');
  const { env } = await import('../config/env.js');
  let server;
  try {
    await pool.query('INSERT INTO users (id, email, display_name) VALUES ($1, $2, $3), ($4, $5, $3)',
      [ownerId, `${ownerId}@example.test`, 'Test fixture', otherId, `${otherId}@example.test`]);
    for (const [id, amount, day] of [[ownerId, '10.25', '2026-01-02'], [ownerId, '20.00', '2026-01-01'], [otherId, '999.00', '2026-01-03']]) {
      await pool.query(`INSERT INTO expenses (user_id, amount, category, reason, spent_for, payment_method, expense_date)
        VALUES ($1, $2, 'food', 'Test fixture', 'Self', 'cash', $3)`, [id, amount, day]);
    }
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const get = async (path) => {
      const response = await fetch(`${base}${path}`);
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await get('/health')).status, 200);
    const first = await get('/api/v1/expenses?limit=1');
    assert.equal(first.status, 200);
    assert.equal(first.body.data[0].amount, '10.25');
    assert.equal(first.body.meta.hasMore, true);
    const second = await get('/api/v1/expenses?limit=1&page=2');
    assert.equal(second.body.data[0].amount, '20.00');
    assert.equal(second.body.meta.hasMore, false);
    assert.deepEqual((await get('/api/v1/expenses?page=3&limit=1')).body.data, []);
    assert.equal((await get(`/api/v1/expenses?userId=${otherId}`)).status, 400);
    assert.equal((await get('/api/v1/expenses?limit=101')).status, 400);
    assert.equal((await get('/missing')).status, 404);
    env.NODE_ENV = 'production';
    assert.equal((await get('/api/v1/expenses')).status, 401);
    env.NODE_ENV = 'development';
    await assert.rejects(pool.query('UPDATE expenses SET amount = -1 WHERE user_id = $1', [ownerId]), { code: '23514' });
    await assert.rejects(pool.query("UPDATE expenses SET payment_method = 'invalid' WHERE user_id = $1", [ownerId]), { code: '23514' });
    const before = await pool.query('SELECT id, created_at, updated_at FROM expenses WHERE user_id = $1 LIMIT 1', [ownerId]);
    const updated = await pool.query("UPDATE expenses SET reason = 'Updated fixture' WHERE id = $1 RETURNING created_at, updated_at", [before.rows[0].id]);
    assert.deepEqual(updated.rows[0].created_at, before.rows[0].created_at);
    assert.ok(updated.rows[0].updated_at > before.rows[0].updated_at);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    try {
      await pool.query('DELETE FROM expenses WHERE user_id = ANY($1::uuid[])', [[ownerId, otherId]]);
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [[ownerId, otherId]]);
    } finally { await pool.end(); }
  }
});

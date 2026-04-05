import pool from '../db/index.js';

/**
 * Create a queue token with sequential numbering via transaction.
 */
export async function createToken({
  userId = null,
  tempUserId = null,
  locationId,
  serviceId,
  priority = 'normal',
  category = 'regular',
  specialty = null,
  hospitalId = null,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Ensure token_counters row exists
    await client.query(
      `INSERT INTO token_counters (location_id, service_id, last_number)
       VALUES ($1, $2, 0) ON CONFLICT (location_id, service_id) DO NOTHING`,
      [locationId, serviceId]
    );

    // Lock the counter row for update
    const rc = await client.query(
      `SELECT last_number FROM token_counters
       WHERE location_id = $1 AND service_id = $2 FOR UPDATE`,
      [locationId, serviceId]
    );

    let last = 0;
    if (rc.rowCount) last = Number(rc.rows[0].last_number);
    const nextNumber = last + 1;

    await client.query(
      `UPDATE token_counters SET last_number = $1, updated_at = now()
       WHERE location_id = $2 AND service_id = $3`,
      [nextNumber, locationId, serviceId]
    );

    const insert = await client.query(
      `INSERT INTO tokens (user_id, temp_user_id, location_id, service_id, hospital_id, token_number, priority, category, specialty, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'waiting', now(), now())
       RETURNING *`,
      [userId, tempUserId, locationId, serviceId, hospitalId, nextNumber, priority, category, specialty]
    );

    // Compute estimated wait time
    const waitingRes = await client.query(
      `SELECT COUNT(*)::int as waiting_count FROM tokens
       WHERE location_id = $1 AND service_id = $2 AND status = 'waiting'`,
      [locationId, serviceId]
    );
    const waitingCount = waitingRes.rows[0].waiting_count;

    const avgRes = await client.query(
      'SELECT avg_service_time_seconds FROM services WHERE id = $1',
      [serviceId]
    );
    const avgService = avgRes.rowCount ? Number(avgRes.rows[0].avg_service_time_seconds || 300) : 300;

    const countersRes = await client.query(
      `SELECT COUNT(*)::int as active FROM counters
       WHERE location_id = $1 AND status = 'open'`,
      [locationId]
    );
    const activeCounters = Math.max(1, countersRes.rows[0].active || 1);

    const estimated = Math.ceil((waitingCount * avgService) / activeCounters);

    await client.query(
      'UPDATE tokens SET estimated_wait_seconds = $1 WHERE id = $2',
      [estimated, insert.rows[0].id]
    );

    await client.query('COMMIT');

    return { token: { ...insert.rows[0], estimated_wait_seconds: estimated }, estimated_wait_seconds: estimated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Call next token for a counter using FOR UPDATE SKIP LOCKED.
 */
export async function callNextToken({ counterId, locationId, serviceId }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify counter is open
    const counterRes = await client.query(
      'SELECT id, status FROM counters WHERE id = $1 AND location_id = $2 FOR UPDATE',
      [counterId, locationId]
    );

    if (counterRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return { error: 'Counter not found' };
    }

    if (counterRes.rows[0].status !== 'open') {
      await client.query('ROLLBACK');
      return { error: 'Counter is not open' };
    }

    // Select next token: high priority first, then by token_number
    const nextRes = await client.query(
      `SELECT id FROM tokens
       WHERE location_id = $1 AND service_id = $2 AND status = 'waiting'
       ORDER BY (priority = 'high') DESC, token_number ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1`,
      [locationId, serviceId]
    );

    if (nextRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return { token: null };
    }

    const tokenId = nextRes.rows[0].id;

    await client.query(
      `UPDATE tokens SET status = 'serving', assigned_counter_id = $1, updated_at = now()
       WHERE id = $2`,
      [counterId, tokenId]
    );

    await client.query(
      'UPDATE counters SET current_token_id = $1 WHERE id = $2',
      [tokenId, counterId]
    );

    const tokenRow = await client.query('SELECT * FROM tokens WHERE id = $1', [tokenId]);

    await client.query('COMMIT');

    return { token: tokenRow.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

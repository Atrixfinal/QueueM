import pool, { db } from '../db/index.js';
import crypto from 'crypto';

/**
 * Create a queue token with sequential numbering (SQLite version).
 * Uses a transaction for atomicity.
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
  // Use SQLite transaction for atomicity
  const txn = db.transaction(() => {
    // Ensure token_counters row exists
    db.prepare(
      `INSERT OR IGNORE INTO token_counters (id, location_id, service_id, last_number)
       VALUES (?, ?, ?, 0)`
    ).run(crypto.randomUUID(), locationId, serviceId);

    // Get and increment counter
    const counter = db.prepare(
      `SELECT last_number FROM token_counters WHERE location_id = ? AND service_id = ?`
    ).get(locationId, serviceId);

    const nextNumber = (counter?.last_number || 0) + 1;

    db.prepare(
      `UPDATE token_counters SET last_number = ?, updated_at = datetime('now')
       WHERE location_id = ? AND service_id = ?`
    ).run(nextNumber, locationId, serviceId);

    // Insert the token
    const tokenId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO tokens (id, user_id, temp_user_id, location_id, service_id, hospital_id, token_number, priority, category, specialty, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting', datetime('now'), datetime('now'))`
    ).run(tokenId, userId, tempUserId, locationId, serviceId, hospitalId, nextNumber, priority, category, specialty);

    // Count waiting tokens
    const waitingRow = db.prepare(
      `SELECT COUNT(*) as waiting_count FROM tokens
       WHERE location_id = ? AND service_id = ? AND status = 'waiting'`
    ).get(locationId, serviceId);
    const waitingCount = waitingRow.waiting_count;

    // Get avg service time
    const serviceRow = db.prepare(
      'SELECT avg_service_time_seconds FROM services WHERE id = ?'
    ).get(serviceId);
    const avgService = serviceRow ? (serviceRow.avg_service_time_seconds || 300) : 300;

    // Count active counters
    const counterRow = db.prepare(
      `SELECT COUNT(*) as active FROM counters WHERE location_id = ? AND status = 'open'`
    ).get(locationId);
    const activeCounters = Math.max(1, counterRow?.active || 1);

    const estimated = Math.ceil((waitingCount * avgService) / activeCounters);

    // Update estimated wait time
    db.prepare(
      'UPDATE tokens SET estimated_wait_seconds = ? WHERE id = ?'
    ).run(estimated, tokenId);

    // Return the token
    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(tokenId);

    return { token: { ...token, estimated_wait_seconds: estimated }, estimated_wait_seconds: estimated };
  });

  return txn();
}

/**
 * Call next token for a counter.
 */
export async function callNextToken({ counterId, locationId, serviceId }) {
  const txn = db.transaction(() => {
    // Verify counter is open
    const counter = db.prepare(
      'SELECT id, status FROM counters WHERE id = ? AND location_id = ?'
    ).get(counterId, locationId);

    if (!counter) return { error: 'Counter not found' };
    if (counter.status !== 'open') return { error: 'Counter is not open' };

    // Select next waiting token (high priority first, then by token_number)
    const nextToken = db.prepare(
      `SELECT id FROM tokens
       WHERE location_id = ? AND service_id = ? AND status = 'waiting'
       ORDER BY (CASE WHEN priority = 'high' THEN 0 ELSE 1 END), token_number ASC
       LIMIT 1`
    ).get(locationId, serviceId);

    if (!nextToken) return { token: null };

    // Update token status
    db.prepare(
      `UPDATE tokens SET status = 'serving', assigned_counter_id = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(counterId, nextToken.id);

    // Update counter
    db.prepare(
      'UPDATE counters SET current_token_id = ? WHERE id = ?'
    ).run(nextToken.id, counterId);

    const token = db.prepare('SELECT * FROM tokens WHERE id = ?').get(nextToken.id);

    return { token };
  });

  return txn();
}

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'queuem.db');

// Create the SQLite database (file is auto-created if it doesn't exist)
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`[DB] SQLite database connected at: ${DB_PATH}`);

// ──────────────────────────────────────────────
// PostgreSQL-compatible wrapper
// Converts $1,$2,$3 params to ? params
// Returns { rows: [...], rowCount: N }
// ──────────────────────────────────────────────
function convertPgParams(sql, params) {
  if (!params || params.length === 0) return { sql, params: [] };

  let converted = sql;
  // Replace $1, $2, ... with ? (in reverse order to avoid $10 → ?0 issues)
  for (let i = params.length; i >= 1; i--) {
    converted = converted.replace(new RegExp(`\\$${i}`, 'g'), '?');
  }
  return { sql: converted, params };
}

// UUID generator (replaces PostgreSQL's gen_random_uuid())
function genUUID() {
  return crypto.randomUUID();
}

// Pool-compatible query interface
const pool = {
  query: async (sql, params = []) => {
    const { sql: convertedSql, params: convertedParams } = convertPgParams(sql, params);

    // Replace gen_random_uuid() with a generated UUID
    let finalSql = convertedSql.replace(/gen_random_uuid\(\)/gi, `'${genUUID()}'`);

    // Replace now() with SQLite datetime
    finalSql = finalSql.replace(/now\(\)/gi, "datetime('now')");

    // Replace TIMESTAMPTZ with TEXT (for CREATE TABLE)
    finalSql = finalSql.replace(/TIMESTAMPTZ/gi, 'TEXT');

    // Replace "now() + INTERVAL '24 hours'" with SQLite equivalent
    finalSql = finalSql.replace(
      /datetime\('now'\)\s*\+\s*INTERVAL\s*'24 hours'/gi,
      "datetime('now', '+24 hours')"
    );

    // Determine if this is a read or write query
    const trimmed = finalSql.trim().toUpperCase();
    const isSelect = trimmed.startsWith('SELECT');
    const hasReturning = /RETURNING/i.test(finalSql);

    try {
      if (isSelect || hasReturning) {
        const stmt = db.prepare(finalSql);
        const rows = stmt.all(...convertedParams);
        return { rows, rowCount: rows.length };
      } else {
        const stmt = db.prepare(finalSql);
        const result = stmt.run(...convertedParams);
        return { rows: [], rowCount: result.changes };
      }
    } catch (err) {
      // Add context to errors
      err.query = finalSql;
      err.params = convertedParams;
      throw err;
    }
  },

  // For transaction support (used by tokenService)
  connect: async () => {
    return {
      query: async (sql, params = []) => pool.query(sql, params),
      release: () => {},  // No-op for SQLite
    };
  },
};

// ──────────────────────────────────────────────
// Auto-create tables on startup
// ──────────────────────────────────────────────
function initializeDatabase() {
  db.exec(`
    -- USERS (fully registered accounts)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT ('u-' || lower(hex(randomblob(8)))),
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'staff')),
      sex TEXT CHECK (sex IN ('male', 'female', 'other')),
      blood_group TEXT,
      medical_conditions TEXT,
      allergies TEXT,
      location_home TEXT,
      location_current TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- TEMP USERS (guest / emergency - phone only)
    CREATE TABLE IF NOT EXISTS temp_users (
      id TEXT PRIMARY KEY DEFAULT ('t-' || lower(hex(randomblob(8)))),
      phone TEXT UNIQUE NOT NULL,
      location_current TEXT,
      otp_code TEXT DEFAULT '123456',
      otp_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT DEFAULT (datetime('now', '+24 hours'))
    );

    -- HOSPITALS
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      type TEXT DEFAULT 'hospital',
      api_endpoint TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- LOCATIONS (service locations within hospitals)
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT,
      type TEXT CHECK (type IN ('hospital', 'bank', 'govt')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- SERVICES (departments within a location)
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      avg_service_time_seconds INTEGER NOT NULL DEFAULT 300,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- COUNTERS (service desks at a location)
    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      counter_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
      current_token_id TEXT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- TOKEN COUNTERS (sequential number allocator)
    CREATE TABLE IF NOT EXISTS token_counters (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      location_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      last_number INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (location_id, service_id)
    );

    -- TOKENS (queue tokens issued to users)
    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NULL REFERENCES users(id),
      temp_user_id TEXT NULL REFERENCES temp_users(id),
      location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      hospital_id TEXT REFERENCES hospitals(id),
      token_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'skipped')),
      assigned_counter_id TEXT NULL REFERENCES counters(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
      category TEXT CHECK (category IN ('emergency', 'vip', 'regular')),
      specialty TEXT,
      estimated_wait_seconds INTEGER NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (location_id, service_id, token_number)
    );

    -- INDEXES
    CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens (location_id, service_id, status);
    CREATE INDEX IF NOT EXISTS idx_tokens_priority ON tokens (location_id, service_id, priority);
    CREATE INDEX IF NOT EXISTS idx_counters_location ON counters (location_id, status);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
    CREATE INDEX IF NOT EXISTS idx_temp_users_phone ON temp_users (phone);
    CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals (city);
  `);

  // Seed demo hospitals if table is empty
  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get();
  if (hospitalCount.count === 0) {
    console.log('[DB] Seeding demo hospital data...');
    db.exec(`
      INSERT INTO hospitals (id, name, address, city, type, api_endpoint) VALUES
        ('aaaa1111-1111-1111-1111-111111111111', 'City General Hospital', '123 Main Street, New Delhi', 'New Delhi', 'hospital', 'api.citygen.demo'),
        ('bbbb2222-2222-2222-2222-222222222222', 'Metro Heart Institute', '456 Health Avenue, Mumbai', 'Mumbai', 'hospital', 'api.metroheart.demo'),
        ('cccc3333-3333-3333-3333-333333333333', 'Apollo Medical Center', '789 Care Boulevard, Bangalore', 'Bangalore', 'hospital', 'api.apollomed.demo');

      INSERT INTO locations (id, hospital_id, name, address, type) VALUES
        ('1aaa0000-0000-0000-0000-000000000001', 'aaaa1111-1111-1111-1111-111111111111', 'City General - Main', '123 Main Street, New Delhi', 'hospital'),
        ('2bbb0000-0000-0000-0000-000000000002', 'bbbb2222-2222-2222-2222-222222222222', 'Metro Heart - Main', '456 Health Avenue, Mumbai', 'hospital'),
        ('3ccc0000-0000-0000-0000-000000000003', 'cccc3333-3333-3333-3333-333333333333', 'Apollo Medical - Main', '789 Care Boulevard, Bangalore', 'hospital');

      INSERT INTO services (id, location_id, name, avg_service_time_seconds) VALUES
        ('a100a100-a100-a100-a100-a100a100a100', '1aaa0000-0000-0000-0000-000000000001', 'General Medicine', 300),
        ('a200a200-a200-a200-a200-a200a200a200', '1aaa0000-0000-0000-0000-000000000001', 'Cardiology', 600),
        ('a300a300-a300-a300-a300-a300a300a300', '1aaa0000-0000-0000-0000-000000000001', 'Orthopedics', 450),
        ('b100b100-b100-b100-b100-b100b100b100', '2bbb0000-0000-0000-0000-000000000002', 'General Medicine', 300),
        ('b200b200-b200-b200-b200-b200b200b200', '2bbb0000-0000-0000-0000-000000000002', 'Cardiology', 600),
        ('c100c100-c100-c100-c100-c100c100c100', '3ccc0000-0000-0000-0000-000000000003', 'General Medicine', 300),
        ('c200c200-c200-c200-c200-c200c200c200', '3ccc0000-0000-0000-0000-000000000003', 'Neurology', 500);

      INSERT INTO counters (location_id, counter_number, status) VALUES
        ('1aaa0000-0000-0000-0000-000000000001', 1, 'open'),
        ('1aaa0000-0000-0000-0000-000000000001', 2, 'open'),
        ('2bbb0000-0000-0000-0000-000000000002', 1, 'open'),
        ('3ccc0000-0000-0000-0000-000000000003', 1, 'open');
    `);
    console.log('[DB] Demo data seeded successfully');
  }

  console.log('[DB] Database initialized — all tables ready');
}

// Run on import
initializeDatabase();

// Export both the raw db and the pg-compatible pool
export { db };
export default pool;

-- 001_create_tables.sql
-- QueueM Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS (fully registered accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TEMP USERS (guest / emergency - phone only)
-- ============================================
CREATE TABLE IF NOT EXISTS temp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  location_current TEXT,
  otp_code TEXT DEFAULT '123456',
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);

-- ============================================
-- HOSPITALS (demo + future real integration)
-- ============================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  type TEXT DEFAULT 'hospital',
  api_endpoint TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- LOCATIONS (service locations within hospitals)
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  type TEXT CHECK (type IN ('hospital', 'bank', 'govt')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SERVICES (departments within a location)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avg_service_time_seconds INT NOT NULL DEFAULT 300,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COUNTERS (service desks at a location)
-- ============================================
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  counter_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  current_token_id UUID NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TOKEN COUNTERS (sequential number allocator)
-- ============================================
CREATE TABLE IF NOT EXISTS token_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL,
  service_id UUID NOT NULL,
  last_number BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (location_id, service_id)
);

-- ============================================
-- TOKENS (queue tokens issued to users)
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES users(id),
  temp_user_id UUID NULL REFERENCES temp_users(id),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(id),
  token_number BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'skipped')),
  assigned_counter_id UUID NULL REFERENCES counters(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  category TEXT CHECK (category IN ('emergency', 'vip', 'regular')),
  specialty TEXT,
  estimated_wait_seconds INT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (location_id, service_id, token_number)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens (location_id, service_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_priority ON tokens (location_id, service_id, priority);
CREATE INDEX IF NOT EXISTS idx_counters_location ON counters (location_id, status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_temp_users_phone ON temp_users (phone);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals (city);

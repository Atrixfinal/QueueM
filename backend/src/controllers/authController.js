import pool from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'queuem-fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

// ─── REGISTER (full account) ────────────────────────────────
export const register = async (req, res) => {
  const { name, phone, password, sex, blood_group, medical_conditions, allergies, location_home } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Name, phone, and password are required' });
  }

  try {
    // Remove from temp_users if exists
    await pool.query('DELETE FROM temp_users WHERE phone = ?', [phone]);

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const id = crypto.randomUUID();

    await pool.query(
      `INSERT INTO users (id, name, phone, password_hash, sex, blood_group, medical_conditions, allergies, location_home, location_current)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, phone, hashed, sex || null, blood_group || null, medical_conditions || null, allergies || null, location_home || null, location_home || null]
    );

    const user = {
      id, name, phone, role: 'user',
      sex: sex || null, blood_group: blood_group || null,
      location_home: location_home || null, location_current: location_home || null,
    };

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed') || err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ message: 'Phone number already registered' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

// ─── LOGIN (phone + password) ───────────────────────────────
export const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, phone, password_hash, role, sex, blood_group, location_home, location_current FROM users WHERE phone = ?',
      [phone]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const { password_hash, ...safeUser } = user;
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

// ─── GUEST OTP (emergency / quick queue) ────────────────────
export const guestOTP = async (req, res) => {
  const { phone, location_current } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    // Check if already a registered user
    const existing = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: 'Phone already registered. Please sign in instead.' });
    }

    // Check if temp_user already exists
    const existingTemp = await pool.query('SELECT id FROM temp_users WHERE phone = ?', [phone]);

    if (existingTemp.rowCount > 0) {
      // Update existing
      await pool.query(
        `UPDATE temp_users SET otp_code = '123456', otp_verified = 0, location_current = ? WHERE phone = ?`,
        [location_current || null, phone]
      );
    } else {
      // Insert new
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO temp_users (id, phone, location_current, otp_code) VALUES (?, ?, ?, '123456')`,
        [id, phone, location_current || null]
      );
    }

    return res.json({ message: 'OTP sent (dev: 123456)' });
  } catch (err) {
    console.error('Guest OTP error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

// ─── VERIFY OTP (guest) ─────────────────────────────────────
export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, phone, location_current FROM temp_users WHERE phone = ? AND otp_code = ?',
      [phone, otp]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    await pool.query('UPDATE temp_users SET otp_verified = 1 WHERE phone = ?', [phone]);

    const tempUser = result.rows[0];
    const token = jwt.sign(
      { id: tempUser.id, role: 'guest', phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      user: { id: tempUser.id, phone, role: 'guest', name: 'Guest', location_current: tempUser.location_current },
      token,
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

// ─── UPDATE LOCATION ────────────────────────────────────────
export const updateLocation = async (req, res) => {
  const { location_current } = req.body;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!location_current) {
    return res.status(400).json({ message: 'location_current is required' });
  }

  try {
    if (userRole === 'guest') {
      await pool.query('UPDATE temp_users SET location_current = ? WHERE id = ?', [location_current, userId]);
    } else {
      await pool.query('UPDATE users SET location_current = ? WHERE id = ?', [location_current, userId]);
    }

    return res.json({ message: 'Location updated', location_current });
  } catch (err) {
    console.error('Update location error:', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};

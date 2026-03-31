
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import generateToken from '../util/token.js';

// ── POST /api/auth/register ──────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email, and password are required' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'Developer';

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, full_name, email, role, created_at`,
      [full_name, email, hashedPassword, userRole]
    );

    const user = rows[0];
    const token = generateToken(user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.user_id);

    res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// ── POST /api/auth/logout ────────────────────────────────────────────
const logout = async (req, res) => {
  // JWT is stateless — client simply discards the token.
  // This endpoint exists for API completeness.
  res.status(200).json({ message: 'Logged out successfully' });
};

// ── GET /api/auth/me ─────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};

export { register, login, logout, me };
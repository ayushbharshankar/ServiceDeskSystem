
import jwt from 'jsonwebtoken';
import config from '../config.js';
import pool from '../db.js';

// ── Protect route — verifies JWT and attaches req.user ────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Accept token from Authorization header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized — no token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT user_id, full_name, email, role FROM users WHERE user_id = $1',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    req.user = rows[0]; // { user_id, full_name, email, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized — token invalid', error: error.message });
  }
};

// ── Role-based access — restricts route to certain roles ──────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden — insufficient permissions' });
    }
    next();
  };
};

export { protect, authorize };
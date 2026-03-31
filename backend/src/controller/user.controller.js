
import bcrypt from 'bcryptjs';
import pool from '../db.js';

// ── GET /api/users — List all users ──────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT user_id, full_name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.status(200).json({ users: rows });
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// ── GET /api/users/:id — Get single user ─────────────────────────────
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// ── PUT /api/users/:id — Update user (admin) ─────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, role, password } = req.body;

    // Build dynamic SET clause
    const fields = [];
    const values = [];
    let idx = 1;

    if (full_name) { fields.push(`full_name = $${idx++}`); values.push(full_name); }
    if (email)     { fields.push(`email = $${idx++}`);     values.push(email); }
    if (role)      { fields.push(`role = $${idx++}`);      values.push(role); }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${idx}
       RETURNING user_id, full_name, email, role, created_at`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated', user: rows[0] });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// ── DELETE /api/users/:id — Remove user (admin) ──────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id, full_name, email',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted', user: rows[0] });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export { getAllUsers, getUserById, updateUser, deleteUser };

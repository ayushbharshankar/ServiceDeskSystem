
import pool from '../db.js';

// ── Helper — create a notification ───────────────────────────────────
export async function createNotification({ userId, type, title, message, link, metadata }) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message || null, link || null, metadata ? JSON.stringify(metadata) : null]
    );
    return rows[0];
  } catch (err) {
    console.error('createNotification error:', err.message);
    return null;
  }
}

// ── Helper — log activity ────────────────────────────────────────────
export async function logActivity({ projectId, userId, action, entityType, entityId, details }) {
  try {
    await pool.query(
      `INSERT INTO activity_log (project_id, user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [projectId, userId, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('logActivity error:', err.message);
  }
}

// ── GET /api/notifications — Get notifications for current user ──────
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 50, offset = 0, unread_only } = req.query;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const values = [userId];
    let idx = 2;

    if (unread_only === 'true') {
      query += ` AND is_read = FALSE`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(parseInt(limit, 10), parseInt(offset, 10));

    const { rows } = await pool.query(query, values);

    // Get unread count
    const countResult = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.status(200).json({
      notifications: rows,
      unread_count: parseInt(countResult.rows[0].count, 10),
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

// ── PATCH /api/notifications/:id/read — Mark as read ─────────────────
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', notification: rows[0] });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
};

// ── PATCH /api/notifications/read-all — Mark all as read ─────────────
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
};

// ── GET /api/notifications/unread-count — Get unread count ───────────
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    res.status(200).json({ unread_count: parseInt(rows[0].count, 10) });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ message: 'Error fetching unread count', error: error.message });
  }
};

export { getNotifications, markAsRead, markAllAsRead, getUnreadCount };

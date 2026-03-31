
import pool from '../db.js';

// ── POST /api/issues — Create issue ─────────────────────────────────
const createIssue = async (req, res) => {
  try {
    const { project_id, title, description, priority, status, assigned_to } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ message: 'project_id and title are required' });
    }

    // Verify project exists
    const project = await pool.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO issues (project_id, title, description, priority, status, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        project_id,
        title,
        description || null,
        priority || 'Medium',
        status || 'To Do',
        assigned_to || null,
        req.user.user_id,
      ]
    );

    res.status(201).json({ message: 'Issue created', issue: rows[0] });
  } catch (error) {
    console.error('createIssue error:', error);
    res.status(500).json({ message: 'Error creating issue', error: error.message });
  }
};

// ── GET /api/issues?project_id=&status=&priority=&assigned_to= ──────
const getAllIssues = async (req, res) => {
  try {
    const { project_id, status, priority, assigned_to } = req.query;

    let query = `
      SELECT i.*, u.full_name AS assigned_name, c.full_name AS creator_name
      FROM issues i
      LEFT JOIN users u ON i.assigned_to = u.user_id
      LEFT JOIN users c ON i.created_by = c.user_id
    `;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (project_id)   { conditions.push(`i.project_id = $${idx++}`);  values.push(project_id); }
    if (status)       { conditions.push(`i.status = $${idx++}`);      values.push(status); }
    if (priority)     { conditions.push(`i.priority = $${idx++}`);    values.push(priority); }
    if (assigned_to)  { conditions.push(`i.assigned_to = $${idx++}`); values.push(assigned_to); }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY i.created_at DESC';

    const { rows } = await pool.query(query, values);
    res.status(200).json({ issues: rows });
  } catch (error) {
    console.error('getAllIssues error:', error);
    res.status(500).json({ message: 'Error fetching issues', error: error.message });
  }
};

// ── GET /api/issues/:id — Get single issue with comments ─────────────
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await pool.query(`
      SELECT i.*, u.full_name AS assigned_name, c.full_name AS creator_name
      FROM issues i
      LEFT JOIN users u ON i.assigned_to = u.user_id
      LEFT JOIN users c ON i.created_by = c.user_id
      WHERE i.issue_id = $1
    `, [id]);

    if (issue.rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Fetch comments
    const comments = await pool.query(`
      SELECT cm.*, u.full_name AS author_name
      FROM comments cm
      LEFT JOIN users u ON cm.user_id = u.user_id
      WHERE cm.issue_id = $1
      ORDER BY cm.created_at ASC
    `, [id]);

    res.status(200).json({
      issue: issue.rows[0],
      comments: comments.rows,
    });
  } catch (error) {
    console.error('getIssueById error:', error);
    res.status(500).json({ message: 'Error fetching issue', error: error.message });
  }
};

// ── PUT /api/issues/:id — Update issue ───────────────────────────────
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, assigned_to } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (title)                  { fields.push(`title = $${idx++}`);       values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (priority)               { fields.push(`priority = $${idx++}`);    values.push(priority); }
    if (status)                 { fields.push(`status = $${idx++}`);      values.push(status); }
    if (assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(assigned_to || null); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE issues SET ${fields.join(', ')} WHERE issue_id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json({ message: 'Issue updated', issue: rows[0] });
  } catch (error) {
    console.error('updateIssue error:', error);
    res.status(500).json({ message: 'Error updating issue', error: error.message });
  }
};

// ── PATCH /api/issues/:id/status — Change issue status only ──────────
const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['To Do', 'In Progress', 'Done'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const { rows } = await pool.query(
      'UPDATE issues SET status = $1 WHERE issue_id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json({ message: 'Issue status updated', issue: rows[0] });
  } catch (error) {
    console.error('updateIssueStatus error:', error);
    res.status(500).json({ message: 'Error updating issue status', error: error.message });
  }
};

// ── DELETE /api/issues/:id — Delete issue ────────────────────────────
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'DELETE FROM issues WHERE issue_id = $1 RETURNING issue_id, title',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json({ message: 'Issue deleted', issue: rows[0] });
  } catch (error) {
    console.error('deleteIssue error:', error);
    res.status(500).json({ message: 'Error deleting issue', error: error.message });
  }
};

// ── GET /api/issues/my-tasks — Issues assigned to current user ───────
const getMyTasks = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, p.project_name
      FROM issues i
      JOIN projects p ON i.project_id = p.project_id
      WHERE i.assigned_to = $1
      ORDER BY
        CASE i.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END,
        i.created_at DESC
    `, [req.user.user_id]);

    res.status(200).json({ tasks: rows });
  } catch (error) {
    console.error('getMyTasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

export {
  createIssue, getAllIssues, getIssueById,
  updateIssue, updateIssueStatus, deleteIssue,
  getMyTasks,
};

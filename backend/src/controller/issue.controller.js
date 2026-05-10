
import pool from '../db.js';
import { createNotification, logActivity } from './notification.controller.js';

// ── POST /api/issues — Create issue ─────────────────────────────────
const createIssue = async (req, res) => {
  try {
    const { project_id, title, description, priority, status, assigned_to } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ message: 'project_id and title are required' });
    }

    // Verify project exists
    const project = await pool.query('SELECT project_id, project_name FROM projects WHERE project_id = $1', [project_id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // If assigned_to is provided, validate they are a project member
    if (assigned_to) {
      const isMember = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [project_id, assigned_to]
      );
      if (isMember.rows.length === 0) {
        return res.status(400).json({ message: 'Assigned user must be a project member' });
      }
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

    const issue = rows[0];

    // Notify the assigned user
    if (assigned_to && assigned_to !== req.user.user_id) {
      await createNotification({
        userId: assigned_to,
        type: 'issue_assigned',
        title: 'Issue assigned to you',
        message: `${req.user.full_name} assigned "${title}" to you in ${project.rows[0].project_name}`,
        link: `/issue/${issue.issue_id}`,
        metadata: { issue_id: issue.issue_id, project_id: parseInt(project_id) },
      });
    }

    await logActivity({
      projectId: parseInt(project_id),
      userId: req.user.user_id,
      action: 'issue_created',
      entityType: 'issue',
      entityId: issue.issue_id,
      details: { title, priority: priority || 'Medium', status: status || 'To Do' },
    });

    res.status(201).json({ message: 'Issue created', issue });
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

    // If changing assigned_to, validate they are a project member
    if (assigned_to !== undefined && assigned_to !== null) {
      const issueCheck = await pool.query('SELECT project_id FROM issues WHERE issue_id = $1', [id]);
      if (issueCheck.rows.length > 0) {
        const isMember = await pool.query(
          'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
          [issueCheck.rows[0].project_id, assigned_to]
        );
        if (isMember.rows.length === 0) {
          return res.status(400).json({ message: 'Assigned user must be a project member' });
        }
      }
    }

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

    // Get old issue for comparison
    const oldIssue = await pool.query('SELECT * FROM issues WHERE issue_id = $1', [id]);

    const { rows } = await pool.query(
      `UPDATE issues SET ${fields.join(', ')} WHERE issue_id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const updatedIssue = rows[0];

    // Notify on assignment change
    if (assigned_to && oldIssue.rows.length > 0 &&
        oldIssue.rows[0].assigned_to !== parseInt(assigned_to) &&
        parseInt(assigned_to) !== req.user.user_id) {
      await createNotification({
        userId: parseInt(assigned_to),
        type: 'issue_assigned',
        title: 'Issue assigned to you',
        message: `${req.user.full_name} assigned "${updatedIssue.title}" to you`,
        link: `/issue/${updatedIssue.issue_id}`,
        metadata: { issue_id: updatedIssue.issue_id, project_id: updatedIssue.project_id },
      });
    }

    // Log status change activity
    if (status && oldIssue.rows.length > 0 && oldIssue.rows[0].status !== status) {
      await logActivity({
        projectId: updatedIssue.project_id,
        userId: req.user.user_id,
        action: 'issue_status_changed',
        entityType: 'issue',
        entityId: updatedIssue.issue_id,
        details: {
          title: updatedIssue.title,
          old_status: oldIssue.rows[0].status,
          new_status: status,
        },
      });
    }

    res.status(200).json({ message: 'Issue updated', issue: updatedIssue });
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
    const userId = req.user.user_id;
    const isGlobalAdmin = req.user.role === 'Admin';

    const validStatuses = ['To Do', 'In Progress', 'Done'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    // Get old issue for permission check and activity log
    const oldIssue = await pool.query('SELECT * FROM issues WHERE issue_id = $1', [id]);

    if (oldIssue.rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const issue = oldIssue.rows[0];

    // Permission check: only assigned user, project owner, or project admin
    if (!isGlobalAdmin) {
      const isAssignee = issue.assigned_to === userId;

      // Check if user is project owner or admin
      let isProjectAdminOrOwner = false;
      if (!isAssignee) {
        const memberCheck = await pool.query(
          `SELECT member_role FROM project_members WHERE project_id = $1 AND user_id = $2`,
          [issue.project_id, userId]
        );
        if (memberCheck.rows.length > 0) {
          const role = memberCheck.rows[0].member_role;
          isProjectAdminOrOwner = (role === 'Owner' || role === 'Admin');
        }
      }

      if (!isAssignee && !isProjectAdminOrOwner) {
        return res.status(403).json({
          message: 'Only the assigned user or project admin can update issue status',
          code: 'STATUS_UPDATE_FORBIDDEN',
        });
      }
    }

    const { rows } = await pool.query(
      'UPDATE issues SET status = $1 WHERE issue_id = $2 RETURNING *',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const updatedIssue = rows[0];

    // Log activity
    if (issue.status !== status) {
      await logActivity({
        projectId: updatedIssue.project_id,
        userId: userId,
        action: 'issue_status_changed',
        entityType: 'issue',
        entityId: updatedIssue.issue_id,
        details: {
          title: updatedIssue.title,
          old_status: issue.status,
          new_status: status,
        },
      });

      // Notify assigned user about status change
      if (updatedIssue.assigned_to && updatedIssue.assigned_to !== userId) {
        await createNotification({
          userId: updatedIssue.assigned_to,
          type: 'issue_status_changed',
          title: 'Issue status changed',
          message: `"${updatedIssue.title}" moved from ${issue.status} to ${status}`,
          link: `/issue/${updatedIssue.issue_id}`,
          metadata: { issue_id: updatedIssue.issue_id, old_status: issue.status, new_status: status },
        });
      }
    }

    res.status(200).json({ message: 'Issue status updated', issue: updatedIssue });
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
      'DELETE FROM issues WHERE issue_id = $1 RETURNING issue_id, title, project_id',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    await logActivity({
      projectId: rows[0].project_id,
      userId: req.user.user_id,
      action: 'issue_deleted',
      entityType: 'issue',
      entityId: rows[0].issue_id,
      details: { title: rows[0].title },
    });

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

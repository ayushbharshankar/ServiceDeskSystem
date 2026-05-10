
import pool from '../db.js';
import { createNotification, logActivity } from './notification.controller.js';

// ── POST /api/projects — Create project ──────────────────────────────
const createProject = async (req, res) => {
  try {
    const { project_name, description, color } = req.body;

    if (!project_name) {
      return res.status(400).json({ message: 'project_name is required' });
    }

    const owner_id = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO projects (project_name, description, owner_id, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [project_name, description || null, owner_id, color || '#6366f1']
    );

    // Auto-add creator as project member with Owner role
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, member_role)
       VALUES ($1, $2, 'Owner')
       ON CONFLICT DO NOTHING`,
      [rows[0].project_id, owner_id]
    );

    await logActivity({
      projectId: rows[0].project_id,
      userId: owner_id,
      action: 'project_created',
      entityType: 'project',
      entityId: rows[0].project_id,
      details: { project_name },
    });

    res.status(201).json({ message: 'Project created', project: rows[0] });
  } catch (error) {
    console.error('createProject error:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// ── GET /api/projects — List projects for the current user ───────────
const getAllProjects = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'Admin';

    let query;
    let values = [];

    if (isAdmin) {
      query = `
        SELECT p.*, u.full_name AS owner_name,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id) AS issue_count,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.project_id) AS member_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.user_id
        ORDER BY p.created_at DESC
      `;
    } else {
      query = `
        SELECT p.*, u.full_name AS owner_name,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id) AS issue_count,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.project_id) AS member_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.user_id
        INNER JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $1
        ORDER BY p.created_at DESC
      `;
      values = [userId];
    }

    const { rows } = await pool.query(query, values);
    res.status(200).json({ projects: rows });
  } catch (error) {
    console.error('getAllProjects error:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// ── GET /api/projects/:id — Get project with details ─────────────────
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await pool.query(`
      SELECT p.*, u.full_name AS owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.user_id
      WHERE p.project_id = $1
    `, [id]);

    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Fetch members with roles
    const members = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, u.role, pm.joined_at, pm.member_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.project_id = $1
      ORDER BY pm.member_role ASC, pm.joined_at ASC
    `, [id]);

    // Fetch issue stats
    const stats = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'To Do')        AS todo,
        COUNT(*) FILTER (WHERE status = 'In Progress')  AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Done')          AS done
      FROM issues WHERE project_id = $1
    `, [id]);

    // Fetch pending invitations
    const invitations = await pool.query(`
      SELECT pi.*, u.full_name AS invited_by_name
      FROM project_invitations pi
      LEFT JOIN users u ON pi.invited_by = u.user_id
      WHERE pi.project_id = $1 AND pi.status = 'pending'
      ORDER BY pi.created_at DESC
    `, [id]);

    res.status(200).json({
      project: project.rows[0],
      members: members.rows,
      stats: stats.rows[0],
      invitations: invitations.rows,
    });
  } catch (error) {
    console.error('getProjectById error:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

// ── PUT /api/projects/:id — Update project ───────────────────────────
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_name, description, color } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (project_name) { fields.push(`project_name = $${idx++}`); values.push(project_name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (color) { fields.push(`color = $${idx++}`); values.push(color); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    const { rows } = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE project_id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project updated', project: rows[0] });
  } catch (error) {
    console.error('updateProject error:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// ── DELETE /api/projects/:id — Delete project ────────────────────────
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      'DELETE FROM projects WHERE project_id = $1 RETURNING project_id, project_name',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted', project: rows[0] });
  } catch (error) {
    console.error('deleteProject error:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// ── POST /api/projects/:id/members — Add member to project ───────────
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, member_role } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    const validRoles = ['Owner', 'Admin', 'Member'];
    const role = validRoles.includes(member_role) ? member_role : 'Member';

    // Verify project exists
    const project = await pool.query('SELECT project_id, project_name FROM projects WHERE project_id = $1', [id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user exists
    const user = await pool.query('SELECT user_id, full_name FROM users WHERE user_id = $1', [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, member_role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET member_role = $3`,
      [id, user_id, role]
    );

    // Create notification for the added user
    await createNotification({
      userId: user_id,
      type: 'member_added',
      title: `Added to project`,
      message: `You were added to "${project.rows[0].project_name}" by ${req.user.full_name}`,
      link: `/projects`,
      metadata: { project_id: parseInt(id), project_name: project.rows[0].project_name },
    });

    await logActivity({
      projectId: parseInt(id),
      userId: req.user.user_id,
      action: 'member_added',
      entityType: 'member',
      entityId: parseInt(user_id),
      details: { member_name: user.rows[0].full_name, role },
    });

    res.status(201).json({ message: `User ${user.rows[0].full_name} added to project` });
  } catch (error) {
    console.error('addMember error:', error);
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
};

// ── DELETE /api/projects/:id/members/:userId — Remove member ─────────
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Don't allow removing the owner
    const project = await pool.query('SELECT owner_id FROM projects WHERE project_id = $1', [id]);
    if (project.rows.length > 0 && project.rows[0].owner_id === parseInt(userId)) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Member not found in project' });
    }

    res.status(200).json({ message: 'Member removed from project' });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
};

// ── GET /api/projects/:id/members — List project members ─────────────
const getMembers = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, u.role, pm.joined_at, pm.member_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.project_id = $1
      ORDER BY
        CASE pm.member_role
          WHEN 'Owner' THEN 1
          WHEN 'Admin' THEN 2
          WHEN 'Member' THEN 3
          ELSE 4
        END,
        pm.joined_at ASC
    `, [id]);

    res.status(200).json({ members: rows });
  } catch (error) {
    console.error('getMembers error:', error);
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
};

// ── POST /api/projects/:id/invite — Invite user by email ─────────────
const inviteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, member_role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const validRoles = ['Admin', 'Member'];
    const role = validRoles.includes(member_role) ? member_role : 'Member';

    // Verify project exists
    const project = await pool.query('SELECT project_id, project_name FROM projects WHERE project_id = $1', [id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user exists
    const user = await pool.query('SELECT user_id, full_name FROM users WHERE email = $1', [email.trim().toLowerCase()]);

    if (user.rows.length > 0) {
      // Check if already a member
      const existing = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [id, user.rows[0].user_id]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ message: 'User is already a member of this project' });
      }

      // Add directly since user exists
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, member_role)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [id, user.rows[0].user_id, role]
      );

      // Notify the invited user
      await createNotification({
        userId: user.rows[0].user_id,
        type: 'project_invitation',
        title: 'Project invitation',
        message: `${req.user.full_name} invited you to "${project.rows[0].project_name}"`,
        link: `/projects`,
        metadata: { project_id: parseInt(id), project_name: project.rows[0].project_name },
      });

      await logActivity({
        projectId: parseInt(id),
        userId: req.user.user_id,
        action: 'member_invited',
        entityType: 'member',
        entityId: user.rows[0].user_id,
        details: { email, member_name: user.rows[0].full_name, role },
      });

      return res.status(201).json({
        message: `${user.rows[0].full_name} has been added to the project`,
        status: 'added',
      });
    }

    // User doesn't exist — create pending invitation
    await pool.query(
      `INSERT INTO project_invitations (project_id, email, invited_by, member_role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, email) DO UPDATE SET
         invited_by = $3,
         member_role = $4,
         status = 'pending',
         created_at = NOW()`,
      [id, email.trim().toLowerCase(), req.user.user_id, role]
    );

    await logActivity({
      projectId: parseInt(id),
      userId: req.user.user_id,
      action: 'member_invited',
      entityType: 'invitation',
      entityId: null,
      details: { email, role, status: 'pending' },
    });

    res.status(201).json({
      message: `Invitation sent to ${email}`,
      status: 'pending',
    });
  } catch (error) {
    console.error('inviteMember error:', error);
    res.status(500).json({ message: 'Error inviting member', error: error.message });
  }
};

// ── DELETE /api/projects/:id/invitations/:invitationId — Cancel invite
const cancelInvitation = async (req, res) => {
  try {
    const { id, invitationId } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM project_invitations WHERE invitation_id = $1 AND project_id = $2',
      [invitationId, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    res.status(200).json({ message: 'Invitation cancelled' });
  } catch (error) {
    console.error('cancelInvitation error:', error);
    res.status(500).json({ message: 'Error cancelling invitation', error: error.message });
  }
};

// ── GET /api/projects/:id/activity — Get project activity ────────────
const getProjectActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 30 } = req.query;

    const { rows } = await pool.query(`
      SELECT al.*, u.full_name AS user_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.project_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2
    `, [id, parseInt(limit, 10)]);

    res.status(200).json({ activities: rows });
  } catch (error) {
    console.error('getProjectActivity error:', error);
    res.status(500).json({ message: 'Error fetching activity', error: error.message });
  }
};

// ── GET /api/projects/:id/dashboard — Project dashboard stats ────────
const getProjectDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify project exists
    const project = await pool.query(`
      SELECT p.*, u.full_name AS owner_name
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.user_id
      WHERE p.project_id = $1
    `, [id]);

    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Issue stats by status
    const statusStats = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'To Do')        AS todo,
        COUNT(*) FILTER (WHERE status = 'In Progress')  AS in_progress,
        COUNT(*) FILTER (WHERE status = 'Done')          AS done
      FROM issues WHERE project_id = $1
    `, [id]);

    // Issue stats by priority
    const priorityStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE priority = 'Low')    AS low,
        COUNT(*) FILTER (WHERE priority = 'Medium') AS medium,
        COUNT(*) FILTER (WHERE priority = 'High')   AS high
      FROM issues WHERE project_id = $1
    `, [id]);

    // Members
    const members = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, pm.member_role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.project_id = $1
    `, [id]);

    // Recent activity
    const activities = await pool.query(`
      SELECT al.*, u.full_name AS user_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.project_id = $1
      ORDER BY al.created_at DESC
      LIMIT 20
    `, [id]);

    // Completion rate
    const total = parseInt(statusStats.rows[0].total, 10);
    const done = parseInt(statusStats.rows[0].done, 10);
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    res.status(200).json({
      project: project.rows[0],
      stats: {
        ...statusStats.rows[0],
        ...priorityStats.rows[0],
        total: total,
        completion_rate: completionRate,
      },
      members: members.rows,
      activities: activities.rows,
    });
  } catch (error) {
    console.error('getProjectDashboard error:', error);
    res.status(500).json({ message: 'Error fetching project dashboard', error: error.message });
  }
};

export {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject,
  addMember, removeMember, getMembers,
  inviteMember, cancelInvitation,
  getProjectActivity, getProjectDashboard,
};

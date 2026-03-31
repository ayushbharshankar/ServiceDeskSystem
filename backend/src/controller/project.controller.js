
import pool from '../db.js';

// ── POST /api/projects — Create project ──────────────────────────────
const createProject = async (req, res) => {
  try {
    const { project_name, description } = req.body;

    if (!project_name) {
      return res.status(400).json({ message: 'project_name is required' });
    }

    const owner_id = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO projects (project_name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [project_name, description || null, owner_id]
    );

    // Auto-add creator as project member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [rows[0].project_id, owner_id]
    );

    res.status(201).json({ message: 'Project created', project: rows[0] });
  } catch (error) {
    console.error('createProject error:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// ── GET /api/projects — List all projects ────────────────────────────
const getAllProjects = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.full_name AS owner_name,
        (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id) AS issue_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.user_id
      ORDER BY p.created_at DESC
    `);

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

    // Fetch members
    const members = await pool.query(`
      SELECT u.user_id, u.full_name, u.email, u.role, pm.joined_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.user_id
      WHERE pm.project_id = $1
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

    res.status(200).json({
      project: project.rows[0],
      members: members.rows,
      stats: stats.rows[0],
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
    const { project_name, description } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (project_name) { fields.push(`project_name = $${idx++}`); values.push(project_name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }

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
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'user_id is required' });
    }

    // Verify project exists
    const project = await pool.query('SELECT project_id FROM projects WHERE project_id = $1', [id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user exists
    const user = await pool.query('SELECT user_id, full_name FROM users WHERE user_id = $1', [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, user_id]
    );

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

export {
  createProject, getAllProjects, getProjectById,
  updateProject, deleteProject,
  addMember, removeMember,
};

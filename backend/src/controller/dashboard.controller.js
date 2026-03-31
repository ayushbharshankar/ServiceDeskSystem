
import pool from '../db.js';

// ── GET /api/dashboard — Aggregate stats for the logged-in user ──────
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const isAdmin = req.user.role === 'Admin';

    // Total projects (admin sees all, others see their memberships)
    let projectCount;
    if (isAdmin) {
      projectCount = await pool.query('SELECT COUNT(*) AS count FROM projects');
    } else {
      projectCount = await pool.query(
        'SELECT COUNT(*) AS count FROM project_members WHERE user_id = $1',
        [userId]
      );
    }

    // Task stats for the current user
    const taskStats = await pool.query(`
      SELECT
        COUNT(*)                                          AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'To Do')          AS pending_tasks,
        COUNT(*) FILTER (WHERE status = 'In Progress')    AS in_progress_tasks,
        COUNT(*) FILTER (WHERE status = 'Done')           AS completed_tasks
      FROM issues
      WHERE assigned_to = $1
    `, [userId]);

    // Recent issues (latest 10)
    const recentIssues = await pool.query(`
      SELECT i.issue_id, i.title, i.status, i.priority, i.created_at, p.project_name
      FROM issues i
      JOIN projects p ON i.project_id = p.project_id
      WHERE i.assigned_to = $1
      ORDER BY i.created_at DESC
      LIMIT 10
    `, [userId]);

    // Admin-only: total users
    let totalUsers = null;
    if (isAdmin) {
      const uRes = await pool.query('SELECT COUNT(*) AS count FROM users');
      totalUsers = parseInt(uRes.rows[0].count, 10);
    }

    res.status(200).json({
      total_projects: parseInt(projectCount.rows[0].count, 10),
      ...taskStats.rows[0],
      total_tasks: parseInt(taskStats.rows[0].total_tasks, 10),
      pending_tasks: parseInt(taskStats.rows[0].pending_tasks, 10),
      in_progress_tasks: parseInt(taskStats.rows[0].in_progress_tasks, 10),
      completed_tasks: parseInt(taskStats.rows[0].completed_tasks, 10),
      recent_issues: recentIssues.rows,
      total_users: totalUsers,
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

export { getDashboard };

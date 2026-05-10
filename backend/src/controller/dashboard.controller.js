
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

    // Recent issues assigned to user (latest 10)
    const recentIssues = await pool.query(`
      SELECT i.issue_id, i.title, i.status, i.priority, i.created_at, p.project_name, p.project_id
      FROM issues i
      JOIN projects p ON i.project_id = p.project_id
      WHERE i.assigned_to = $1
      ORDER BY i.created_at DESC
      LIMIT 10
    `, [userId]);

    // Active projects with stats
    let activeProjectsQuery;
    let activeProjectsValues;
    if (isAdmin) {
      activeProjectsQuery = `
        SELECT p.project_id, p.project_name, p.color, p.description,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id) AS total_issues,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id AND status != 'Done') AS open_issues,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id AND status = 'Done') AS done_issues,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.project_id) AS member_count
        FROM projects p
        ORDER BY p.created_at DESC
        LIMIT 6
      `;
      activeProjectsValues = [];
    } else {
      activeProjectsQuery = `
        SELECT p.project_id, p.project_name, p.color, p.description,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id) AS total_issues,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id AND status != 'Done') AS open_issues,
          (SELECT COUNT(*) FROM issues WHERE project_id = p.project_id AND status = 'Done') AS done_issues,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.project_id) AS member_count
        FROM projects p
        INNER JOIN project_members pm ON pm.project_id = p.project_id AND pm.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 6
      `;
      activeProjectsValues = [userId];
    }
    const activeProjects = await pool.query(activeProjectsQuery, activeProjectsValues);

    // Issues by priority (assigned to user, not done)
    const priorityIssues = await pool.query(`
      SELECT i.issue_id, i.title, i.status, i.priority, i.created_at, p.project_name, p.project_id
      FROM issues i
      JOIN projects p ON i.project_id = p.project_id
      WHERE i.assigned_to = $1 AND i.status != 'Done'
      ORDER BY
        CASE i.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END,
        i.created_at DESC
      LIMIT 20
    `, [userId]);

    // Recent activity involving the user
    const recentActivity = await pool.query(`
      SELECT al.*, u.full_name AS user_name, p.project_name
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.user_id
      LEFT JOIN projects p ON al.project_id = p.project_id
      WHERE al.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = $1
      )
      ORDER BY al.created_at DESC
      LIMIT 15
    `, [userId]);

    // Completed this week
    const weekStats = await pool.query(`
      SELECT COUNT(*) AS completed_this_week
      FROM issues
      WHERE assigned_to = $1
        AND status = 'Done'
        AND created_at >= NOW() - INTERVAL '7 days'
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
      completed_this_week: parseInt(weekStats.rows[0].completed_this_week, 10),
      recent_issues: recentIssues.rows,
      active_projects: activeProjects.rows,
      priority_issues: priorityIssues.rows,
      recent_activity: recentActivity.rows,
      total_users: totalUsers,
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

export { getDashboard };

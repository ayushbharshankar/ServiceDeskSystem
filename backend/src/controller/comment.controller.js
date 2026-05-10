
import pool from '../db.js';
import { createNotification, logActivity } from './notification.controller.js';

const addComment = async (req, res) => {
  try {
    const { issue_id, comment_text } = req.body;

    if (!issue_id || !comment_text) {
      return res.status(400).json({ message: 'issue_id and comment_text are required' });
    }

    const issue = await pool.query(
      'SELECT issue_id, title, project_id, assigned_to, created_by FROM issues WHERE issue_id = $1',
      [issue_id]
    );
    if (issue.rows.length === 0) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (issue_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [issue_id, req.user.user_id, comment_text]
    );

    // Return with author name
    const comment = rows[0];
    comment.author_name = req.user.full_name;

    const issueData = issue.rows[0];

    // Notify assigned user (if not the commenter)
    if (issueData.assigned_to && issueData.assigned_to !== req.user.user_id) {
      await createNotification({
        userId: issueData.assigned_to,
        type: 'comment_added',
        title: 'New comment',
        message: `${req.user.full_name} commented on "${issueData.title}"`,
        link: `/issue/${issue_id}`,
        metadata: { issue_id: parseInt(issue_id), comment_id: comment.comment_id },
      });
    }

    // Notify issue creator (if different from commenter and assignee)
    if (issueData.created_by &&
        issueData.created_by !== req.user.user_id &&
        issueData.created_by !== issueData.assigned_to) {
      await createNotification({
        userId: issueData.created_by,
        type: 'comment_added',
        title: 'New comment',
        message: `${req.user.full_name} commented on "${issueData.title}"`,
        link: `/issue/${issue_id}`,
        metadata: { issue_id: parseInt(issue_id), comment_id: comment.comment_id },
      });
    }

    await logActivity({
      projectId: issueData.project_id,
      userId: req.user.user_id,
      action: 'comment_added',
      entityType: 'comment',
      entityId: comment.comment_id,
      details: { issue_title: issueData.title, comment_preview: comment_text.slice(0, 100) },
    });

    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('addComment error:', error);
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// ── GET /api/comments?issue_id= — Get comments for an issue ─────────
const getCommentsByIssue = async (req, res) => {
  try {
    const { issue_id } = req.query;

    if (!issue_id) {
      return res.status(400).json({ message: 'issue_id query param is required' });
    }

    const { rows } = await pool.query(`
      SELECT cm.*, u.full_name AS author_name
      FROM comments cm
      LEFT JOIN users u ON cm.user_id = u.user_id
      WHERE cm.issue_id = $1
      ORDER BY cm.created_at ASC
    `, [issue_id]);

    res.status(200).json({ comments: rows });
  } catch (error) {
    console.error('getCommentsByIssue error:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

// ── DELETE /api/comments/:id — Delete own comment ────────────────────
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow deleting own comments (or admin)
    let query = 'DELETE FROM comments WHERE comment_id = $1';
    const values = [id];

    if (req.user.role !== 'Admin') {
      query += ' AND user_id = $2';
      values.push(req.user.user_id);
    }

    query += ' RETURNING comment_id';

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found or not authorized' });
    }

    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('deleteComment error:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

export { addComment, getCommentsByIssue, deleteComment };

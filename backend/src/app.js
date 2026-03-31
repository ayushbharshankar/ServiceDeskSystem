
import Express from 'express';
import cors from 'cors';
import pool from './db.js';

// Route imports
import authRoutes      from './route/auth.routes.js';
import userRoutes      from './route/user.routes.js';
import projectRoutes   from './route/project.routes.js';
import issueRoutes     from './route/issue.routes.js';
import commentRoutes   from './route/comment.routes.js';
import dashboardRoutes from './route/dashboard.routes.js';

const app = Express();

// ── Global middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(Express.json());

// ── Health check ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Service Desk Management System API is running 🚀' });
});

// ── API routes ────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/issues',    issueRoutes);
app.use('/api/comments',  commentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 handler ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

export default app;
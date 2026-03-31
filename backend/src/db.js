
import pg from 'pg';
import config from './config.js';

const pool = new pg.Pool({
  user: config.PG_USR,
  host: config.PG_HOST,
  database: config.PG_DB,
  password: config.PG_PASS,
  port: config.PG_PORT,
  ssl: { rejectUnauthorized: false },
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('PostgreSQL connection error:', err.message));

// ── Table initialization ──────────────────────────────────────────────
const initTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // USERS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id     SERIAL PRIMARY KEY,
        full_name   VARCHAR(100) NOT NULL,
        email       VARCHAR(100) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(50)  NOT NULL DEFAULT 'Developer',
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // PROJECTS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id    SERIAL PRIMARY KEY,
        project_name  VARCHAR(100) NOT NULL,
        description   TEXT,
        owner_id      INT REFERENCES users(user_id) ON DELETE SET NULL,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // PROJECT_MEMBERS join table (many-to-many: users <-> projects)
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id  INT REFERENCES projects(project_id) ON DELETE CASCADE,
        user_id     INT REFERENCES users(user_id) ON DELETE CASCADE,
        joined_at   TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (project_id, user_id)
      );
    `);

    // ISSUES table
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
          CREATE TYPE issue_priority AS ENUM ('Low', 'Medium', 'High');
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
          CREATE TYPE issue_status AS ENUM ('To Do', 'In Progress', 'Done');
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS issues (
        issue_id      SERIAL PRIMARY KEY,
        project_id    INT REFERENCES projects(project_id) ON DELETE CASCADE,
        title         VARCHAR(150) NOT NULL,
        description   TEXT,
        priority      issue_priority DEFAULT 'Medium',
        status        issue_status   DEFAULT 'To Do',
        assigned_to   INT REFERENCES users(user_id) ON DELETE SET NULL,
        created_by    INT REFERENCES users(user_id) ON DELETE SET NULL,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // COMMENTS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        comment_id    SERIAL PRIMARY KEY,
        issue_id      INT REFERENCES issues(issue_id) ON DELETE CASCADE,
        user_id       INT REFERENCES users(user_id) ON DELETE SET NULL,
        comment_text  TEXT NOT NULL,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error initializing tables:', err.message);
  } finally {
    client.release();
  }
};

// Run on import
initTables();

export default pool;

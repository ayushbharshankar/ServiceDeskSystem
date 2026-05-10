
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

pool.query('SELECT NOW()')
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('PostgreSQL connection error:', err.message));

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
        color         VARCHAR(7) DEFAULT '#6366f1',
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // PROJECT_MEMBERS join table with role
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id    INT REFERENCES projects(project_id) ON DELETE CASCADE,
        user_id       INT REFERENCES users(user_id) ON DELETE CASCADE,
        member_role   VARCHAR(20) DEFAULT 'Member',
        joined_at     TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (project_id, user_id)
      );
    `);

    // Safely add color column to projects if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6366f1';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    // Safely add member_role column to project_members if it doesn't exist
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE project_members ADD COLUMN IF NOT EXISTS member_role VARCHAR(20) DEFAULT 'Member';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
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

    // PROJECT INVITATIONS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_invitations (
        invitation_id  SERIAL PRIMARY KEY,
        project_id     INT REFERENCES projects(project_id) ON DELETE CASCADE,
        email          VARCHAR(100) NOT NULL,
        invited_by     INT REFERENCES users(user_id) ON DELETE SET NULL,
        member_role    VARCHAR(20) DEFAULT 'Member',
        status         VARCHAR(20) DEFAULT 'pending',
        created_at     TIMESTAMP DEFAULT NOW(),
        UNIQUE(project_id, email)
      );
    `);

    // NOTIFICATIONS table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id  SERIAL PRIMARY KEY,
        user_id          INT REFERENCES users(user_id) ON DELETE CASCADE,
        type             VARCHAR(50) NOT NULL,
        title            VARCHAR(200) NOT NULL,
        message          TEXT,
        link             VARCHAR(255),
        is_read          BOOLEAN DEFAULT FALSE,
        metadata         JSONB,
        created_at       TIMESTAMP DEFAULT NOW()
      );
    `);

    // ACTIVITY LOG table
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        activity_id   SERIAL PRIMARY KEY,
        project_id    INT REFERENCES projects(project_id) ON DELETE CASCADE,
        user_id       INT REFERENCES users(user_id) ON DELETE SET NULL,
        action        VARCHAR(50) NOT NULL,
        entity_type   VARCHAR(30),
        entity_id     INT,
        details       JSONB,
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

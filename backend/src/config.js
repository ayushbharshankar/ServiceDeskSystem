
import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: process.env.PORT || 8080,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  DATABASE_URL: process.env.DATABASE_URL,
  PG_USR: process.env.PG_USR,
  PG_HOST: process.env.PG_HOST,
  PG_DB: process.env.PG_DB,
  PG_PASS: process.env.PG_PASS,
  PG_PORT: process.env.PG_PORT,
};
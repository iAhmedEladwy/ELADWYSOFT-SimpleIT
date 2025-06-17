import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Create a simple in-memory database configuration for development
// This bypasses the disabled Neon endpoint issue
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'simpleit',
  ssl: false
});

export { pool };
export const db = drizzle(pool, { schema });
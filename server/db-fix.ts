import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Completely disable WebSocket secure connections
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = false;
neonConfig.forceDisablePgSSL = true;

// Make sure we have a database connection string
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Parse and modify connection string to force non-SSL
let connectionString = process.env.DATABASE_URL;
if (connectionString.includes('?')) {
  // Already has parameters
  if (!connectionString.includes('sslmode=')) {
    connectionString += '&sslmode=disable';
  } else {
    connectionString = connectionString.replace(/sslmode=[^&]+/, 'sslmode=disable');
  }
} else {
  // No parameters yet
  connectionString += '?sslmode=disable';
}

// Create pool with the modified connection string
const pool = new Pool({ connectionString });
const db = drizzle({ client: pool, schema });
# Local PostgreSQL Environment Setup

## Quick Fix for Local Development

Since you're using local PostgreSQL, here's the streamlined setup to match your Replit environment:

### 1. Database Setup
```bash
# Run the local PostgreSQL setup
psql -d your_database_name < local-postgresql-setup.sql
```

### 2. Environment Configuration
Create/update your `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database_name
NODE_ENV=development
SESSION_SECRET=your-session-secret-here
```

### 3. Update Database Configuration
Your `server/db.ts` should use standard PostgreSQL driver for local development:

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // No SSL for local development
});

const db = drizzle(pool, { schema });

export { pool, db };
```

### 4. Install Local Dependencies
```bash
npm install pg @types/pg drizzle-orm drizzle-kit
```

### 5. Apply Schema and Start
```bash
npm run db:push
npm run dev
```

## Key Differences from Replit

| Component | Replit | Local PostgreSQL |
|-----------|--------|------------------|
| Database Driver | `@neondatabase/serverless` | `pg` (node-postgres) |
| Connection | HTTP/WebSocket | Direct TCP connection |
| SSL | Managed by Neon | Disabled for local |
| Auto-increment | Database sequences | Same sequences |

## Testing Employee Creation

After setup, test with:
```bash
curl -X POST http://localhost:3000/api/employees/create-raw \
  -H "Content-Type: application/json" \
  -d '{
    "englishName": "Test Local User",
    "department": "IT",
    "idNumber": "LOCAL123",
    "title": "Developer",
    "employmentType": "Full-time",
    "status": "Active",
    "joiningDate": "2025-08-04"
  }'
```

Expected response: `201 Created` with auto-generated `EMP-XXXXX` ID.

This setup ensures your local environment behaves identically to Replit while using standard PostgreSQL connections.
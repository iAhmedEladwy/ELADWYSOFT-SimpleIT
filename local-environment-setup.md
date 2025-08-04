# Local PostgreSQL Environment Setup

## Quick Fix for Local Development

Since you're using local PostgreSQL, here's the streamlined setup to match your Replit environment:

### 1. Database Setup
Connect to your PostgreSQL database and run these commands:

```sql
-- Create sequences for auto-increment IDs
CREATE SEQUENCE IF NOT EXISTS employees_emp_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS assets_asset_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS tickets_ticket_id_seq START 1;

-- Set up auto-increment defaults
ALTER TABLE employees 
ALTER COLUMN emp_id SET DEFAULT 'EMP-' || LPAD(nextval('employees_emp_id_seq')::TEXT, 5, '0');

ALTER TABLE assets 
ALTER COLUMN asset_id SET DEFAULT 'AST-' || LPAD(nextval('assets_asset_id_seq')::TEXT, 5, '0');

ALTER TABLE tickets 
ALTER COLUMN ticket_id SET DEFAULT 'TKT-' || LPAD(nextval('tickets_ticket_id_seq')::TEXT, 6, '0');

-- Sync sequences with existing data (if any)
SELECT setval('employees_emp_id_seq', GREATEST((SELECT COALESCE(MAX(CAST(SUBSTRING(emp_id FROM 5) AS INTEGER)), 0) FROM employees WHERE emp_id ~ '^EMP-[0-9]+$') + 1, 1));
SELECT setval('assets_asset_id_seq', GREATEST((SELECT COALESCE(MAX(CAST(SUBSTRING(asset_id FROM 5) AS INTEGER)), 0) FROM assets WHERE asset_id ~ '^AST-[0-9]+$') + 1, 1));
SELECT setval('tickets_ticket_id_seq', GREATEST((SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 5) AS INTEGER)), 0) FROM tickets WHERE ticket_id ~ '^TKT-[0-9]+$') + 1, 1));
```

### 2. Environment Configuration
Create/update your `.env` file (matching deployment script format):
```env
NODE_ENV=development
PORT=5000
USE_HTTPS=false
DATABASE_URL=postgres://your_username:your_password@localhost:5432/your_database_name
SESSION_SECRET=your-session-secret-here
```

### 3. Update Database Configuration
Create/update your `server/db.ts` with this exact configuration (from deployment script):

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check for database connection string
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create direct PostgreSQL connection (no WebSocket)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

// Create Drizzle instance
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

## Configuration Applied from Deployment Script

The following settings match your provided deployment script:

- **PostgreSQL Driver**: Standard `pg` with Pool connections
- **Database URL Format**: `postgres://user:pass@localhost:5432/db`
- **SSL**: Disabled (`ssl: false`)
- **Connection**: Direct TCP connection to local PostgreSQL
- **Auto-increment**: Database sequences with EMP-/AST-/TKT- prefixes
- **Environment**: Production-ready configuration for development

This ensures your local environment matches the deployment script exactly.

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
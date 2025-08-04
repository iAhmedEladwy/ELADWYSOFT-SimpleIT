# SimpleIT Deployment Guide

## Quick Deployment from GitHub

This repository contains a complete working SimpleIT system that matches the current Replit environment. Follow these steps for identical deployment:

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb simpleit

# Run setup script to configure sequences and auto-increment
psql simpleit < deployment-database-setup.sql
```

### 2. Environment Setup

Create `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/simpleit
NODE_ENV=production
SESSION_SECRET=your-secure-random-session-secret-here
```

### 3. Application Deployment

```bash
# Clone and install
git clone https://github.com/iAhmedEladwy/ELADWYSOFT-SimpleIT.git
cd ELADWYSOFT-SimpleIT
npm install

# Apply database schema
npm run db:push

# Start application
npm run dev
```

### 4. Production Deployment (Ubuntu Server)

```bash
# Run automated setup script
chmod +x setup-ubuntu-environment.sh
./setup-ubuntu-environment.sh
```

## Key Features Included

- ✅ **Auto-increment ID generation** (EMP-XXXXX, AST-XXXXX, TKT-XXXXXX)
- ✅ **Complete CRUD operations** for Employees, Assets, and Tickets
- ✅ **Import/Export functionality** with CSV support
- ✅ **Unified ticket editing** (same form for row click and action button)
- ✅ **Real-time UI updates** after data changes
- ✅ **Cross-platform compatibility** (Replit, Ubuntu, Windows)
- ✅ **Database schema synchronization** tools
- ✅ **Role-based access control** (Employee, Agent, Manager, Admin)
- ✅ **Bilingual support** (English/Arabic)

## System Requirements

- **Node.js**: v22.18 LTS or later
- **PostgreSQL**: v16+ recommended
- **RAM**: 2GB minimum
- **Storage**: 1GB minimum

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with role hierarchy
- **Real-time**: WebSocket notifications

## Troubleshooting

### Employee Creation Issues
If employees show "success" but don't appear:
1. Verify sequences exist: `SELECT sequence_name FROM information_schema.sequences;`
2. Check database connection in logs
3. Run database setup script again

### Schema Mismatches
If deployment shows column errors:
1. Run: `npm run db:push`
2. Check database matches `shared/schema.ts`
3. Use sync tools: `node scripts/sync-schema.js`

### Import/Export Problems
If CSV import fails:
1. Check file permissions
2. Verify CSV format matches templates
3. Ensure sequences are properly configured

## Support

For deployment issues:
1. Check logs in `npm run dev` output
2. Verify database connection
3. Ensure all environment variables are set
4. Run diagnostic: `node scripts/auto-sync-workflow.js status`

This deployment package ensures identical functionality to the working Replit environment.
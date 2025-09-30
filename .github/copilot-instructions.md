# SimpleIT - AI Coding Assistant Instructions

## Project Architecture

SimpleIT is a full-stack IT Asset Management system with a **shared-schema monorepo architecture**:

- **Frontend**: React + TypeScript in `client/` using TanStack Query, Wouter routing, Shadcn UI + Tailwind
- **Backend**: Express.js in `server/` with session-based auth, PostgreSQL via Drizzle ORM
- **Shared**: Common schemas, types, and utilities in `shared/` - imported as `@shared/schema` and `@shared/types`
- **Database**: PostgreSQL with comprehensive RBAC (4-level role hierarchy: employee/agent/manager/admin)

## Key Development Patterns

### Data Flow & State Management
- **TanStack Query** for all server state - use `queryClient.ts` patterns for API calls
- **URL-synchronized filters** via `useUrlFilters` hook for tables/lists (Assets, Employees, Tickets)
- **Role-based access control** enforced at both API (`rbac.ts`) and component level (`RoleGuard`)
- **Bilingual support** (English/Arabic) via `useLanguage` hook - all UI text needs translation objects

### Component Architecture
- **Compound components** for complex features (e.g., `AssetFilters` + `AssetsTable` + `AssetForm`)
- **Shared UI components** in `client/src/components/ui/` (Shadcn-based)
- **Feature-specific components** organized by domain (`assets/`, `employees/`, `tickets/`, etc.)
- **Layout system** with responsive sidebar (`Layout.tsx`) and role-based navigation

### Database & API Patterns
- **Drizzle schema** in `shared/schema.ts` defines all tables, relations, and enums
- **Type-safe APIs** using Zod validation from shared schemas
- **Comprehensive audit logging** for all CRUD operations via `auditLogger.ts`
- **File storage abstraction** (`storage-factory.ts`) supports local filesystem or cloud storage

## Critical Development Workflows

### Development Commands
```bash
npm run dev          # Starts both frontend (Vite) and backend with hot reload
npm run build        # Builds production bundle (client to dist/public, server to dist/)
npm run db:push      # Push schema changes to database (use instead of migrations)
```

### Database Operations
- **Schema changes**: Modify `shared/schema.ts` then run `npm run db:push`
- **New tables**: Add to schema with relations, then update `shared/types.ts` for API contracts
- **RBAC changes**: Update `server/rbac.ts` permissions and role mappings

### Adding New Features
1. **Define schema** in `shared/schema.ts` and types in `shared/types.ts`
2. **Add API routes** in `server/routes.ts` with proper RBAC middleware
3. **Create React components** with `useUrlFilters` for list views
4. **Add translations** for both English and Arabic in component translation objects
5. **Test with different role levels** - features must respect the 4-tier role hierarchy

## Project-Specific Conventions

### File Organization
- **Route handlers**: All in single `server/routes.ts` file (7800+ lines) - add new endpoints here
- **Component imports**: Use `@/` for client paths, `@shared/` for shared modules
- **Asset management**: Upload handling via `storage-factory.ts` with configurable backends

### Code Patterns
- **Error handling**: Use `@shared/errors` classes with standard HTTP status codes
- **Form validation**: Combine Zod schemas from shared with React Hook Form
- **Date handling**: Use `date-fns` library consistently for formatting/parsing
- **Currency**: Multi-currency support via `currencyContext.tsx` and `currencyUtils.ts`

### RBAC Implementation
- **API level**: `requireRole()` and `requirePermission()` middleware in routes
- **UI level**: `<RoleGuard>` components and `useAuth().hasAccess()` checks
- **Data filtering**: Managers see subordinates only, employees see own data only

## Integration Points

### External Services
- **Email**: SendGrid integration via `emailService.ts` for notifications
- **Backups**: Automated PostgreSQL backups via `backupScheduler.ts` and `backupService.ts`
- **Session storage**: PostgreSQL session store with `connect-pg-simple`

### Deployment Architecture
- **Docker-first**: Production deployment via `docker-compose.yml` with PostgreSQL
- **Environment configs**: `.env` variables for database, storage, and external services
- **Static assets**: Served via Express static middleware in production

When working on this codebase, prioritize understanding the shared schema relationships and role-based access patterns before implementing new features. The monolithic route file and comprehensive RBAC system are central to how the application functions.
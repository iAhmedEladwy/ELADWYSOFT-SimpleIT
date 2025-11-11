# System Logs Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [WebSocket Protocol](#websocket-protocol)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The System Logs feature provides comprehensive logging, monitoring, and debugging capabilities for SimpleIT. It captures application events, errors, performance metrics, and security-related activities in real-time.

### Key Features
- **Real-time log streaming** via WebSocket
- **Hybrid storage** (Database + Files + Console)
- **Advanced filtering** by level, module, date, and search terms
- **Detailed log inspection** with metadata and stack traces
- **Performance monitoring** with slow request detection
- **Security auditing** for authentication and authorization events
- **Export capabilities** to CSV for external analysis

### Log Levels
| Level | Priority | Storage | Description |
|-------|----------|---------|-------------|
| **DEBUG** | Lowest | File + Console | Detailed diagnostic information |
| **INFO** | Low | File + Console | General informational messages |
| **WARN** | Medium | File + Console | Warning messages for potentially harmful situations |
| **ERROR** | High | **DB + File + Console** | Error events that might allow the app to continue |
| **CRITICAL** | Highest | **DB + File + Console** | Severe errors causing system instability |

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  System Logs Page (/developer-tools/system-logs)   │    │
│  │  - Real-time WebSocket connection                   │    │
│  │  - Advanced filtering UI                            │    │
│  │  - Log details dialog                               │    │
│  │  - Export to CSV                                    │    │
│  │  - Statistics dashboard                             │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  useLogStream Hook                                  │    │
│  │  - Auto-reconnect with exponential backoff          │    │
│  │  - Message type handling                            │    │
│  │  - Connection status tracking                       │    │
│  └────────────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────────────────┘
             │
             │ WebSocket: ws://host/ws/logs
             │ HTTP: REST API (/api/system-logs)
             │
┌────────────▼────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  WebSocketService                                   │    │
│  │  - Client connection management                     │    │
│  │  - Message broadcasting                             │    │
│  │  - Keep-alive pings (30s interval)                  │    │
│  │  - Graceful shutdown                                │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  SystemLogger Service                               │    │
│  │  - Multi-tier logging (console/file/db)            │    │
│  │  - Request ID generation                            │    │
│  │  - Performance monitoring                           │    │
│  │  - WebSocket integration                            │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Logging Middleware                                 │    │
│  │  - Global request/response logging                  │    │
│  │  - Error detection (4xx, 5xx)                       │    │
│  │  - Slow request detection (>2s)                     │    │
│  │  - Performance metrics                              │    │
│  └────────────────────────────────────────────────────┘    │
└────────────┬────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────┐
│                     Storage Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  Log Files   │  │   Console    │     │
│  │              │  │              │  │              │     │
│  │  ERROR       │  │  ALL LEVELS  │  │  Development │     │
│  │  CRITICAL    │  │              │  │  Only        │     │
│  │              │  │  Daily       │  │              │     │
│  │  Queryable   │  │  Rotation    │  │  Color-coded │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
server/
├── services/
│   ├── logger.ts              # Core logging service
│   └── websocketService.ts    # WebSocket server for real-time streaming
├── index.ts                   # Request/response logging middleware
├── passport.ts                # Authentication event logging
└── routes.ts                  # Critical operations logging

client/src/
├── hooks/
│   └── use-log-stream.ts      # WebSocket connection hook
├── components/
│   └── admin/
│       └── LogDetailsDialog.tsx  # Log details modal
└── pages/
    └── SystemLogs.tsx         # Main logs page

shared/
└── schema.ts                  # systemLogs table definition
```

---

## Features

### 1. Real-Time Log Streaming

**WebSocket Connection:**
- Endpoint: `ws://host/ws/logs` or `wss://host/ws/logs`
- Auto-reconnect with exponential backoff (1s → 2s → 4s → ... → 30s)
- Maximum 10 reconnection attempts
- Keep-alive ping every 30 seconds
- Connection status indicator in UI

**Message Types:**
```typescript
// Connection established
{
  type: 'connected',
  message: 'Connected to log stream',
  timestamp: '2025-11-11T...'
}

// New log entry
{
  type: 'new_log',
  data: {
    id: 123,
    timestamp: '2025-11-11T...',
    level: 'ERROR',
    module: 'auth',
    message: 'Failed login attempt',
    userId: 5,
    requestId: 'req_1234567890_abc123',
    metadata: { username: 'john.doe', reason: 'invalid_password' },
    stackTrace: null
  },
  timestamp: '2025-11-11T...'
}

// Statistics update
{
  type: 'stats_update',
  data: {
    levelCounts: { ERROR: 12, CRITICAL: 3 },
    moduleCounts: { auth: 8, users: 4 },
    recentErrors: 15,
    unresolvedCount: 7
  },
  timestamp: '2025-11-11T...'
}
```

### 2. Request/Response Logging

**Automatic Logging:**
- All HTTP requests are logged with:
  - Request ID (unique identifier)
  - Method, path, query parameters
  - User ID (if authenticated)
  - Response status code
  - Duration (milliseconds)
  - IP address

**Performance Monitoring:**
```typescript
// Slow request warning (>2 seconds)
Level: WARN
Module: performance
Message: "Slow request: GET /api/assets took 2150ms"
Metadata: {
  method: 'GET',
  path: '/api/assets',
  duration: 2150,
  userId: 5,
  requestId: 'req_...'
}

// HTTP error logging
Level: ERROR (for 5xx) or WARN (for 4xx)
Module: http
Message: "GET /api/users/999 - 404: User not found"
Metadata: {
  method: 'GET',
  path: '/api/users/999',
  statusCode: 404
}
```

### 3. Authentication Logging

**Login Events:**
```typescript
// Successful login
Level: INFO
Module: auth
Message: "Successful login: john.doe"
Metadata: {
  username: 'john.doe',
  role: 'agent'
}

// Failed login - user not found
Level: WARN
Module: auth
Message: "Failed login attempt - user not found: unknown.user"
Metadata: {
  username: 'unknown.user',
  reason: 'user_not_found'
}

// Failed login - invalid password
Level: WARN
Module: auth
Message: "Failed login attempt - invalid password: john.doe"
Metadata: {
  username: 'john.doe',
  reason: 'invalid_password'
}

// Account disabled
Level: WARN
Module: auth
Message: "Login attempt for inactive account: disabled.user"
Metadata: {
  username: 'disabled.user',
  reason: 'account_disabled'
}

// Authentication error
Level: ERROR
Module: auth
Message: "Authentication error: Database connection failed"
Error: Full stack trace included
```

### 4. Critical Operations Logging

**User Management:**
```typescript
// User creation
Level: INFO
Module: users
Message: "User created: new.user"
Metadata: {
  newUserId: 42,
  username: 'new.user',
  role: 'employee',
  createdBy: 'admin.user'
}

// Role change (SECURITY CRITICAL)
Level: WARN
Module: users
Message: "User role changed: john.doe (agent → manager)"
Metadata: {
  targetUserId: 15,
  targetUsername: 'john.doe',
  oldRole: 'agent',
  newRole: 'manager',
  changedBy: 'admin.user'
}

// User deletion
Level: WARN
Module: users
Message: "User deleted: old.user"
Metadata: {
  deletedUserId: 99,
  deletedUsername: 'old.user',
  deletedRole: 'employee',
  deletedBy: 'admin.user'
}

// Account activation/deactivation
Level: INFO
Module: users
Message: "User activated: john.doe"
Metadata: {
  targetUserId: 15,
  targetUsername: 'john.doe',
  statusChange: true,
  changedBy: 'admin.user'
}
```

**Asset Management:**
```typescript
// Asset creation
Level: INFO
Module: assets
Message: "Asset created: LAPTOP-2025-001"
Metadata: {
  assetId: 123,
  assetTag: 'LAPTOP-2025-001',
  type: 'Laptop',
  brand: 'Dell',
  model: 'Latitude 5420',
  createdBy: 'manager.user'
}

// Asset deletion
Level: WARN
Module: assets
Message: "Asset deleted: LAPTOP-2025-001"
Metadata: {
  assetId: 123,
  assetTag: 'LAPTOP-2025-001',
  type: 'Laptop',
  brand: 'Dell',
  deletedBy: 'manager.user'
}
```

**System Configuration:**
```typescript
// Configuration change
Level: WARN
Module: system
Message: "System configuration updated"
Metadata: {
  changes: {
    companyName: 'New Company Name',
    defaultCurrency: 'USD'
  },
  updatedBy: 'admin.user'
}
```

### 5. Advanced Filtering

**Available Filters:**
- **Level**: DEBUG, INFO, WARN, ERROR, CRITICAL, or ALL
- **Module**: auth, users, assets, system, http, performance, etc.
- **Search**: Full-text search in message content
- **Date Range**: Start date to end date
- **Status**: All, Resolved, Unresolved
- **Limit**: 50, 100, 250, 500, 1000 entries

**Example Queries:**
```typescript
// Find all authentication failures in the last 24 hours
Level: WARN
Module: auth
Start Date: 2025-11-10
End Date: 2025-11-11

// Find all critical errors
Level: CRITICAL
Status: Unresolved

// Find slow requests
Module: performance
Search: "Slow request"

// Find all user role changes
Module: users
Search: "role changed"
```

### 6. Log Details View

**Full Context Display:**
- **Timestamp**: Formatted as "November 11, 2025 at 3:45 PM"
- **Level Badge**: Color-coded (DEBUG=gray, INFO=blue, WARN=yellow, ERROR/CRITICAL=red)
- **Module**: Component that generated the log
- **Message**: Human-readable description
- **User ID**: Who performed the action (if applicable)
- **Request ID**: Unique identifier for request tracing
- **Metadata**: Full JSON object with all contextual data
- **Stack Trace**: Complete error stack (for errors)
- **Status**: Resolved or Unresolved

**Use Cases:**
- **Debugging**: View full error context with stack traces
- **Security Auditing**: Track who did what and when
- **Performance Analysis**: Identify slow endpoints and bottlenecks
- **Compliance**: Export audit trails for regulatory requirements

### 7. Statistics Dashboard

**Real-Time Metrics:**
- **Total Logs**: Count of all log entries in current filter
- **Recent Errors (24h)**: Error and Critical logs in last 24 hours
- **Unresolved Issues**: Count of unresolved error/critical logs
- **Top Modules**: Most active modules by log count

**Auto-Refresh:**
- Statistics update every 30 seconds
- Real-time updates via WebSocket
- Manual refresh button available

### 8. Export & Maintenance

**CSV Export:**
```csv
Timestamp,Level,Module,Message,User ID,Request ID,Resolved
2025-11-11T15:30:00.000Z,ERROR,auth,Failed login attempt,NULL,req_1234,No
2025-11-11T15:31:00.000Z,INFO,users,User created: john.doe,1,req_1235,Yes
```

**Cleanup Old Logs:**
- Delete logs older than 90 days
- Keeps database size manageable
- Retains file logs (manual cleanup required)
- Requires Admin role

---

## Usage Guide

### Accessing System Logs

1. **Navigate to System Logs:**
   ```
   Developer Tools → System Logs
   ```
   - Only accessible to users with **Super Admin** role
   - Located in the Developer Tools section

2. **Connection Status:**
   - **🟢 Live**: WebSocket connected, real-time updates active
   - **⚪ Offline**: WebSocket disconnected, manual refresh required

### Viewing Logs

1. **Apply Filters:**
   - Select log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   - Choose module or leave empty for all
   - Enter search term to filter messages
   - Set date range if needed
   - Choose resolution status

2. **Browse Results:**
   - Table shows: Timestamp, Level, Module, Message, User ID, Request ID
   - Logs are ordered by timestamp (newest first)
   - Color-coded badges indicate severity

3. **View Details:**
   - Click **"View Details"** button on any log
   - Modal opens with complete log information
   - Includes metadata, stack traces, and full context
   - Copy-friendly JSON format

4. **Mark as Resolved:**
   - Click **"Mark Resolved"** on unresolved ERROR/CRITICAL logs
   - Moves log to resolved status
   - Helps track issue resolution progress

### Interpreting Logs

**Request Tracing:**
```
1. Find the request ID in any log entry
2. Filter logs by that request ID
3. See all logs generated during that request
4. Trace execution flow through the system
```

**Performance Analysis:**
```
1. Filter by module: "performance"
2. Look for "Slow request" messages
3. Check metadata for endpoints taking >2 seconds
4. Identify bottlenecks and optimize
```

**Security Auditing:**
```
1. Filter by module: "auth" or "users"
2. Level: WARN (for security events)
3. Review failed login attempts
4. Check for unauthorized access attempts
5. Monitor role changes and account modifications
```

**Error Investigation:**
```
1. Filter by level: ERROR or CRITICAL
2. Status: Unresolved
3. Click "View Details" on each error
4. Read stack trace for error location
5. Check metadata for context
6. Use request ID to see related logs
7. Mark as resolved after fixing
```

### Export & Cleanup

**Export Logs:**
```
1. Apply desired filters
2. Click "Export CSV" button
3. File downloads: system-logs-YYYY-MM-DD.csv
4. Open in Excel, Google Sheets, or analysis tools
```

**Cleanup Old Logs:**
```
1. Click "Cleanup Old Logs" button
2. Confirms deletion of logs >90 days old
3. Database size is reduced
4. Statistics are recalculated
```

---

## API Reference

### REST Endpoints

#### Get System Logs
```http
GET /api/system-logs?level=ERROR&module=auth&limit=100&offset=0
```

**Query Parameters:**
- `level` (optional): DEBUG, INFO, WARN, ERROR, CRITICAL
- `module` (optional): Filter by module name
- `search` (optional): Search in message content
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `resolved` (optional): true, false
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": 123,
      "timestamp": "2025-11-11T15:30:00.000Z",
      "level": "ERROR",
      "module": "auth",
      "message": "Failed login attempt",
      "userId": null,
      "requestId": "req_1234567890_abc123",
      "metadata": "{\"username\":\"john.doe\"}",
      "stackTrace": null,
      "resolved": false
    }
  ],
  "total": 45,
  "limit": 100,
  "offset": 0
}
```

#### Get Log Statistics
```http
GET /api/system-logs/stats
```

**Response:**
```json
{
  "levelCounts": [
    { "level": "ERROR", "count": 12 },
    { "level": "CRITICAL", "count": 3 }
  ],
  "moduleCounts": [
    { "module": "auth", "count": 8 },
    { "module": "users", "count": 4 }
  ],
  "recentErrors": 15,
  "unresolvedErrors": 7
}
```

#### Mark Log as Resolved
```http
PUT /api/system-logs/:id/resolve
```

**Response:**
```json
{
  "id": 123,
  "resolved": true
}
```

#### Cleanup Old Logs
```http
DELETE /api/system-logs/cleanup?days=90
```

**Query Parameters:**
- `days`: Delete logs older than this many days (default: 90)

**Response:**
```json
{
  "message": "Deleted 1234 old log entries",
  "deletedCount": 1234
}
```

### WebSocket API

#### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws/logs');

ws.onopen = () => {
  console.log('Connected to log stream');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'connected':
      console.log('Connection established');
      break;
    
    case 'new_log':
      console.log('New log:', message.data);
      // Update UI with new log entry
      break;
    
    case 'stats_update':
      console.log('Stats updated:', message.data);
      // Update statistics display
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from log stream');
  // Implement reconnection logic
};
```

---

## WebSocket Protocol

### Connection Lifecycle

1. **Connection Establishment:**
   ```javascript
   Client -> Server: WebSocket handshake to ws://host/ws/logs
   Server -> Client: { type: 'connected', message: '...', timestamp: '...' }
   ```

2. **Keep-Alive:**
   ```javascript
   Server -> Client: PING (every 30 seconds)
   Client -> Server: PONG
   ```

3. **Log Broadcasting:**
   ```javascript
   Server -> All Clients: { type: 'new_log', data: {...}, timestamp: '...' }
   ```

4. **Graceful Shutdown:**
   ```javascript
   Server -> Client: Close(1000, 'Server shutting down')
   ```

### Auto-Reconnection Strategy

```javascript
// Exponential backoff algorithm
reconnectDelay = min(1000 * 2^(attemptCount), 30000)

// Example delays:
// Attempt 0: 1000ms (1 second)
// Attempt 1: 2000ms (2 seconds)
// Attempt 2: 4000ms (4 seconds)
// Attempt 3: 8000ms (8 seconds)
// Attempt 4: 16000ms (16 seconds)
// Attempt 5+: 30000ms (30 seconds, capped)

// Maximum attempts: 10
```

### Error Handling

```javascript
// Connection errors
ws.onerror = (error) => {
  // Log error
  // Update UI to show "Offline" status
  // Trigger reconnection
};

// Message parsing errors
try {
  const message = JSON.parse(event.data);
} catch (error) {
  console.error('Invalid message format:', error);
  // Ignore malformed messages
}

// Unknown message types
if (![connected', 'new_log', 'stats_update'].includes(message.type)) {
  console.warn('Unknown message type:', message.type);
  // Log but don't crash
}
```

---

## Configuration

### Environment Variables

```bash
# Node environment (affects console logging)
NODE_ENV=production  # or development

# Database connection (for log storage)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Server port (affects WebSocket URL)
PORT=5000
```

### Logger Service Configuration

**File Location:** `server/services/logger.ts`

```typescript
class SystemLogger {
  // Log directory (default: ./logs)
  private logsDir = join(process.cwd(), 'logs');
  
  // Development mode (affects console output)
  private isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Log rotation: Daily (one file per day)
  // Format: YYYY-MM-DD.log
}
```

### WebSocket Configuration

**File Location:** `server/services/websocketService.ts`

```typescript
// WebSocket server path
const wsPath = '/ws/logs';

// Keep-alive ping interval
const pingInterval = 30000; // 30 seconds

// Maximum reconnection attempts (client-side)
const maxReconnectAttempts = 10;

// Exponential backoff cap
const maxReconnectDelay = 30000; // 30 seconds
```

### Request Logging Configuration

**File Location:** `server/index.ts`

```typescript
// Slow request threshold
const slowRequestThreshold = 2000; // 2 seconds

// Log levels for HTTP status codes
const errorStatusStart = 400;  // 4xx, 5xx
const criticalStatusStart = 500; // 5xx only
```

---

## Best Practices

### For Developers

1. **Use Appropriate Log Levels:**
   ```typescript
   // DEBUG: Diagnostic information (development only)
   logger.debug('cache', 'Cache hit for key: user:123', { key: 'user:123' });
   
   // INFO: General information (user actions, system events)
   logger.info('users', 'User created: john.doe', { userId: 42 });
   
   // WARN: Potential issues, security events
   logger.warn('auth', 'Failed login attempt', { username: 'admin' });
   
   // ERROR: Recoverable errors
   logger.error('api', 'Database query failed', { error: dbError });
   
   // CRITICAL: System-threatening errors
   logger.critical('system', 'Database connection lost', { error });
   ```

2. **Include Rich Metadata:**
   ```typescript
   // Good: Rich context
   logger.info('assets', 'Asset assigned to employee', {
     metadata: {
       assetId: 123,
       assetTag: 'LAPTOP-001',
       employeeId: 45,
       employeeName: 'John Doe',
       assignedBy: currentUser.username
     }
   });
   
   // Bad: Minimal context
   logger.info('assets', 'Asset assigned');
   ```

3. **Use Request IDs for Tracing:**
   ```typescript
   // Generate request ID at the start
   const requestId = logger.generateRequestId();
   req.requestId = requestId;
   
   // Include in all logs for that request
   logger.info('api', 'Processing request', { requestId });
   logger.warn('validation', 'Invalid input', { requestId });
   logger.error('database', 'Query failed', { requestId });
   ```

4. **Log Security Events:**
   ```typescript
   // Authentication attempts
   logger.warn('auth', 'Failed login', { username, reason: 'invalid_password' });
   
   // Authorization failures
   logger.warn('rbac', 'Unauthorized access attempt', { 
     userId, 
     resource: 'admin_panel',
     requiredRole: 'admin',
     actualRole: 'employee'
   });
   
   // Role changes
   logger.warn('users', 'User role changed', {
     targetUser: userId,
     oldRole,
     newRole,
     changedBy: currentUser.id
   });
   ```

5. **Include Error Stack Traces:**
   ```typescript
   try {
     await riskyOperation();
   } catch (error) {
     logger.error('operation', 'Operation failed', {
       metadata: { operationId: 123 },
       error: error instanceof Error ? error : new Error(String(error))
     });
   }
   ```

### For System Administrators

1. **Regular Log Reviews:**
   - Check ERROR and CRITICAL logs daily
   - Review authentication failures weekly
   - Monitor slow requests monthly

2. **Set Up Alerts (Future Enhancement):**
   - Critical errors: Immediate notification
   - Multiple failed logins: Security alert
   - High error rate: Performance alert

3. **Log Retention:**
   - Database: Keep ERROR/CRITICAL logs for compliance period
   - Files: Archive monthly, keep 12 months minimum
   - Cleanup: Run cleanup every 90 days

4. **Performance Monitoring:**
   - Review slow request logs weekly
   - Identify bottlenecks in common endpoints
   - Optimize database queries based on logs

5. **Security Auditing:**
   - Export auth logs monthly for review
   - Track role changes and user management
   - Monitor suspicious activity patterns

### For End Users (Super Admins)

1. **Daily Checks:**
   - Review unresolved ERROR/CRITICAL logs
   - Check for failed authentication attempts
   - Monitor system health via statistics

2. **Investigation Workflow:**
   ```
   1. Filter by level (ERROR/CRITICAL) and status (Unresolved)
   2. Click "View Details" on each log
   3. Read the error message and metadata
   4. Check stack trace for technical details
   5. Use request ID to find related logs
   6. Take corrective action
   7. Mark as resolved
   ```

3. **Export for Analysis:**
   - Export filtered logs for detailed review
   - Share CSV files with technical team
   - Track trends over time

---

## Troubleshooting

### Common Issues

#### 1. WebSocket Won't Connect

**Symptom:** "Offline" status indicator, no real-time updates

**Causes & Solutions:**
- **HTTPS/HTTP Mismatch:**
  ```javascript
  // Check browser console for mixed content warnings
  // Ensure wss:// is used with https://, ws:// with http://
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ```

- **Firewall/Proxy Blocking:**
  ```bash
  # Test WebSocket connectivity
  wscat -c ws://your-server:5000/ws/logs
  
  # Check server firewall rules
  # Allow WebSocket traffic on port 5000
  ```

- **Server Not Running:**
  ```bash
  # Check server logs
  # Look for: "WebSocket service initialized for real-time logs"
  ```

#### 2. Logs Not Appearing

**Symptom:** No logs displayed in the UI

**Causes & Solutions:**
- **Filter Too Restrictive:**
  ```
  1. Reset all filters to default
  2. Set level to "All"
  3. Clear search box
  4. Remove date filters
  ```

- **Database Connection Issue:**
  ```bash
  # Check database connection
  # Verify DATABASE_URL environment variable
  # Check PostgreSQL logs
  ```

- **Permission Issue:**
  ```
  # Ensure user has super_admin role
  # Check RBAC configuration in server/rbac.ts
  ```

#### 3. Slow Performance

**Symptom:** System Logs page loads slowly

**Causes & Solutions:**
- **Too Many Logs:**
  ```
  1. Reduce limit to 50 or 100
  2. Apply more specific filters
  3. Use date range to narrow results
  4. Run cleanup on old logs
  ```

- **Missing Database Indexes:**
  ```sql
  -- Check for indexes on systemLogs table
  CREATE INDEX IF NOT EXISTS idx_systemlogs_timestamp ON system_logs(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_systemlogs_level ON system_logs(level);
  CREATE INDEX IF NOT EXISTS idx_systemlogs_module ON system_logs(module);
  CREATE INDEX IF NOT EXISTS idx_systemlogs_resolved ON system_logs(resolved);
  ```

#### 4. Missing Logs

**Symptom:** Expected logs not appearing

**Causes & Solutions:**
- **Log Level Filter:**
  ```typescript
  // Only ERROR and CRITICAL go to database
  // DEBUG, INFO, WARN only go to files
  
  // Check file logs: ./logs/YYYY-MM-DD.log
  ```

- **File Logging Failed:**
  ```bash
  # Check write permissions on logs directory
  chmod 755 ./logs
  
  # Check disk space
  df -h
  ```

#### 5. WebSocket Reconnection Loop

**Symptom:** Constant connect/disconnect in browser console

**Causes & Solutions:**
- **Server Keep-Alive Issue:**
  ```javascript
  // Check server logs for ping/pong errors
  // Verify WebSocket server is sending pings
  ```

- **Network Instability:**
  ```javascript
  // Exponential backoff will handle this
  // Check network connection quality
  // Consider increasing ping interval if needed
  ```

### Debug Mode

**Enable Detailed Logging:**

```bash
# Set environment to development
NODE_ENV=development npm run dev

# Check console for:
# - [WebSocket] connection messages
# - [AUTH] authentication events
# - Request/response logs with timing
```

**Browser Console:**
```javascript
// Enable WebSocket debugging
localStorage.setItem('debug', 'websocket');

// Check for:
// - Connection attempts
// - Message receipts
// - Reconnection attempts
```

### Getting Help

**Information to Provide:**
1. Browser console errors (if frontend issue)
2. Server logs (if backend issue)
3. Steps to reproduce
4. Expected vs. actual behavior
5. Environment (dev/production, browser, OS)

**Log Files to Check:**
- `./logs/YYYY-MM-DD.log` - Application logs
- Browser console - Frontend errors
- Server console - Backend errors
- PostgreSQL logs - Database issues

---

## Additional Resources

### Database Schema

```sql
CREATE TABLE system_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  level VARCHAR(10) NOT NULL,
  module VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  request_id VARCHAR(50),
  metadata TEXT,
  stack_trace TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_systemlogs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX idx_systemlogs_level ON system_logs(level);
CREATE INDEX idx_systemlogs_module ON system_logs(module);
CREATE INDEX idx_systemlogs_resolved ON system_logs(resolved);
CREATE INDEX idx_systemlogs_request_id ON system_logs(request_id);
```

### Example Integration

**Add Logging to New Feature:**

```typescript
import { logger } from './services/logger';

export async function createTicket(req, res) {
  const requestId = req.requestId;
  const userId = req.user?.id;
  
  try {
    // Log operation start
    logger.info('tickets', 'Creating new ticket', {
      userId,
      requestId,
      metadata: { title: req.body.title, priority: req.body.priority }
    });
    
    const ticket = await storage.createTicket(req.body);
    
    // Log success
    logger.info('tickets', `Ticket created: ${ticket.id}`, {
      userId,
      requestId,
      metadata: { ticketId: ticket.id, assignedTo: ticket.assignedTo }
    });
    
    res.json(ticket);
  } catch (error) {
    // Log error
    logger.error('tickets', 'Failed to create ticket', {
      userId,
      requestId,
      metadata: { title: req.body.title },
      error: error instanceof Error ? error : new Error(String(error))
    });
    
    res.status(500).json({ message: 'Failed to create ticket' });
  }
}
```

---

## Version History

- **v0.4.7** (2025-11-11)
  - Initial release of System Logs feature
  - Real-time WebSocket streaming
  - Comprehensive logging infrastructure
  - Advanced filtering and search
  - Log details dialog with metadata viewer
  - Export to CSV functionality
  - Statistics dashboard

---

## License

This documentation is part of the SimpleIT project and follows the same license terms.

For questions or issues, please contact the development team or create an issue in the project repository.

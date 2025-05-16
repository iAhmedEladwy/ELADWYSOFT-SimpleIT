import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { InsertActivityLog } from '@shared/schema';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ERROR = 'ERROR'
}

export enum EntityType {
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
  ASSET = 'ASSET', 
  TICKET = 'TICKET',
  ASSET_MAINTENANCE = 'ASSET_MAINTENANCE',
  ASSET_SALE = 'ASSET_SALE',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  SESSION = 'SESSION',
  REPORT = 'REPORT',
  SOFTWARE_ASSET = 'SOFTWARE_ASSET',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER'
}

interface AuditLogData {
  userId?: number;
  action: AuditAction;
  entityType: EntityType;
  entityId?: number;
  details?: object;
}

/**
 * Logs an action to the activity log
 */
export async function logActivity(data: AuditLogData): Promise<void> {
  try {
    const logEntry: InsertActivityLog = {
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      details: data.details || null,
    };
    
    await storage.logActivity(logEntry);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Middleware to log API requests
 */
export function auditLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store the original end method
  const originalEnd = res.end;
  
  // Get user ID if authenticated
  const userId = req.user ? (req.user as any).id : null;
  
  // Determine action based on HTTP method
  let action: AuditAction;
  switch (req.method) {
    case 'GET':
      action = AuditAction.READ;
      break;
    case 'POST':
      action = AuditAction.CREATE;
      break;
    case 'PUT':
    case 'PATCH':
      action = AuditAction.UPDATE;
      break;
    case 'DELETE':
      action = AuditAction.DELETE;
      break;
    default:
      action = AuditAction.READ;
  }
  
  // Determine entity type from URL
  let entityType: EntityType;
  let entityId: number | undefined = undefined;
  
  if (req.path.includes('/api/users')) {
    entityType = EntityType.USER;
    const id = extractIdFromPath(req.path);
    if (id !== null) entityId = id;
  } else if (req.path.includes('/api/employees')) {
    entityType = EntityType.EMPLOYEE;
    const id = extractIdFromPath(req.path);
    if (id !== null) entityId = id;
  } else if (req.path.includes('/api/assets')) {
    entityType = EntityType.ASSET;
    const id = extractIdFromPath(req.path);
    if (id !== null) entityId = id;
  } else if (req.path.includes('/api/tickets')) {
    entityType = EntityType.TICKET;
    const id = extractIdFromPath(req.path);
    if (id !== null) entityId = id;
  } else if (req.path.includes('/api/system-config')) {
    entityType = EntityType.SYSTEM_CONFIG;
  } else if (req.path.includes('/api/login')) {
    entityType = EntityType.SESSION;
    action = AuditAction.LOGIN;
  } else if (req.path.includes('/api/logout')) {
    entityType = EntityType.SESSION;
    action = AuditAction.LOGOUT;
  } else if (req.path.includes('/api/maintenance')) {
    entityType = EntityType.ASSET_MAINTENANCE;
    const id = extractIdFromPath(req.path);
    if (id !== null) entityId = id;
  } else if (req.path.includes('/api/reports')) {
    entityType = EntityType.REPORT;
  } else {
    entityType = EntityType.SYSTEM_CONFIG;
  }
  
  // Add a start time property to track request duration
  const requestStartTime = Date.now();
  
  // Override res.end to log after response is sent
  const newEnd: any = function(this: Response, chunk: any, encoding?: string | (() => void), callback?: (() => void)): Response {
    // Handle the various function signatures
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = undefined;
    }
    
    // Call the original end method
    const result = originalEnd.call(this, chunk, encoding as BufferEncoding, callback);
    
    // Log the activity after response is sent
    const details = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestBody: sanitizeRequestBody(req.body),
      responseTime: Date.now() - requestStartTime,
    };
    
    logActivity({
      userId,
      action,
      entityType,
      entityId,
      details
    }).catch(err => console.error('Error logging activity:', err));
    
    return result;
  };
  
  res.end = newEnd;
  next();
}

/**
 * Extract ID from path like /api/users/1
 */
function extractIdFromPath(path: string): number | null {
  const parts = path.split('/');
  const idStr = parts[parts.length - 1];
  const id = parseInt(idStr);
  return isNaN(id) ? null : id;
}

/**
 * Remove sensitive information from request body
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  if (sanitized.password) sanitized.password = '[REDACTED]';
  if (sanitized.passwordConfirm) sanitized.passwordConfirm = '[REDACTED]';
  if (sanitized.token) sanitized.token = '[REDACTED]';
  if (sanitized.accessToken) sanitized.accessToken = '[REDACTED]';
  if (sanitized.refreshToken) sanitized.refreshToken = '[REDACTED]';
  
  return sanitized;
}

/**
 * Log ticket status changes with history
 */
export async function logTicketStatusChange(
  userId: number,
  ticketId: number, 
  oldStatus: string, 
  newStatus: string,
  comment?: string
): Promise<void> {
  await logActivity({
    userId,
    action: AuditAction.STATUS_CHANGE,
    entityType: EntityType.TICKET,
    entityId: ticketId,
    details: {
      oldStatus,
      newStatus,
      comment,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log asset assignment changes
 */
export async function logAssetAssignment(
  userId: number,
  assetId: number,
  employeeId: number | null,
  action: 'assign' | 'unassign'
): Promise<void> {
  await logActivity({
    userId,
    action: action === 'assign' ? AuditAction.ASSIGN : AuditAction.UNASSIGN,
    entityType: EntityType.ASSET,
    entityId: assetId,
    details: {
      employeeId,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Log configuration changes
 */
export async function logConfigChange(
  userId: number,
  oldConfig: object,
  newConfig: object
): Promise<void> {
  await logActivity({
    userId,
    action: AuditAction.CONFIG_CHANGE,
    entityType: EntityType.SYSTEM_CONFIG,
    details: {
      oldConfig,
      newConfig,
      timestamp: new Date().toISOString()
    }
  });
}
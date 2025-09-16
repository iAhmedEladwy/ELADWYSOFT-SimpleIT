// Centralized TypeScript interfaces for API responses and common types

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// User-related types
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'agent' | 'employee';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'manager' | 'agent' | 'employee';
}

// Employee-related types
export interface EmployeeResponse {
  id: number;
  employeeId: string;
  englishName: string;
  arabicName?: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  hireDate: string;
  salary?: number;
  status: 'Active' | 'Resigned' | 'Terminated' | 'On Leave';
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  isActive: boolean;
}

// Asset-related types
export interface AssetResponse {
  id: number;
  assetId: string;
  name: string;
  type: string;
  brand?: string;
  modelName?: string;
  serialNumber?: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Damaged' | 'Sold' | 'Retired';
  purchaseDate?: string;
  purchasePrice?: number;
  assignedToId?: number;
  assignedEmployee?: EmployeeResponse;
  location?: string;
  warranty?: string;
  specifications?: Record<string, string>;
}

// Category-related types
export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateRequest {
  name: string;
  description?: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Ticket-related types - v0.4.0 Simplified Schema (21 core fields)
export interface TicketResponse {
  // Core Identity & Tracking
  id: number;
  ticketId: string;
  
  // Relationships
  submittedById: number;
  submittedBy?: EmployeeResponse;
  assignedToId?: number;
  assignedTo?: UserResponse;
  relatedAssetId?: number;
  relatedAsset?: AssetResponse;
  
  // Request Classification
  type: 'Incident' | 'Service Request' | 'Problem' | 'Change'; // Nature of request
  categoryId?: number; // Reference to categories table
  category?: CategoryResponse; // Populated category data
  
  // Priority Management (calculated based on urgency × impact)
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  
  // Content
  title: string; // Renamed from summary
  description: string;
  resolution?: string;
  
  // Status & Workflow
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  
  // Time Management
  createdAt: string;
  updatedAt: string;
  completionTime?: string;
  timeSpent?: number; // in minutes
  dueDate?: string;
  slaTarget?: string;
}

export interface TicketCreateRequest {
  title: string;
  description: string;
  type: 'Incident' | 'Service Request' | 'Problem' | 'Change';
  categoryId: number;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  submittedById: number;
  assignedToId?: number;
  relatedAssetId?: number;
  dueDate?: string;
}

export interface TicketUpdateRequest {
  title?: string;
  description?: string;
  type?: 'Incident' | 'Service Request' | 'Problem' | 'Change';
  categoryId?: number;
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  impact?: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedToId?: number;
  resolution?: string;
  timeSpent?: number;
  completionTime?: string;
}

// System configuration types
export interface SystemConfigResponse {
  id: number;
  companyName: string;
  language: 'English' | 'Arabic';
  currency: string;
  timezone: string;
  assetIdPrefix: string;
  employeeIdPrefix: string;
  ticketIdPrefix: string;
  emailSettings?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    fromAddress: string;
  };
}

// Custom asset management types
export interface CustomAssetType {
  id: number;
  name: string;
  description?: string;
}

export interface CustomAssetBrand {
  id: number;
  name: string;
  description?: string;
}

export interface CustomAssetStatus {
  id: number;
  name: string;
  description?: string;
  color?: string;
}

export interface CustomRequestType {
  id: number;
  name: string;
  description?: string;
}

export interface ServiceProvider {
  id: number;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
}

// Transaction and activity types
export interface AssetTransactionResponse {
  id: number;
  assetId: number;
  employeeId?: number;
  type: 'Check-In' | 'Check-Out' | 'Maintenance' | 'Sale' | 'Retirement' | 'Upgrade';
  date: string;
  notes?: string;
  conditionNotes?: string;
  asset?: AssetResponse;
  employee?: EmployeeResponse;
}

export interface ActivityLogResponse {
  id: number;
  userId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: Record<string, any>;
  timestamp: string;
  user?: UserResponse;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter types
export interface EmployeeFilters {
  status?: string;
  department?: string;
  employmentType?: string;
  search?: string;
}

export interface AssetFilters {
  type?: string;
  brand?: string;
  model?: string;
  status?: string;
  assignedTo?: string;
  search?: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  type?: string;
  assignedTo?: string;
  category?: string;
  createdBy?: string;
  search?: string;
}

// Form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: ValidationRule;
}
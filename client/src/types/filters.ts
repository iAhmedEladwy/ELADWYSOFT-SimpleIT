// Base filter interface that all modules extend
export interface BaseFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Employee-specific filters
export interface EmployeeFilters extends BaseFilters {
  status?: 'Active' | 'Resigned' | 'Terminated' | 'On Leave' | 'All';
  employmentType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern' | 'Freelance' | 'All';
  department?: string;
  joiningDateFrom?: string;
  joiningDateTo?: string;
}

// Asset-specific filters
export interface AssetFilters extends BaseFilters {
  type?: string;
  brand?: string;
  model?: string;
  status?: string;
  assignedTo?: string;
  maintenanceDue?: 'scheduled' | 'inProgress' | 'completed' | 'overdue';
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
}

// Ticket-specific filters
export interface TicketFilters extends BaseFilters {
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'All';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical' | 'All';
  requestType?: string;
  category?: string;
  assignedTo?: string;
  submittedBy?: string;
  createdFrom?: string;
  createdTo?: string;
}

// Combined type for generic use
export type AnyFilters = EmployeeFilters | AssetFilters | TicketFilters;

// Helper type to get filter keys
export type FilterKeys<T> = keyof T;

// URL parameter mapping - maps internal state names to URL parameter names
export const URL_PARAM_MAP = {
  // Employee mappings
  statusFilter: 'status',
  employmentTypeFilter: 'employmentType',
  departmentFilter: 'department',
  
  // Asset mappings
  typeFilter: 'type',
  brandFilter: 'brand',
  statusFilter: 'status',
  
  // Ticket mappings
  priorityFilter: 'priority',
  assignedToFilter: 'assignedTo',
  
  // Common mappings
  searchQuery: 'search',
  currentPage: 'page',
  itemsPerPage: 'limit',
} as const;

// Reverse mapping for reading from URL
export const STATE_PARAM_MAP = Object.entries(URL_PARAM_MAP).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

// Default filter values
export const DEFAULT_FILTERS = {
  employee: {
    status: 'Active',
    employmentType: 'All',
    department: 'All',
    search: '',
  } as EmployeeFilters,
  
  asset: {
    type: '',
    brand: '',
    status: '',
    search: '',
  } as AssetFilters,
  
  ticket: {
    status: 'All',
    priority: 'All',
    search: '',
  } as TicketFilters,
};

// Type guard functions
export function isEmployeeFilters(filters: AnyFilters): filters is EmployeeFilters {
  return 'employmentType' in filters || 'department' in filters;
}

export function isAssetFilters(filters: AnyFilters): filters is AssetFilters {
  return 'maintenanceDue' in filters || 'brand' in filters;
}

export function isTicketFilters(filters: AnyFilters): filters is TicketFilters {
  return 'priority' in filters || 'requestType' in filters;
}
import { CSVValidationRule, parseBoolean } from './csvUtils';

/**
 * Asset Import/Export Rules
 */
export const assetValidationRules: CSVValidationRule[] = [
  {
    field: 'type',
    required: true,
    type: 'string',
    validate: (value) => {
      const validTypes = ['Desktop', 'Laptop', 'Server', 'Printer', 'Monitor', 'Phone', 'Tablet', 'Network Equipment', 'Software License', 'Other'];
      return validTypes.includes(value) || `Type must be one of: ${validTypes.join(', ')}`;
    }
  },
  {
    field: 'brand',
    required: true,
    type: 'string'
  },
  {
    field: 'assetId',
    required: true,
    type: 'string',
    pattern: /^[A-Z0-9-]+$/,
    validate: (value) => value.length >= 3 || 'Asset ID must be at least 3 characters'
  },
  {
    field: 'serialNumber',
    required: true,
    type: 'string'
  },
  {
    field: 'status',
    required: true,
    type: 'string',
    validate: (value) => {
      const validStatuses = ['Active', 'Inactive', 'Maintenance', 'Disposed', 'Lost', 'Stolen'];
      return validStatuses.includes(value) || `Status must be one of: ${validStatuses.join(', ')}`;
    }
  },
  {
    field: 'modelNumber',
    required: false,
    type: 'string'
  },
  {
    field: 'modelName',
    required: false,
    type: 'string'
  },
  {
    field: 'specs',
    required: false,
    type: 'string'
  },
  {
    field: 'cpu',
    required: false,
    type: 'string'
  },
  {
    field: 'ram',
    required: false,
    type: 'string'
  },
  {
    field: 'storage',
    required: false,
    type: 'string'
  },
  {
    field: 'purchaseDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString().split('T')[0] : null
  },
  {
    field: 'buyPrice',
    required: false,
    type: 'string',
    pattern: /^\d+(\.\d{2})?$/,
    transform: (value) => value ? parseFloat(value).toFixed(2) : null
  },
  {
    field: 'warrantyExpiryDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString().split('T')[0] : null
  },
  {
    field: 'lifeSpan',
    required: false,
    type: 'string'
  },
  {
    field: 'outOfBoxOs',
    required: false,
    type: 'string'
  },
  {
    field: 'assignedToId',
    required: false,
    type: 'string',
    transform: (value) => value ? String(value) : null
  },
  {
    field: 'assignedEmployeeId',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  }
];

/**
 * Employee Import/Export Rules
 */
export const employeeValidationRules: CSVValidationRule[] = [
  {
    field: 'empId',
    required: true,
    type: 'string',
    pattern: /^[A-Z0-9-]+$/,
    validate: (value) => value.length >= 3 || 'Employee ID must be at least 3 characters'
  },
  {
    field: 'englishName',
    required: true,
    type: 'string',
    validate: (value) => value.length >= 2 || 'English name must be at least 2 characters'
  },
  {
    field: 'arabicName',
    required: false,
    type: 'string'
  },
  {
    field: 'email',
    required: true,
    type: 'email'
  },
  {
    field: 'department',
    required: true,
    type: 'string'
  },
  {
    field: 'position',
    required: true,
    type: 'string'
  },
  {
    field: 'phone',
    required: false,
    type: 'string',
    pattern: /^[\+]?[1-9][\d]{0,15}$/
  },
  {
    field: 'address',
    required: false,
    type: 'string'
  },
  {
    field: 'emergencyContact',
    required: false,
    type: 'string'
  },
  {
    field: 'nationalId',
    required: false,
    type: 'string'
  },
  {
    field: 'startDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString().split('T')[0] : null
  },
  {
    field: 'salary',
    required: false,
    type: 'string',
    pattern: /^\d+(\.\d{2})?$/,
    transform: (value) => value ? parseFloat(value).toFixed(2) : null
  },
  {
    field: 'employmentType',
    required: false,
    type: 'string',
    validate: (value) => {
      const validTypes = ['Full-time', 'Part-time', 'Contract', 'Intern'];
      return !value || validTypes.includes(value) || `Employment type must be one of: ${validTypes.join(', ')}`;
    }
  },
  {
    field: 'status',
    required: false,
    type: 'string',
    validate: (value) => {
      const validStatuses = ['Active', 'Resigned', 'Terminated', 'On Leave'];
      return !value || validStatuses.includes(value) || `Status must be one of: ${validStatuses.join(', ')}`;
    }
  },
  {
    field: 'managerId',
    required: false,
    type: 'string'
  },
  {
    field: 'managerId',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  },
  {
    field: 'startDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString().split('T')[0] : null
  },
  {
    field: 'salary',
    required: false,
    type: 'string',
    pattern: /^\d+(\.\d{2})?$/,
    transform: (value) => value ? parseFloat(value).toFixed(2) : null
  },
  {
    field: 'status',
    required: false,
    type: 'string',
    validate: (value) => {
      const validStatuses = ['Active', 'Inactive', 'Terminated', 'On Leave'];
      return !value || validStatuses.includes(value) || `Status must be one of: ${validStatuses.join(', ')}`;
    },
    transform: (value) => value || 'Active'
  }
];

/**
 * Ticket Import/Export Rules
 */
export const ticketValidationRules: CSVValidationRule[] = [
  {
    field: 'ticketId',
    required: false,
    type: 'string',
    pattern: /^[A-Z0-9-]+$/
  },
  {
    field: 'summary',
    required: true,
    type: 'string',
    validate: (value) => value.length >= 5 || 'Summary must be at least 5 characters'
  },
  {
    field: 'description',
    required: true,
    type: 'string',
    validate: (value) => value.length >= 10 || 'Description must be at least 10 characters'
  },
  {
    field: 'category',
    required: true,
    type: 'string',
    validate: (value) => {
      const validCategories = ['Hardware', 'Software', 'Network', 'Access', 'Other'];
      return validCategories.includes(value) || `Category must be one of: ${validCategories.join(', ')}`;
    }
  },
  {
    field: 'requestType',
    required: true,
    type: 'string',
    validate: (value) => {
      const validTypes = ['Incident', 'Service Request', 'Change Request', 'Problem'];
      return validTypes.includes(value) || `Request type must be one of: ${validTypes.join(', ')}`;
    }
  },
  {
    field: 'urgency',
    required: true,
    type: 'string',
    validate: (value) => {
      const validUrgencies = ['Low', 'Medium', 'High', 'Critical'];
      return validUrgencies.includes(value) || `Urgency must be one of: ${validUrgencies.join(', ')}`;
    }
  },
  {
    field: 'impact',
    required: true,
    type: 'string',
    validate: (value) => {
      const validImpacts = ['Low', 'Medium', 'High', 'Critical'];
      return validImpacts.includes(value) || `Impact must be one of: ${validImpacts.join(', ')}`;
    }
  },
  {
    field: 'status',
    required: false,
    type: 'string',
    validate: (value) => {
      const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      return !value || validStatuses.includes(value) || `Status must be one of: ${validStatuses.join(', ')}`;
    },
    transform: (value) => value || 'Open'
  },
  {
    field: 'submittedById',
    required: true,
    type: 'number',
    transform: (value) => parseInt(value)
  },
  {
    field: 'assignedToId',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  },
  {
    field: 'dueDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString() : null
  }
];

/**
 * User Import/Export Rules
 */
export const userValidationRules: CSVValidationRule[] = [
  {
    field: 'username',
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]+$/,
    validate: (value) => value.length >= 3 || 'Username must be at least 3 characters'
  },
  {
    field: 'email',
    required: true,
    type: 'email'
  },
  {
    field: 'role',
    required: true,
    type: 'string',
    validate: (value) => {
      const validRoles = ['Employee', 'Agent', 'Manager', 'Admin'];
      return validRoles.includes(value) || `Role must be one of: ${validRoles.join(', ')}`;
    }
  },
  {
    field: 'employeeId',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  },
  {
    field: 'managerId',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  },
  {
    field: 'isActive',
    required: false,
    type: 'boolean',
    transform: (value) => value !== undefined ? parseBoolean(value) : true
  }
];

/**
 * Asset Maintenance Import/Export Rules
 */
export const assetMaintenanceValidationRules: CSVValidationRule[] = [
  {
    field: 'assetId',
    required: true,
    type: 'number',
    transform: (value) => parseInt(value)
  },
  {
    field: 'type',
    required: true,
    type: 'string',
    validate: (value) => {
      const validTypes = ['Hardware', 'Software', 'Both'];
      return validTypes.includes(value) || `Type must be one of: ${validTypes.join(', ')}`;
    }
  },
  {
    field: 'description',
    required: true,
    type: 'string',
    validate: (value) => value.length >= 10 || 'Description must be at least 10 characters'
  },
  {
    field: 'date',
    required: true,
    type: 'date',
    transform: (value) => new Date(value).toISOString().split('T')[0]
  },
  {
    field: 'cost',
    required: true,
    type: 'string',
    pattern: /^\d+(\.\d{2})?$/,
    transform: (value) => parseFloat(value).toFixed(2)
  },
  {
    field: 'providerType',
    required: true,
    type: 'string',
    validate: (value) => {
      const validTypes = ['Internal', 'External'];
      return validTypes.includes(value) || `Provider type must be one of: ${validTypes.join(', ')}`;
    }
  },
  {
    field: 'providerName',
    required: false,
    type: 'string'
  }
];

/**
 * Asset Transaction Import/Export Rules
 */
export const assetTransactionValidationRules: CSVValidationRule[] = [
  {
    field: 'type',
    required: true,
    type: 'string',
    validate: (value) => {
      const validTypes = ['Check-Out', 'Check-In', 'Maintenance', 'Sale', 'Retirement'];
      return validTypes.includes(value) || `Type must be one of: ${validTypes.join(', ')}`;
    }
  },
  {
    field: 'assetId',
    required: true,
    type: 'number',
    transform: (value) => parseInt(value)
  },
  {
    field: 'employeeId',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  },
  {
    field: 'transactionDate',
    required: true,
    type: 'date',
    transform: (value) => new Date(value).toISOString()
  },
  {
    field: 'expectedReturnDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString() : null
  },
  {
    field: 'actualReturnDate',
    required: false,
    type: 'date',
    transform: (value) => value ? new Date(value).toISOString() : null
  },
  {
    field: 'conditionNotes',
    required: false,
    type: 'string'
  },
  {
    field: 'handledById',
    required: false,
    type: 'number',
    transform: (value) => value ? parseInt(value) : null
  }
];

/**
 * Export column mappings for each entity type
 */
export const assetExportColumns = [
  'id', 'assetId', 'type', 'brand', 'modelNumber', 'modelName', 'serialNumber', 
  'specs', 'cpu', 'ram', 'storage', 'status', 'purchaseDate', 'buyPrice', 
  'warrantyExpiryDate', 'lifeSpan', 'outOfBoxOs', 'assignedEmployeeId', 
  'createdAt', 'updatedAt'
];

export const employeeExportColumns = [
  'id', 'empId', 'englishName', 'arabicName', 'department', 'idNumber', 'title', 
  'directManager', 'employmentType', 'joiningDate', 'exitDate', 'status', 
  'personalMobile', 'workMobile', 'personalEmail', 'corporateEmail', 'userId',
  'email', 'phone', 'position', 'createdAt', 'updatedAt'
];

export const ticketExportColumns = [
  'id', 'ticketId', 'summary', 'description', 'category', 'requestType', 
  'urgency', 'impact', 'priority', 'status', 'submittedById', 'assignedToId', 
  'relatedAssetId', 'dueDate', 'slaTarget', 'escalationLevel', 'tags',
  'rootCause', 'workaround', 'resolution', 'resolutionNotes', 'privateNotes',
  'createdAt', 'updatedAt'
];

export const userExportColumns = [
  'id', 'username', 'email', 'role', 'employeeId', 'managerId', 
  'isActive', 'createdAt', 'updatedAt'
];

export const assetMaintenanceExportColumns = [
  'id', 'assetId', 'type', 'description', 'date', 'cost', 
  'providerType', 'providerName', 'createdAt', 'updatedAt'
];

export const assetTransactionExportColumns = [
  'id', 'type', 'assetId', 'employeeId', 'transactionDate', 
  'expectedReturnDate', 'actualReturnDate', 'conditionNotes', 
  'handledById', 'createdAt', 'updatedAt'
];

/**
 * Get validation rules for entity type
 */
export function getValidationRules(entityType: string): CSVValidationRule[] {
  const ruleMap: Record<string, CSVValidationRule[]> = {
    'assets': assetValidationRules,
    'employees': employeeValidationRules,
    'tickets': ticketValidationRules,
    'users': userValidationRules,
    'asset-maintenance': assetMaintenanceValidationRules,
    'asset-transactions': assetTransactionValidationRules
  };
  
  return ruleMap[entityType] || [];
}

/**
 * Get export columns for entity type
 */
export function getExportColumns(entityType: string): string[] {
  const columnMap: Record<string, string[]> = {
    'assets': assetExportColumns,
    'employees': employeeExportColumns,
    'tickets': ticketExportColumns,
    'users': userExportColumns,
    'asset-maintenance': assetMaintenanceExportColumns,
    'asset-transactions': assetTransactionExportColumns
  };
  
  return columnMap[entityType] || [];
}
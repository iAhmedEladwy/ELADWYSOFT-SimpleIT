import { stringify as csvStringify } from 'csv-stringify';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export interface CSVParseOptions {
  headers?: boolean;
  delimiter?: string;
  skipEmptyLines?: boolean;
  columns?: string[] | boolean;
}

export interface CSVStringifyOptions {
  headers?: boolean;
  delimiter?: string;
  columns?: string[];
}

export interface CSVValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'date' | 'email' | 'boolean';
  pattern?: RegExp;
  transform?: (value: any) => any;
  validate?: (value: any) => boolean | string;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    value: any;
    message: string;
  }>;
}

/**
 * Parse CSV data from string or buffer
 */
export function parseCSV(
  data: string | Buffer,
  options: CSVParseOptions = {}
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    // Create readable stream from data
    const stream = Readable.from(data.toString());
    
    // Configure parser options
    const parserOptions = {
      separator: options.delimiter || ',',
      skipEmptyLines: options.skipEmptyLines !== false,
      headers: options.headers !== false ? true : false,
      mapHeaders: ({ header }: { header: string }) => header.trim()
    };

    stream
      .pipe(csvParser(parserOptions))
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}



/**
 * Convert data to CSV string
 */
export function stringifyCSV(
  data: any[],
  options: CSVStringifyOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stringifyOptions = {
      header: options.headers !== false,
      delimiter: options.delimiter || ',',
      columns: options.columns,
    };

    csvStringify(data, stringifyOptions, (error, output) => {
      if (error) {
        reject(error);
      } else {
        resolve(output);
      }
    });
  });
}

/**
 * Validate CSV data against rules
 */
export function validateCSVData(
  data: any[],
  rules: CSVValidationRule[]
): CSVValidationResult {
  const errors: CSVValidationResult['errors'] = [];
  const warnings: CSVValidationResult['warnings'] = [];

  data.forEach((row, rowIndex) => {
    rules.forEach((rule) => {
      const value = row[rule.field];
      const rowNumber = rowIndex + 1;

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          row: rowNumber,
          field: rule.field,
          value,
          message: `Field '${rule.field}' is required`
        });
        return;
      }

      // Skip validation for empty optional fields
      if (value === undefined || value === null || value === '') {
        return;
      }

      // Type validation
      if (rule.type) {
        const validationError = validateFieldType(value, rule.type);
        if (validationError) {
          errors.push({
            row: rowNumber,
            field: rule.field,
            value,
            message: `Field '${rule.field}' ${validationError}`
          });
          return;
        }
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors.push({
          row: rowNumber,
          field: rule.field,
          value,
          message: `Field '${rule.field}' does not match required pattern`
        });
      }

      // Custom validation
      if (rule.validate) {
        const validationResult = rule.validate(value);
        if (validationResult !== true) {
          const message = typeof validationResult === 'string' 
            ? validationResult 
            : `Field '${rule.field}' failed validation`;
          errors.push({
            row: rowNumber,
            field: rule.field,
            value,
            message
          });
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Enhanced date parsing with multiple format support and robust error handling
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'na' || dateStr.toLowerCase() === 'n/a' || dateStr.toLowerCase() === 'null' || dateStr.toLowerCase() === 'undefined') {
    return null;
  }

  const cleanStr = dateStr.trim();
  
  // Handle empty or clearly invalid inputs
  if (cleanStr === '' || cleanStr === 'null' || cleanStr === 'undefined' || cleanStr === '0' || cleanStr === 'NaN') {
    return null;
  }

  try {
    // Try ISO format first (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
    if (cleanStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
      const isoDate = new Date(cleanStr);
      if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() >= 1900 && isoDate.getFullYear() <= 2100) {
        return isoDate;
      }
    }

    // Try MM/DD/YYYY format
    const mmddMatch = cleanStr.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
    if (mmddMatch) {
      const month = parseInt(mmddMatch[1]);
      const day = parseInt(mmddMatch[2]);
      const year = parseInt(mmddMatch[3]);
      
      // Validate ranges before creating Date
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

    // Try DD/MM/YYYY format (European)
    const ddmmMatch = cleanStr.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
    if (ddmmMatch) {
      const day = parseInt(ddmmMatch[1]);
      const month = parseInt(ddmmMatch[2]);
      const year = parseInt(ddmmMatch[3]);
      
      // Validate ranges before creating Date
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

    // Try YYYY-MM-DD format with dashes
    const yyyyMatch = cleanStr.match(/^(\d{4})[-](\d{1,2})[-](\d{1,2})$/);
    if (yyyyMatch) {
      const year = parseInt(yyyyMatch[1]);
      const month = parseInt(yyyyMatch[2]);
      const day = parseInt(yyyyMatch[3]);
      
      // Validate ranges before creating Date
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

    // Try MM-DD-YYYY format with dashes
    const mmddDashMatch = cleanStr.match(/^(\d{1,2})[-](\d{1,2})[-](\d{4})$/);
    if (mmddDashMatch) {
      const month = parseInt(mmddDashMatch[1]);
      const day = parseInt(mmddDashMatch[2]);
      const year = parseInt(mmddDashMatch[3]);
      
      // Validate ranges before creating Date
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
    }

  } catch (error) {
    // If any parsing fails, return null
    return null;
  }

  // If all parsing attempts fail, return null
  return null;
}

/**
 * Clean and validate employment type values
 */
export function cleanEmploymentType(value: string): string {
  // Handle missing, empty, or invalid values
  if (!value || value.trim() === '' || value.toLowerCase() === 'na' || 
      value.toLowerCase() === 'n/a' || value.toLowerCase() === 'null' || 
      value.toLowerCase() === 'undefined' || value === 'undefined') {
    return 'Full-time'; // Default to Full-time for missing/invalid values
  }

  const cleanValue = value.trim();
  const validTypes = ['Full-time', 'Part-time', 'Contract', 'Intern'];
  
  // Direct match
  if (validTypes.includes(cleanValue)) {
    return cleanValue;
  }

  // Case insensitive match
  const lowerValue = cleanValue.toLowerCase();
  for (const type of validTypes) {
    if (type.toLowerCase() === lowerValue) {
      return type;
    }
  }

  // Comprehensive partial matches
  if (lowerValue.includes('full') || lowerValue.includes('permanent') || 
      lowerValue.includes('regular') || lowerValue === 'ft' || 
      lowerValue === 'fulltime') return 'Full-time';
      
  if (lowerValue.includes('part') || lowerValue === 'pt' || 
      lowerValue.includes('parttime') || lowerValue.includes('casual')) return 'Part-time';
      
  if (lowerValue.includes('contract') || lowerValue.includes('temp') || 
      lowerValue.includes('freelance') || lowerValue.includes('consultant') ||
      lowerValue.includes('contractor')) return 'Contract';
      
  if (lowerValue.includes('intern') || lowerValue.includes('trainee') ||
      lowerValue.includes('apprentice') || lowerValue.includes('student')) return 'Intern';

  // Log warning for unrecognized values
  console.warn(`Unknown employment type "${value}", defaulting to "Full-time"`);
  return 'Full-time'; // Default to Full-time for unrecognized values
}

/**
 * Transform CSV data according to rules
 */
export function transformCSVData(
  data: any[],
  rules: CSVValidationRule[]
): any[] {
  return data.map((row) => {
    const transformedRow = { ...row };
    
    rules.forEach((rule) => {
      if (rule.transform && transformedRow[rule.field] !== undefined) {
        try {
          transformedRow[rule.field] = rule.transform(transformedRow[rule.field]);
        } catch (error) {
          console.warn(`Transform error for field '${rule.field}':`, error);
        }
      }
    });
    
    return transformedRow;
  });
}

/**
 * Enhanced field type validation with comprehensive checks
 */
export function validateFieldType(value: any, type: string, fieldName?: string): string | null {
  // Handle null, undefined, or empty string values
  if (value === null || value === undefined || value === '') {
    return null; // Allow empty values, validation rules will handle required fields
  }

  const valueStr = String(value).trim();
  if (valueStr === '' || valueStr.toLowerCase() === 'null' || valueStr.toLowerCase() === 'undefined') {
    return null; // Treat as empty
  }

  switch (type.toLowerCase()) {
    case 'string':
    case 'text':
      if (typeof valueStr !== 'string') return `${fieldName || 'Field'} must be text`;
      if (valueStr.length > 1000) return `${fieldName || 'Field'} is too long (max 1000 characters)`;
      return null;
      
    case 'number':
    case 'integer':
      const numValue = Number(valueStr);
      if (isNaN(numValue)) return `${fieldName || 'Field'} must be a valid number`;
      if (type === 'integer' && !Number.isInteger(numValue)) return `${fieldName || 'Field'} must be a whole number`;
      if (numValue < 0 && fieldName?.toLowerCase().includes('salary')) return 'Salary must be positive';
      return null;
      
    case 'email':
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(valueStr)) return `${fieldName || 'Email'} must be a valid email address (e.g., user@domain.com)`;
      if (valueStr.length > 254) return `${fieldName || 'Email'} is too long (max 254 characters)`;
      return null;
      
    case 'date':
      const parsedDate = parseDate(valueStr);
      if (!parsedDate) return `${fieldName || 'Date'} must be a valid date (YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY)`;
      const year = parsedDate.getFullYear();
      if (year < 1900 || year > 2100) return `${fieldName || 'Date'} year must be between 1900 and 2100`;
      return null;
      
    case 'boolean':
      const booleanValue = valueStr.toLowerCase();
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];
      if (!validBooleans.includes(booleanValue)) {
        return `${fieldName || 'Field'} must be true/false, yes/no, 1/0, or on/off`;
      }
      return null;
      
    case 'phone':
      // Remove common phone number formatting
      const phoneClean = valueStr.replace(/[\s\-\(\)\+\.]/g, '');
      if (phoneClean.length < 7 || phoneClean.length > 15) {
        return `${fieldName || 'Phone'} must be 7-15 digits`;
      }
      if (!/^\d+$/.test(phoneClean)) {
        return `${fieldName || 'Phone'} must contain only digits and common formatting characters`;
      }
      return null;
      
    case 'url':
      try {
        new URL(valueStr.startsWith('http') ? valueStr : `https://${valueStr}`);
        return null;
      } catch {
        return `${fieldName || 'URL'} must be a valid web address`;
      }
      
    case 'enum':
      // Enum validation handled separately by validation rules
      return null;
      
    default:
      return null;
  }
}

/**
 * Enhanced boolean parsing with comprehensive value support
 */
export function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  
  const stringValue = String(value).toLowerCase().trim();
  const trueValues = ['true', '1', 'yes', 'y', 'on', 'active', 'enabled'];
  const falseValues = ['false', '0', 'no', 'n', 'off', 'inactive', 'disabled'];
  
  if (trueValues.includes(stringValue)) return true;
  if (falseValues.includes(stringValue)) return false;
  
  // Default to false for unrecognized values
  return false;
}

/**
 * Enhanced data transformation with type coercion
 */
export function transformValue(value: any, type: string): any {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  const valueStr = String(value).trim();
  
  switch (type.toLowerCase()) {
    case 'number':
    case 'integer':
      const num = Number(valueStr);
      return isNaN(num) ? value : (type === 'integer' ? Math.round(num) : num);
      
    case 'boolean':
      return parseBoolean(valueStr);
      
    case 'date':
      const date = parseDate(valueStr);
      return date ? date.toISOString().split('T')[0] : value; // Return YYYY-MM-DD format
      
    case 'string':
    case 'text':
      return valueStr;
      
    case 'email':
      return valueStr.toLowerCase();
      
    case 'phone':
      // Normalize phone number format
      return valueStr.replace(/[\s\-\(\)\+\.]/g, '');
      
    case 'employment_type':
      return cleanEmploymentType(valueStr);
      
    default:
      return value;
  }
}

/**
 * Sanitize filename for download
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate timestamp for export filenames
 */
export function generateExportTimestamp(): string {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[:-]/g, '');
}

/**
 * Create download response headers for CSV
 */
export function createCSVDownloadHeaders(filename: string): Record<string, string> {
  const sanitizedFilename = sanitizeFilename(filename);
  const timestampedFilename = `${sanitizedFilename}_${generateExportTimestamp()}.csv`;
  
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${timestampedFilename}"`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Standardized CSV export function
 */
export async function exportToCSV(
  data: any[],
  filename: string,
  options: CSVStringifyOptions = {}
): Promise<{ content: string; headers: Record<string, string> }> {
  const content = await stringifyCSV(data, options);
  const headers = createCSVDownloadHeaders(filename);
  
  return { content, headers };
}

/**
 * Standardized CSV import function with validation
 */
export async function importFromCSV(
  data: string | Buffer,
  rules: CSVValidationRule[],
  options: CSVParseOptions = {}
): Promise<{
  data: any[];
  validation: CSVValidationResult;
  transformedData: any[];
}> {
  // Parse CSV
  const parsedData = await parseCSV(data, options);
  
  // Validate data
  const validation = validateCSVData(parsedData, rules);
  
  // Transform data if validation passes
  const transformedData = validation.isValid 
    ? transformCSVData(parsedData, rules)
    : [];
  
  return {
    data: parsedData,
    validation,
    transformedData
  };
}
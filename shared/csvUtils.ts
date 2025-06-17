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
      headers: options.headers !== false
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
 * Validate field type
 */
function validateFieldType(value: any, type: string): string | null {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return 'must be a string';
      }
      break;
    
    case 'number':
      if (isNaN(Number(value))) {
        return 'must be a valid number';
      }
      break;
    
    case 'date':
      if (isNaN(Date.parse(value))) {
        return 'must be a valid date';
      }
      break;
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return 'must be a valid email address';
      }
      break;
    
    case 'boolean':
      const booleanValue = String(value).toLowerCase();
      if (!['true', 'false', '1', '0', 'yes', 'no'].includes(booleanValue)) {
        return 'must be a valid boolean (true/false, 1/0, yes/no)';
      }
      break;
    
    default:
      return null;
  }
  
  return null;
}

/**
 * Convert boolean-like strings to actual booleans
 */
export function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  
  const stringValue = String(value).toLowerCase().trim();
  return ['true', '1', 'yes', 'on'].includes(stringValue);
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
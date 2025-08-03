// CSV parsing utilities for the frontend
export interface FileColumn {
  name: string;
  sampleValues: string[];
  dataType: 'text' | 'number' | 'date' | 'unknown';
}

export const parseCSV = (csvText: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        reject(new Error('CSV file must have at least a header row and one data row'));
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > 0) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }

      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};

export const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const analyzeColumns = (data: any[]): FileColumn[] => {
  if (!data || data.length === 0) return [];
  
  const columns: FileColumn[] = [];
  const headers = Object.keys(data[0]);
  
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val && val.toString().trim() !== '');
    const sampleValues = values.slice(0, 5);
    
    const dataType = detectDataType(sampleValues);
    
    columns.push({
      name: header,
      sampleValues,
      dataType
    });
  });
  
  return columns;
};

const detectDataType = (values: any[]): 'text' | 'number' | 'date' | 'unknown' => {
  if (values.length === 0) return 'unknown';
  
  let numberCount = 0;
  let dateCount = 0;
  
  values.forEach(value => {
    const str = value.toString().trim();
    
    // Check if it's a number
    if (!isNaN(Number(str)) && str !== '') {
      numberCount++;
    }
    
    // Check if it's a date
    if (isDateLike(str)) {
      dateCount++;
    }
  });
  
  const total = values.length;
  
  if (dateCount / total > 0.5) return 'date';
  if (numberCount / total > 0.7) return 'number';
  
  return 'text';
};

const isDateLike = (str: string): boolean => {
  // Check for common date patterns
  const datePatterns = [
    /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or DD-MM-YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(str));
};
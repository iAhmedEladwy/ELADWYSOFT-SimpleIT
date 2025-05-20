// Currency utility functions for SimpleIT Asset Management System

// Currency symbol mapping
const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  EGP: 'ج.م',
  CNY: '¥',
  JPY: '¥',
  SAR: 'ر.س',
  AED: 'د.إ',
  INR: '₹',
  CAD: '$',
  AUD: '$',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  JOD: 'د.ا',
  BHD: 'د.ب',
  OMR: 'ر.ع'
};

/**
 * Formats a number as currency using the system currency
 * @param value The number to format
 * @param currency The currency code (USD, EUR, etc.)
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'USD',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useSymbol?: boolean;
  } = {}
): string {
  if (value === null || value === undefined) return '';
  
  // Default formatting options
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    useSymbol = true
  } = options;

  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN values
  if (isNaN(numericValue)) return '';
  
  // Get symbol if requested
  const symbol = useSymbol ? (currencySymbols[currency] || currency) : '';
  
  // Format the number
  const formattedValue = numericValue.toLocaleString(undefined, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
  
  // Return formatted currency with symbol
  if (useSymbol) {
    // Different symbol placement based on currency
    if (['USD', 'CAD', 'AUD'].includes(currency)) {
      return `${symbol}${formattedValue}`;
    }
    return `${formattedValue} ${symbol}`;
  }
  
  return formattedValue;
}

/**
 * Get the currency symbol for a given currency code
 * @param currency The currency code
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}
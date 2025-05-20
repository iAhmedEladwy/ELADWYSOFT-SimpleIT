import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, getCurrencySymbol } from './currencyUtils';

// Context type definition
interface CurrencyContextType {
  currency: string;
  formatCurrency: (value: number | string | null | undefined, options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useSymbol?: boolean;
  }) => string;
  symbol: string;
}

// Create context with default values
const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  formatCurrency: (value) => String(value),
  symbol: '$'
});

// Hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext);

// Provider component to wrap the application
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>('USD');
  
  // Fetch system configuration to get the currency
  const { data: config } = useQuery({
    queryKey: ['/api/system-config'],
    refetchOnWindowFocus: false,
  });
  
  // Update currency state when configuration is loaded
  useEffect(() => {
    if (config && config.currency) {
      setCurrency(config.currency);
    }
  }, [config]);
  
  // Format currency using the system currency
  const formatValue = (
    value: number | string | null | undefined, 
    options = {}
  ) => {
    return formatCurrency(value, currency, options);
  };
  
  // Get the currency symbol
  const symbol = getCurrencySymbol(currency);
  
  // Context value
  const contextValue: CurrencyContextType = {
    currency,
    formatCurrency: formatValue,
    symbol
  };
  
  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};
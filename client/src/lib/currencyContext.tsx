import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, getCurrencySymbol } from './currencyUtils';

// Define a type for system config
interface SystemConfig {
  currency: string;
  language: string;
  [key: string]: any;
}

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

// Default values
const defaultCurrency = 'USD';
const defaultSymbol = '$';

// Create context with default values
const CurrencyContext = createContext<CurrencyContextType>({
  currency: defaultCurrency,
  formatCurrency: (value) => String(value),
  symbol: defaultSymbol
});

// Hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext);

// Provider component to wrap the application
export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [symbol, setSymbol] = useState<string>(defaultSymbol);
  
  // Helper to check if session exists
  const hasSession = () => {
    return document.cookie.includes('connect.sid');
  };
  
  // Fetch system configuration to get the currency - only if authenticated
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
    enabled: hasSession(), // Only fetch if session exists
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
  });
  
  // Update currency state and symbol when configuration is loaded
  useEffect(() => {
    if (config && config.currency) {
      setCurrency(config.currency);
      setSymbol(getCurrencySymbol(config.currency));
    }
  }, [config]);
  
  // Format currency with current system currency
  const formatValue = (
    value: number | string | null | undefined, 
    options = {}
  ): string => {
    return formatCurrency(value, currency, options);
  };
  
  // Create the context value
  const contextValue = {
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
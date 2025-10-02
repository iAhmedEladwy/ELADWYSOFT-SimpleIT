import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, getCurrencySymbol } from './currencyUtils';
import { getQueryFn } from './queryClient';

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
  const [shouldFetchConfig, setShouldFetchConfig] = useState(false);
  
  // Check if we should fetch config on mount
  React.useEffect(() => {
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
    const hasSessionCookie = document.cookie.includes('connect.sid');
    
    if (!isLoginPage || hasSessionCookie) {
      setShouldFetchConfig(true);
    }
  }, []);
  
  // Fetch system configuration to get the currency - only when enabled
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: shouldFetchConfig,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60, // 1 minute
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
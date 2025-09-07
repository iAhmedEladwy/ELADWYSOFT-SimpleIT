import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { AnyFilters, URL_PARAM_MAP, STATE_PARAM_MAP } from '@/types/filters';

interface UseUrlFiltersOptions<T extends AnyFilters> {
  defaultFilters: T;
  paramMapping?: Record<string, string>; // Maps state keys to URL param names
  debounceMs?: number;
  preserveDefaults?: boolean; // Whether to keep default values in URL
}

/**
 * Custom hook for managing filters with URL synchronization
 * Provides two-way binding between component state and URL parameters
 */
export function useUrlFilters<T extends AnyFilters>({
  defaultFilters,
  paramMapping = {},
  debounceMs = 500,
  preserveDefaults = false,
}: UseUrlFiltersOptions<T>) {
  const [location, setLocation] = useLocation();
  const [filters, setFiltersState] = useState<T>(defaultFilters);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Combine default param mapping with custom mapping
  const fullParamMapping = { ...URL_PARAM_MAP, ...paramMapping };

  /**
   * Parse URL parameters and convert to filter object
   */
  const parseUrlParams = useCallback((): Partial<T> => {
    const params = new URLSearchParams(window.location.search);
    const parsed: any = {};

    params.forEach((value, key) => {
      // Check if this URL param maps to a state property
      const stateKey = STATE_PARAM_MAP[key] || key;
      
      // Handle special conversions
      if (value === 'All' || value === 'all' || value === '') {
        // Don't set filter for "All" values
        return;
      }
      
      // Convert string to appropriate type
      if (value === 'true') {
        parsed[stateKey] = true;
      } else if (value === 'false') {
        parsed[stateKey] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        parsed[stateKey] = Number(value);
      } else {
        parsed[stateKey] = decodeURIComponent(value);
      }
    });

    return parsed;
  }, []);

  /**
   * Convert filters to URL search string
   */
  const filtersToUrlParams = useCallback((currentFilters: T): string => {
    const params = new URLSearchParams();

    Object.entries(currentFilters).forEach(([key, value]) => {
      // Get the URL parameter name for this filter
      const urlKey = fullParamMapping[key] || key;

      // Skip if value is default and we're not preserving defaults
      if (!preserveDefaults) {
        const defaultValue = (defaultFilters as any)[key];
        if (value === defaultValue || value === 'All' || value === '' || value === undefined) {
          return;
        }
      }

      // Convert value to string for URL
      if (value !== null && value !== undefined) {
        params.set(urlKey, String(value));
      }
    });

    return params.toString();
  }, [defaultFilters, fullParamMapping, preserveDefaults]);

  /**
   * Initialize filters from URL on mount
   */
  useEffect(() => {
    if (isInitialMount.current) {
      const urlFilters = parseUrlParams();
      const initialFilters = { ...defaultFilters, ...urlFilters } as T;
      setFiltersState(initialFilters);
      isInitialMount.current = false;
    }
  }, [defaultFilters, parseUrlParams]);

  /**
   * Update URL when filters change (debounced)
   */
  useEffect(() => {
    // Skip URL update on initial mount
    if (isInitialMount.current) {
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      const searchString = filtersToUrlParams(filters);
      const newUrl = searchString ? `${location}?${searchString}` : location;
      
      // Only update if URL actually changed
      const currentUrl = window.location.pathname + window.location.search;
      if (newUrl !== currentUrl) {
        window.history.replaceState({}, '', newUrl);
      }
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters, location, filtersToUrlParams, debounceMs]);

  /**
   * Update filters and trigger URL update
   */
  const setFilters = useCallback((newFilters: Partial<T> | ((prev: T) => T)) => {
    setFiltersState(prev => {
      if (typeof newFilters === 'function') {
        return newFilters(prev);
      }
      return { ...prev, ...newFilters };
    });
  }, []);

  /**
   * Reset filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    // Clear URL parameters
    window.history.replaceState({}, '', location);
  }, [defaultFilters, location]);

  /**
   * Clear a specific filter
   */
  const clearFilter = useCallback((key: keyof T) => {
    setFilters(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  }, [setFilters]);

  /**
   * Check if any filters are active (different from defaults)
   */
  const hasActiveFilters = useCallback(() => {
    return Object.entries(filters).some(([key, value]) => {
      const defaultValue = (defaultFilters as any)[key];
      return value !== defaultValue && value !== 'All' && value !== '';
    });
  }, [filters, defaultFilters]);

  /**
   * Get the count of active filters
   */
  const getActiveFilterCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const defaultValue = (defaultFilters as any)[key];
      return value !== defaultValue && value !== 'All' && value !== '';
    }).length;
  }, [filters, defaultFilters]);

  return {
    filters,
    setFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    getActiveFilterCount,
    // Expose internal functions for testing/debugging
    parseUrlParams,
    filtersToUrlParams,
  };
}

// Export convenience hooks for specific modules
export function useEmployeeFilters(defaultFilters?: any) {
  return useUrlFilters({
    defaultFilters: defaultFilters || {
      status: 'Active',
      employmentType: 'All',
      department: 'All',
      search: '',
    },
    paramMapping: {
      statusFilter: 'status',
      employmentTypeFilter: 'employmentType',
      departmentFilter: 'department',
      searchQuery: 'search',
    },
  });
}

export function useAssetFilters(defaultFilters?: any) {
  return useUrlFilters({
    defaultFilters: defaultFilters || {
      type: '',
      brand: '',
      status: '',
      search: '',
      maintenanceDue: '',
    },
    preserveDefaults: false,
  });
}

export function useTicketFilters(defaultFilters?: any) {
  return useUrlFilters({
    defaultFilters: defaultFilters || {
      status: 'All',
      priority: 'All',
      search: '',
    },
    paramMapping: {
      statusFilter: 'status',
      priorityFilter: 'priority',
      searchQuery: 'search',
    },
  });
}
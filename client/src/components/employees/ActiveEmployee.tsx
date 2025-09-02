import React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: number;
  empId: string;
  englishName: string;
  arabicName?: string;
  department: string;
  status: string;
  position?: string;
  title?: string;
  name?: string;
}

interface ActiveEmployeeSelectProps {
  value?: string | number;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showDepartment?: boolean;
  showPosition?: boolean;
  className?: string;
  required?: boolean;
}

export default function ActiveEmployeeSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  showDepartment = true,
  showPosition = false,
  className,
  required = false
}: ActiveEmployeeSelectProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Translations
  const translations = {
    selectEmployee: language === 'English' ? 'Select employee...' : 'اختر موظف...',
    searchPlaceholder: language === 'English' ? 'Search employees...' : 'البحث عن موظف...',
    noResults: language === 'English' ? 'No active employees found.' : 'لا يوجد موظفين نشطين.',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    activeEmployees: language === 'English' ? 'Active Employees' : 'الموظفين النشطين',
    none: language === 'English' ? 'None' : 'لا يوجد',
  };

  const { data: employeesData, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Filter active employees and apply manual search
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employeesData)) return [];

    let filtered = employeesData.filter(employee => employee && employee.status === 'Active');

    // Manual search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(employee => {
        const englishName = (employee.englishName || employee.name || '').toLowerCase();
        const arabicName = (employee.arabicName || '').toLowerCase();
        const empId = (employee.empId || '').toLowerCase();
        const department = (employee.department || '').toLowerCase();
        const position = (employee.position || employee.title || '').toLowerCase();

        return (
          englishName.includes(query) ||
          arabicName.includes(query) ||
          empId.includes(query) ||
          department.includes(query) ||
          position.includes(query)
        );
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      const nameA = language === 'Arabic' && a.arabicName 
        ? a.arabicName 
        : (a.englishName || a.name || '');
      const nameB = language === 'Arabic' && b.arabicName 
        ? b.arabicName 
        : (b.englishName || b.name || '');
      return nameA.localeCompare(nameB);
    });
  }, [employeesData, searchQuery, language]);

  // Get selected employee details
  const selectedEmployee = useMemo(() => {
    if (!value || value === 'none') return null;
    return employeesData?.find(emp => emp.id.toString() === value.toString());
  }, [value, employeesData]);

  // Format employee display
  const formatEmployeeDisplay = (employee: Employee) => {
    const name = language === 'Arabic' && employee.arabicName 
      ? employee.arabicName 
      : (employee.englishName || employee.name || '');
    
    let display = `${employee.empId} - ${name}`;
    
    if (showDepartment && employee.department) {
      display += ` (${employee.department})`;
    }
    
    if (showPosition && (employee.position || employee.title)) {
      display += ` - ${employee.position || employee.title}`;
    }
    
    return display;
  };

  // Get display text for button
  const getButtonDisplay = () => {
    if (isLoading) return translations.loading;
    if (!value || value === 'none') return placeholder || translations.selectEmployee;
    if (selectedEmployee) return formatEmployeeDisplay(selectedEmployee);
    return placeholder || translations.selectEmployee;
  };

  // Enable scroll on the scrollable div
  useEffect(() => {
    const scrollableDiv = scrollRef.current;
    if (!scrollableDiv) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      scrollableDiv.scrollTop += e.deltaY;
    };

    scrollableDiv.addEventListener('wheel', handleWheel, { passive: false });
    return () => scrollableDiv.removeEventListener('wheel', handleWheel);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled || isLoading}
        >
          <span className="truncate">
            {getButtonDisplay()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
        alignOffset={0}
        avoidCollisions={true}
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col" style={{ maxHeight: '350px' }}>
          {/* Search input - fixed at top */}
          <div className="flex items-center border-b px-3 bg-popover">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={translations.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* Scrollable employee list */}
          <div 
            ref={scrollRef}
            className="overflow-y-auto"
            style={{ 
              maxHeight: '280px',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {filteredEmployees.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {translations.noResults}
              </div>
            ) : (
              <div className="p-1">
                {/* None option for optional fields */}
                {!required && (
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      onValueChange('');
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (!value || value === 'none') ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{translations.none}</span>
                  </div>
                )}
                
                {/* Employee list */}
                {filteredEmployees.map((employee) => {
                  const displayName = language === 'Arabic' && employee.arabicName 
                    ? employee.arabicName 
                    : (employee.englishName || employee.name || '');
                  
                  return (
                    <div
                      key={employee.id}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onValueChange(employee.id.toString());
                        setOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 flex-shrink-0",
                          value === employee.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 flex items-start flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{employee.empId}</span>
                          <span>{displayName}</span>
                        </div>
                        {(showDepartment || showPosition) && (
                          <div className="flex items-center gap-2 mt-1">
                            {showDepartment && employee.department && (
                              <Badge variant="secondary" className="text-xs">
                                {employee.department}
                              </Badge>
                            )}
                            {showPosition && (employee.position || employee.title) && (
                              <Badge variant="outline" className="text-xs">
                                {employee.position || employee.title}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
import React from 'react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  // Add new prop to control popover alignment
  popoverAlign?: 'start' | 'center' | 'end';
  // Add new prop to control popover side
  popoverSide?: 'top' | 'bottom' | 'left' | 'right';
}

export default function ActiveEmployeeSelect({
  value,
  onValueChange,
  placeholder,
  disabled = false,
  showDepartment = true,
  showPosition = false,
  className,
  required = false,
  popoverAlign = 'start',
  popoverSide = 'bottom'
}: ActiveEmployeeSelectProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employeesData)) return [];

    return employeesData
      .filter(employee => {
        return employee && employee.status === 'Active';
      })
      .filter(employee => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
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
      })
      .sort((a, b) => {
        const nameA = language === 'Arabic' && a.arabicName 
          ? a.arabicName 
          : (a.englishName || a.name || '');
        const nameB = language === 'Arabic' && b.arabicName 
          ? b.arabicName 
          : (b.englishName || b.name || '');
        return nameA.localeCompare(nameB);
      });
  }, [employeesData, searchQuery, language]);

  const selectedEmployee = useMemo(() => {
    if (!value || value === 'none') return null;
    return filteredEmployees.find(emp => emp.id.toString() === value.toString());
  }, [value, filteredEmployees]);

  const displayPlaceholder = placeholder || translations.selectEmployee;

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={required}
          className={cn("w-full justify-between", className)}
          disabled={disabled || isLoading}
        >
          <span className="truncate">
            {isLoading 
              ? translations.loading
              : selectedEmployee 
                ? formatEmployeeDisplay(selectedEmployee)
                : displayPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0" 
        align={popoverAlign}
        side={popoverSide}
        sideOffset={5}
        // Add collision padding to prevent the popover from going off-screen
        collisionPadding={10}
        // Force the popover to be at least as wide as the trigger
        style={{ minWidth: 'var(--radix-popover-trigger-width)' }}
      >
        <Command className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={translations.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Add explicit height and overflow to CommandList for scrolling */}
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty className="py-6 text-center text-sm">
              {translations.noResults}
            </CommandEmpty>
            <CommandGroup heading={translations.activeEmployees}>
              {!required && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onValueChange('');
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value || value === 'none' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{translations.none}</span>
                </CommandItem>
              )}
              
              {filteredEmployees.map((employee) => {
                const displayName = language === 'Arabic' && employee.arabicName 
                  ? employee.arabicName 
                  : (employee.englishName || employee.name || '');
                
                return (
                  <CommandItem
                    key={employee.id}
                    value={employee.id.toString()}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center flex-1">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === employee.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
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
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
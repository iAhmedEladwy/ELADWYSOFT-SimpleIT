import React from 'react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Check, ChevronsUpDown } from 'lucide-react';
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

  // Filter only active employees
  const activeEmployees = useMemo(() => {
    if (!Array.isArray(employeesData)) return [];

    return employeesData
      .filter(employee => employee && employee.status === 'Active')
      .sort((a, b) => {
        const nameA = language === 'Arabic' && a.arabicName 
          ? a.arabicName 
          : (a.englishName || a.name || '');
        const nameB = language === 'Arabic' && b.arabicName 
          ? b.arabicName 
          : (b.englishName || b.name || '');
        return nameA.localeCompare(nameB);
      });
  }, [employeesData, language]);

  const selectedEmployee = useMemo(() => {
    if (!value || value === 'none') return null;
    return activeEmployees.find(emp => emp.id.toString() === value.toString());
  }, [value, activeEmployees]);

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

  const getEmployeeSearchValue = (employee: Employee) => {
    // Create a searchable string that includes all relevant fields
    const name = employee.englishName || employee.name || '';
    const arabicName = employee.arabicName || '';
    const dept = employee.department || '';
    const pos = employee.position || employee.title || '';
    return `${employee.empId} ${name} ${arabicName} ${dept} ${pos}`.toLowerCase();
  };

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
            {isLoading 
              ? translations.loading
              : selectedEmployee 
                ? formatEmployeeDisplay(selectedEmployee)
                : displayPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={translations.searchPlaceholder}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{translations.noResults}</CommandEmpty>
            <CommandGroup>
              {/* Add None option if not required */}
              {!required && (
                <CommandItem
                  value="none"
                  onSelect={() => {
                    onValueChange('');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !value || value === 'none' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {translations.none}
                </CommandItem>
              )}
              
              {/* Employee list */}
              {activeEmployees.map((employee) => {
                const displayName = language === 'Arabic' && employee.arabicName 
                  ? employee.arabicName 
                  : (employee.englishName || employee.name || '');
                
                return (
                  <CommandItem
                    key={employee.id}
                    value={getEmployeeSearchValue(employee)}
                    onSelect={() => {
                      onValueChange(employee.id.toString());
                      setOpen(false);
                    }}
                  >
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
                        {showDepartment && employee.department && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {employee.department}
                          </Badge>
                        )}
                      </div>
                      {showPosition && (employee.position || employee.title) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {employee.position || employee.title}
                        </div>
                      )}
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
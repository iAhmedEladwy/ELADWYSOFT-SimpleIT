import React, { useState, useMemo } from 'react';
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

  const { data: employeesData, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employeesData)) return [];

    return employeesData
      .filter(employee => employee && employee.status === 'Active')
      .filter(employee => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        const englishName = (employee.englishName || '').toLowerCase();
        const arabicName = (employee.arabicName || '').toLowerCase();
        const empId = (employee.empId || '').toLowerCase();
        const department = (employee.department || '').toLowerCase();
        const position = (employee.position || '').toLowerCase();

        return (
          englishName.includes(query) ||
          arabicName.includes(query) ||
          empId.includes(query) ||
          department.includes(query) ||
          position.includes(query)
        );
      })
      .sort((a, b) => {
        const nameA = language === 'Arabic' ? (a.arabicName || a.englishName) : a.englishName;
        const nameB = language === 'Arabic' ? (b.arabicName || b.englishName) : b.englishName;
        return nameA.localeCompare(nameB);
      });
  }, [employeesData, searchQuery, language]);

  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    return filteredEmployees.find(emp => emp.id.toString() === value.toString());
  }, [value, filteredEmployees]);

  const translations = {
    selectEmployee: 'Select employee...',
    searchPlaceholder: 'Search employees...',
    noResults: 'No active employees found.',
    loading: 'Loading...',
    activeEmployees: 'Active Employees',
  };

  const displayPlaceholder = placeholder || translations.selectEmployee;

  const formatEmployeeDisplay = (employee: Employee) => {
    const name = language === 'Arabic' && employee.arabicName 
      ? employee.arabicName 
      : employee.englishName;
    
    let display = employee.empId + ' - ' + name;
    
    if (showDepartment && employee.department) {
      display += ' (' + employee.department + ')';
    }
    
    if (showPosition && employee.position) {
      display += ' - ' + employee.position;
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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={translations.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>{translations.noResults}</CommandEmpty>
            <CommandGroup heading={translations.activeEmployees}>
              {filteredEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.id.toString()}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between"
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
                        <span>{language === 'Arabic' && employee.arabicName 
                          ? employee.arabicName 
                          : employee.englishName}</span>
                      </div>
                      {(showDepartment || showPosition) && (
                        <div className="flex items-center gap-2 mt-1">
                          {showDepartment && employee.department && (
                            <Badge variant="secondary" className="text-xs">
                              {employee.department}
                            </Badge>
                          )}
                          {showPosition && employee.position && (
                            <Badge variant="outline" className="text-xs">
                              {employee.position}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
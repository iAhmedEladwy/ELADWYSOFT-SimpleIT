import React from 'react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Translations
  const translations = {
    selectEmployee: language === 'English' ? 'Select employee...' : 'اختر موظف...',
    searchPlaceholder: language === 'English' ? 'Search...' : 'بحث...',
    noResults: language === 'English' ? 'No employees found' : 'لا يوجد موظفين',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    none: language === 'English' ? 'None' : 'لا يوجد',
  };

  const { data: employeesData, isLoading } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Filter active employees and apply search
  const filteredEmployees = useMemo(() => {
    if (!Array.isArray(employeesData)) return [];

    return employeesData
      .filter(employee => employee && employee.status === 'Active')
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

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder={translations.loading} />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select 
      value={value?.toString() || ''} 
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || translations.selectEmployee} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {/* Search input inside the dropdown */}
        <div className="flex items-center px-2 pb-2 sticky top-0 bg-popover">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={translations.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        
        {/* None option for optional fields */}
        {!required && (
          <SelectItem value="none">
            {translations.none}
          </SelectItem>
        )}
        
        {/* Employee list */}
        {filteredEmployees.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {translations.noResults}
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <SelectItem 
              key={employee.id} 
              value={employee.id.toString()}
            >
              {formatEmployeeDisplay(employee)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
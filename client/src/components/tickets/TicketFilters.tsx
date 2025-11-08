import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { VariantProps } from 'class-variance-authority';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { X, Filter, Search, User, ChevronDown, Check } from 'lucide-react';
import type { TicketFilters } from '@shared/types';

interface TicketFiltersProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
  totalCount: number;
  filteredCount: number;
  tickets?: any[];
}

export default function TicketFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  tickets = []
}: TicketFiltersProps) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  

  // Fetch data for filter options
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: systemConfig } = useQuery({
    queryKey: ['/api/system-config'],
  });

  const translations = {
    filters: language === 'Arabic' ? 'الفلاتر' : 'Filters',
    search: language === 'Arabic' ? 'بحث' : 'Search',
    searchPlaceholder: language === 'Arabic' ? 'البحث في التذاكر...' : 'Search tickets...',
    status: language === 'Arabic' ? 'الحالة' : 'Status',
    priority: language === 'Arabic' ? 'الأولوية' : 'Priority',
    category: language === 'Arabic' ? 'الفئة' : 'Category',
    type: language === 'Arabic' ? 'نوع التذكرة' : 'Ticket Type',
    requestType: language === 'Arabic' ? 'نوع الطلب' : 'Request Type',
    assignedTo: language === 'Arabic' ? 'مُسند إلى' : 'Assigned To',
    creator: language === 'Arabic' ? 'المنشئ' : 'Creator',
    clearFilters: language === 'Arabic' ? 'مسح الفلاتر' : 'Clear Filters',

    allStatuses: language === 'Arabic' ? 'جميع الحالات' : 'All Statuses',
    allPriorities: language === 'Arabic' ? 'جميع الأولويات' : 'All Priorities',
    allCategories: language === 'Arabic' ? 'جميع الفئات' : 'All Categories',
    allRequestTypes: language === 'Arabic' ? 'جميع أنواع الطلبات' : 'All Request Types',
    allUsers: language === 'Arabic' ? 'جميع المستخدمين' : 'All Users',
    unassigned: language === 'Arabic' ? 'غير مُسند' : 'Unassigned',
    showingResults: language === 'Arabic' ? 'عرض النتائج' : 'Showing results'
  };

  // Filter options
  const ticketStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const ticketPriorities = ['Low', 'Medium', 'High', 'Critical'];
  const ticketTypes = ['Incident', 'Service Request', 'Problem', 'Change']; // Static dropdown

   const statusCounts = useMemo(() => {
    if (!Array.isArray(tickets)) return {};
    
    return ticketStatuses.reduce((acc, status) => {
      acc[status] = tickets.filter(t => t.status === status).length;
      return acc;
    }, {} as Record<string, number>);
  }, [tickets, ticketStatuses]); 


  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
  });
  const categories = categoriesData || [];

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value !== undefined && value !== '' && key !== 'search'
  ).length;

  // Update filter
  const updateFilter = (key: keyof TicketFilters, value: string | string[] | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Handle status multi-select
  const handleStatusToggle = (status: string) => {
    const currentStatuses = Array.isArray(filters.status) ? filters.status : [];
    
    if (currentStatuses.includes(status)) {
      // Remove status
      const newStatuses = currentStatuses.filter(s => s !== status);
      updateFilter('status', newStatuses.length > 0 ? newStatuses : undefined);
    } else {
      // Add status
      updateFilter('status', [...currentStatuses, status]);
    }
  };

  // Clear status filter
  const clearStatusFilter = () => {
    updateFilter('status', undefined);
  };

  // Get selected statuses as array
  const selectedStatuses = useMemo(() => {
    if (!filters.status) return [];
    return Array.isArray(filters.status) ? filters.status : [filters.status];
  }, [filters.status]);

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateFilter('search', searchTerm || undefined);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    onFiltersChange({});
  };

  // Update search term when filters change
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filter & Search Tickets</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge className="bg-secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                {translations.clearFilters}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search Field */}
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">{translations.search}</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                type="text"
                placeholder={translations.searchPlaceholder}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearchSubmit(e as unknown as React.FormEvent<HTMLFormElement>)}
                className="pl-8 h-8 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Dropdown Filters - Improved responsive layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Status Multi-Select */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">{translations.status}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-8 justify-between text-sm font-normal"
                >
                  <span className="truncate">
                    {selectedStatuses.length === 0
                      ? translations.allStatuses
                      : selectedStatuses.length === 1
                      ? selectedStatuses[0]
                      : `${selectedStatuses.length} selected`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-sm font-medium">Select Status</span>
                    {selectedStatuses.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={clearStatusFilter}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {ticketStatuses.map((status) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleStatusToggle(status)}
                      >
                        <Checkbox
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => handleStatusToggle(status)}
                        />
                        <label className="flex-1 text-sm cursor-pointer">
                          {status}
                        </label>
                        <Badge variant="secondary" className="text-xs">
                          {statusCounts[status] || 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{translations.priority}</Label>
            <Select value={filters.priority || 'all'} onValueChange={(value) => updateFilter('priority', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={translations.allPriorities} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allPriorities}</SelectItem>
                {ticketPriorities?.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{translations.type}</Label>
            <Select value={filters.type || 'all'} onValueChange={(value) => updateFilter('type', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ticketTypes?.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{translations.assignedTo}</Label>
            <Select value={filters.assignedTo || 'all'} onValueChange={(value) => updateFilter('assignedTo', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={translations.allUsers} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allUsers}</SelectItem>
                <SelectItem value="unassigned">{translations.unassigned}</SelectItem>
                {users?.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">{translations.category}</Label>
            <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={translations.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allCategories}</SelectItem>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
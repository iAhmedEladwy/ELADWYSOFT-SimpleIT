import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { X, Filter, Search, User, Download } from 'lucide-react';
import type { TicketFilters } from '@shared/types';

interface TicketFiltersProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
  totalCount: number;
  filteredCount: number;
  onExport?: () => void;
}

export default function TicketFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  onExport
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
    requestType: language === 'Arabic' ? 'نوع الطلب' : 'Request Type',
    assignedTo: language === 'Arabic' ? 'مُسند إلى' : 'Assigned To',
    creator: language === 'Arabic' ? 'المنشئ' : 'Creator',
    clearFilters: language === 'Arabic' ? 'مسح الفلاتر' : 'Clear Filters',
    export: language === 'Arabic' ? 'تصدير' : 'Export',
    allStatuses: language === 'Arabic' ? 'جميع الحالات' : 'All Statuses',
    allPriorities: language === 'Arabic' ? 'جميع الأولويات' : 'All Priorities',
    allCategories: language === 'Arabic' ? 'جميع الفئات' : 'All Categories',
    allRequestTypes: language === 'Arabic' ? 'جميع أنواع الطلبات' : 'All Request Types',
    allUsers: language === 'Arabic' ? 'جميع المستخدمين' : 'All Users',
    unassigned: language === 'Arabic' ? 'غير مُسند' : 'Unassigned',
    showingResults: language === 'Arabic' ? 'عرض النتائج' : 'Showing results'
  };

  // Filter options
  const ticketStatuses = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
  const ticketPriorities = ['Low', 'Medium', 'High', 'Critical'];
  const ticketCategories = ['Hardware', 'Software', 'Network', 'Security', 'Access Control', 'General'];
  const requestTypes = systemConfig?.customRequestTypes || [];

  // Count active filters
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value !== undefined && value !== '' && key !== 'search'
  ).length;

  // Update filter
  const updateFilter = (key: keyof TicketFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Handle search
  const handleSearchSubmit = (e: React.FormEvent) => {
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
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {translations.showingResults}: {filteredCount} / {totalCount}
            </span>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                {translations.export}
              </Button>
            )}
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                {translations.clearFilters}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={translations.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            {translations.search}
          </Button>
        </form>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {translations.status}
            </Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allStatuses}</SelectItem>
                {ticketStatuses.map((status: string) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {translations.priority}
            </Label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => updateFilter('priority', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allPriorities} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allPriorities}</SelectItem>
                {ticketPriorities.map((priority: string) => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {translations.category}
            </Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allCategories}</SelectItem>
                {ticketCategories.map((category: string) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Request Type Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {translations.requestType}
            </Label>
            <Select
              value={filters.requestType || 'all'}
              onValueChange={(value) => updateFilter('requestType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allRequestTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allRequestTypes}</SelectItem>
                {requestTypes.map((type: any) => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {translations.assignedTo}
            </Label>
            <Select
              value={filters.assignedTo || 'all'}
              onValueChange={(value) => updateFilter('assignedTo', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allUsers} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allUsers}</SelectItem>
                <SelectItem value="unassigned">{translations.unassigned}</SelectItem>
                {(users || []).map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Creator Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {translations.creator}
            </Label>
            <Select
              value={filters.createdBy || 'all'}
              onValueChange={(value) => updateFilter('createdBy', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allUsers} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allUsers}</SelectItem>
                {(users || []).map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const translations = {
    filters: language === 'Arabic' ? 'الفلاتر' : 'Filters',
    search: language === 'Arabic' ? 'البحث' : 'Search',
    status: language === 'Arabic' ? 'الحالة' : 'Status',
    priority: language === 'Arabic' ? 'الأولوية' : 'Priority',
    assignedTo: language === 'Arabic' ? 'مخصص لـ' : 'Assigned To',
    category: language === 'Arabic' ? 'الفئة' : 'Category',
    clearAll: language === 'Arabic' ? 'مسح الكل' : 'Clear All',
    searchPlaceholder: language === 'Arabic' ? 'البحث في التذاكر...' : 'Search tickets...',
    allStatuses: language === 'Arabic' ? 'جميع الحالات' : 'All Statuses',
    allPriorities: language === 'Arabic' ? 'جميع الأولويات' : 'All Priorities',
    allCategories: language === 'Arabic' ? 'جميع الفئات' : 'All Categories',
    unassigned: language === 'Arabic' ? 'غير مخصص' : 'Unassigned',
    myTickets: language === 'Arabic' ? 'تذاكري' : 'My Tickets',
    currentUser: language === 'Arabic' ? '(الحالي)' : '(Current)',
    results: language === 'Arabic' ? 
      `عرض ${filteredCount} من ${totalCount} تذكرة` : 
      `Showing ${filteredCount} of ${totalCount} tickets`,
  };

  // Fetch users for assignment filter
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    select: (data: any[]) => data.map((user: any) => ({
      id: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username
    }))
  });

  // Fetch custom request types
  const { data: requestTypes = [] } = useQuery({
    queryKey: ['/api/custom-request-types'],
    select: (data: any[]) => data.map(type => type.name)
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput });
  };

  const updateFilter = (key: keyof TicketFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const setMyTicketsFilter = () => {
    if (user) {
      onFiltersChange({ ...filters, assignedTo: user.id.toString() });
    }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const ticketStatuses = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
  const ticketPriorities = ['Low', 'Medium', 'High', 'Critical'];

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
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="gap-1"
              >
                <Download className="h-3 w-3" />
                {language === 'Arabic' ? 'تصدير' : 'Export'}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={setMyTicketsFilter}
              className="gap-1"
            >
              <User className="h-3 w-3" />
              {translations.myTickets}
            </Button>
            <div className="text-sm text-muted-foreground">
              {translations.results}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={translations.searchPlaceholder}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            {translations.search}
          </Button>
        </form>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.status}
            </label>
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
            <label className="text-sm font-medium mb-2 block">
              {translations.priority}
            </label>
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
            <label className="text-sm font-medium mb-2 block">
              {translations.category}
            </label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allCategories}</SelectItem>
                {requestTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.assignedTo}
            </label>
            <Select
              value={filters.assignedTo || 'all'}
              onValueChange={(value) => updateFilter('assignedTo', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allStatuses}</SelectItem>
                <SelectItem value="unassigned">{translations.unassigned}</SelectItem>
                {users.map((usr: any) => (
                  <SelectItem key={usr.id} value={usr.id.toString()}>
                    {usr.name}
                    {user && usr.id === user.id && (
                      <span className="text-muted-foreground ml-1">
                        {translations.currentUser}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.search && (
              <Badge variant="outline" className="gap-1">
                {translations.search}: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setSearchInput('');
                    updateFilter('search', undefined);
                  }}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="outline" className="gap-1">
                {translations.status}: {filters.status}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('status', undefined)}
                />
              </Badge>
            )}
            {filters.priority && (
              <Badge variant="outline" className="gap-1">
                {translations.priority}: {filters.priority}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('priority', undefined)}
                />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="outline" className="gap-1">
                {translations.category}: {filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('category', undefined)}
                />
              </Badge>
            )}
            {filters.assignedTo && (
              <Badge variant="outline" className="gap-1">
                {translations.assignedTo}: {
                  filters.assignedTo === 'unassigned' 
                    ? translations.unassigned 
                    : users.find((u: any) => u.id.toString() === filters.assignedTo)?.name
                }
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('assignedTo', undefined)}
                />
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              {translations.clearAll}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
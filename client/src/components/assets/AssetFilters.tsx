import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
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
import { X, Filter, Search } from 'lucide-react';
import type { AssetFilters } from '@shared/types';

interface AssetFiltersProps {
  filters: AssetFilters;
  onFiltersChange: (filters: AssetFilters) => void;
  totalCount: number;
  filteredCount: number;
}

export default function AssetFilters({ 
  filters, 
  onFiltersChange, 
  totalCount, 
  filteredCount 
}: AssetFiltersProps) {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const translations = {
    filters: language === 'Arabic' ? 'الفلاتر' : 'Filters',
    search: language === 'Arabic' ? 'البحث' : 'Search',
    type: language === 'Arabic' ? 'النوع' : 'Type',
    brand: language === 'Arabic' ? 'العلامة التجارية' : 'Brand',
    status: language === 'Arabic' ? 'الحالة' : 'Status',
    assignedTo: language === 'Arabic' ? 'مخصص لـ' : 'Assigned To',
    clearAll: language === 'Arabic' ? 'مسح الكل' : 'Clear All',
    searchPlaceholder: language === 'Arabic' ? 'البحث في الأصول...' : 'Search assets...',
    allTypes: language === 'Arabic' ? 'جميع الأنواع' : 'All Types',
    allBrands: language === 'Arabic' ? 'جميع العلامات' : 'All Brands',
    allStatuses: language === 'Arabic' ? 'جميع الحالات' : 'All Statuses',
    unassigned: language === 'Arabic' ? 'غير مخصص' : 'Unassigned',
    results: language === 'Arabic' ? 
      `عرض ${filteredCount} من ${totalCount} أصل` : 
      `Showing ${filteredCount} of ${totalCount} assets`,
  };

  // Fetch available filter options
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['/api/custom-asset-types'],
    select: (data: any[]) => data.map(type => type.name)
  });

  const { data: assetBrands = [] } = useQuery({
    queryKey: ['/api/custom-asset-brands'],
    select: (data: any[]) => data.map(brand => brand.name)
  });

  const { data: assetStatuses = [] } = useQuery({
    queryKey: ['/api/custom-asset-statuses'],
    select: (data: any[]) => data.map(status => status.name)
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    select: (data: any[]) => data.map((emp: any) => ({
      id: emp.id,
      name: emp.englishName || emp.name
    }))
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput });
  };

  const updateFilter = (key: keyof AssetFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">{translations.filters}</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {translations.results}
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
          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.type}
            </label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => updateFilter('type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allTypes}</SelectItem>
                {assetTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.brand}
            </label>
            <Select
              value={filters.brand || 'all'}
              onValueChange={(value) => updateFilter('brand', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allBrands} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allBrands}</SelectItem>
                {assetBrands.map((brand: string) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {assetStatuses.map((status: string) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
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
                {employees.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
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
            {filters.type && (
              <Badge variant="outline" className="gap-1">
                {translations.type}: {filters.type}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('type', undefined)}
                />
              </Badge>
            )}
            {filters.brand && (
              <Badge variant="outline" className="gap-1">
                {translations.brand}: {filters.brand}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('brand', undefined)}
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
            {filters.assignedTo && (
              <Badge variant="outline" className="gap-1">
                {translations.assignedTo}: {
                  filters.assignedTo === 'unassigned' 
                    ? translations.unassigned 
                    : employees.find((e: any) => e.id.toString() === filters.assignedTo)?.name
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
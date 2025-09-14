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
import { X, Filter, Search, Download } from 'lucide-react';
import type { AssetFilters } from '@shared/types';

interface AssetFiltersProps {
  filters: AssetFilters;
  onFiltersChange: (filters: AssetFilters) => void;
  totalCount: number;
  filteredCount: number;
  onExport?: () => void;
}

export default function AssetFilters({ 
  filters, 
  onFiltersChange, 
  totalCount, 
  filteredCount,
  onExport
}: AssetFiltersProps) {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const translations = {
    filters: language === 'English' ? 'Filters' : 'الفلاتر',
    search: language === 'English' ? 'Search' : 'البحث',
    type: language === 'English' ? 'Type' : 'النوع',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    status: language === 'English' ? 'Status' : 'الحالة',
    assignedTo: language === 'English' ? 'Assigned To' : 'مخصص لـ',
    clearAll: language === 'English' ? 'Clear All' : 'مسح الكل',
    searchPlaceholder: language === 'English' ? 'Search assets...' : 'البحث في الأصول...',
    allTypes: language === 'English' ? 'All Types' : 'جميع الأنواع',
    allBrands: language === 'English' ? 'All Brands' : 'جميع العلامات',
    allStatuses: language === 'English' ? 'All Statuses' : 'جميع الحالات',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مخصص',
    results: language === 'English' ? 
      `Showing ${filteredCount} of ${totalCount} assets` : 
      `عرض ${filteredCount} من ${totalCount} أصل`,
    export: language === 'English' ? 'Export' : 'تصدير'
  };

  // Fetch available filter options
  const { data: assets } = useQuery({ queryKey: ['/api/assets'] });
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    select: (data: any[]) => data.map((emp: any) => ({
      id: emp.id,
      name: emp.englishName || emp.name
    }))
  });

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

  // Filter brands based on selected type
  const filteredBrands = filters.type 
    ? [...new Set(assets?.filter((a: any) => a.type === filters.type).map((a: any) => a.brand).filter(Boolean))]
    : assetBrands;
  
  // Filter models based on selected type and brand
  const filteredModels = (() => {
    let filteredAssets = assets || [];
    
    if (filters.type) {
      filteredAssets = filteredAssets.filter((a: any) => a.type === filters.type);
    }
    
    if (filters.brand) {
      filteredAssets = filteredAssets.filter((a: any) => a.brand === filters.brand);
    }
    
    return [...new Set(filteredAssets.map((a: any) => a.modelName).filter(Boolean))];
  })();

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
            <CardTitle className="text-lg">Filter & Search Assets</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
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
                {filteredBrands.map((brand: string) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Model
            </label>
            <Select
              value={filters.model || 'all'}
              onValueChange={(value) => updateFilter('model', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {filteredModels.map((model) => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
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
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                {translations.clearAll}
              </Button>
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="gap-1 h-6 px-2 text-xs"
                >
                  <Download className="h-3 w-3" />
                  {translations.export}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
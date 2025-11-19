import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Filter, Search, Download, ChevronDown } from 'lucide-react';
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
    model: language === 'English' ? 'Model' : 'الموديل',
    status: language === 'English' ? 'Status' : 'الحالة',
    assignedTo: language === 'English' ? 'Assigned To' : 'مخصص لـ',
    clearAll: language === 'English' ? 'Clear All' : 'مسح الكل',
    searchPlaceholder: language === 'English' ? 'Search assets...' : 'البحث في الأصول...',
    allTypes: language === 'English' ? 'All Types' : 'جميع الأنواع',
    allBrands: language === 'English' ? 'All Brands' : 'جميع العلامات',
    allModels: language === 'English' ? 'All Models' : 'جميع الموديلات',
    allStatuses: language === 'English' ? 'All Statuses' : 'جميع الحالات',
    allAssignments: language === 'English' ? 'All Assignments' : 'جميع التخصيصات',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مخصص',
    filterAndSearch: language === 'English' ? 'Filter & Search Assets' : 'تصفية والبحث في الأصول',
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
    ? [...new Set(assets?.filter((a: any) => {
        const selectedTypes = Array.isArray(filters.type) ? filters.type : [filters.type];
        return selectedTypes.includes(a.type);
      }).map((a: any) => a.brand).filter(Boolean))]
    : assetBrands;
  
  // Filter models based on selected type and brand
  const filteredModels = (() => {
    let filteredAssets = assets || [];
    
    if (filters.type) {
      const selectedTypes = Array.isArray(filters.type) ? filters.type : [filters.type];
      filteredAssets = filteredAssets.filter((a: any) => selectedTypes.includes(a.type));
    }
    
    if (filters.brand) {
      const selectedBrands = Array.isArray(filters.brand) ? filters.brand : [filters.brand];
      filteredAssets = filteredAssets.filter((a: any) => selectedBrands.includes(a.brand));
    }
    
    return [...new Set(filteredAssets.map((a: any) => a.modelName).filter(Boolean))];
  })();

  // Multi-select handlers
  const handleTypeToggle = (type: string) => {
    const currentTypes = Array.isArray(filters.type) ? filters.type : [];
    
    if (currentTypes.includes(type)) {
      const newTypes = currentTypes.filter(t => t !== type);
      updateFilter('type', newTypes.length > 0 ? newTypes : undefined);
    } else {
      updateFilter('type', [...currentTypes, type]);
    }
  };

  const handleBrandToggle = (brand: string) => {
    const currentBrands = Array.isArray(filters.brand) ? filters.brand : [];
    
    if (currentBrands.includes(brand)) {
      const newBrands = currentBrands.filter(b => b !== brand);
      updateFilter('brand', newBrands.length > 0 ? newBrands : undefined);
    } else {
      updateFilter('brand', [...currentBrands, brand]);
    }
  };

  const handleStatusToggle = (status: string) => {
    const currentStatuses = Array.isArray(filters.status) ? filters.status : [];
    
    if (currentStatuses.includes(status)) {
      const newStatuses = currentStatuses.filter(s => s !== status);
      updateFilter('status', newStatuses.length > 0 ? newStatuses : undefined);
    } else {
      updateFilter('status', [...currentStatuses, status]);
    }
  };

  // Get selected items as arrays
  const selectedTypes = useMemo(() => {
    if (!filters.type) return [];
    return Array.isArray(filters.type) ? filters.type : [filters.type];
  }, [filters.type]);

  const selectedBrands = useMemo(() => {
    if (!filters.brand) return [];
    return Array.isArray(filters.brand) ? filters.brand : [filters.brand];
  }, [filters.brand]);

  const selectedStatuses = useMemo(() => {
    if (!filters.status) return [];
    return Array.isArray(filters.status) ? filters.status : [filters.status];
  }, [filters.status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput });
  };

  const updateFilter = (key: keyof AssetFilters, value: string | string[] | undefined) => {
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
            <CardTitle className="text-lg">{translations.filterAndSearch}</CardTitle>
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

        {/* Filter Grid - Updated layout for 5 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {/* Type Filter - Multi-Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.type}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm font-normal"
                >
                  <span className="truncate">
                    {selectedTypes.length === 0
                      ? translations.allTypes
                      : selectedTypes.length === 1
                      ? selectedTypes[0]
                      : `${selectedTypes.length} selected`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <div className="p-2 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-sm font-medium">Select Type</span>
                    {selectedTypes.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => updateFilter('type', undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {assetTypes.map((type: string) => (
                      <div
                        key={type}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTypeToggle(type);
                        }}
                      >
                        <Checkbox
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            handleTypeToggle(type);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label className="flex-1 text-sm cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Brand Filter - Multi-Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.brand}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm font-normal"
                >
                  <span className="truncate">
                    {selectedBrands.length === 0
                      ? translations.allBrands
                      : selectedBrands.length === 1
                      ? selectedBrands[0]
                      : `${selectedBrands.length} selected`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <div className="p-2 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-sm font-medium">Select Brand</span>
                    {selectedBrands.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => updateFilter('brand', undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {filteredBrands.map((brand: string) => (
                      <div
                        key={brand}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBrandToggle(brand);
                        }}
                      >
                        <Checkbox
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={(checked) => {
                            handleBrandToggle(brand);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label className="flex-1 text-sm cursor-pointer">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Model Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.model}
            </label>
            <Select
              value={filters.model || 'all'}
              onValueChange={(value) => updateFilter('model', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.allModels} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allModels}</SelectItem>
                {filteredModels.map((model) => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter - Multi-Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {translations.status}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm font-normal"
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
                <div className="p-2 max-h-80 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-sm font-medium">Select Status</span>
                    {selectedStatuses.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => updateFilter('status', undefined)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {assetStatuses.map((status: string) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(status);
                        }}
                      >
                        <Checkbox
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={(checked) => {
                            handleStatusToggle(status);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label className="flex-1 text-sm cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                <SelectValue placeholder={translations.allAssignments} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{translations.allAssignments}</SelectItem>
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
                {translations.type}: {Array.isArray(filters.type) 
                  ? filters.type.length === 1 
                    ? filters.type[0] 
                    : `${filters.type.length} selected`
                  : filters.type}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('type', undefined)}
                />
              </Badge>
            )}
            {filters.brand && (
              <Badge variant="outline" className="gap-1">
                {translations.brand}: {Array.isArray(filters.brand)
                  ? filters.brand.length === 1
                    ? filters.brand[0]
                    : `${filters.brand.length} selected`
                  : filters.brand}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('brand', undefined)}
                />
              </Badge>
            )}
            {filters.model && (
              <Badge variant="outline" className="gap-1">
                {translations.model}: {filters.model}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('model', undefined)}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="outline" className="gap-1">
                {translations.status}: {Array.isArray(filters.status)
                  ? filters.status.length === 1
                    ? filters.status[0]
                    : `${filters.status.length} selected`
                  : filters.status}
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
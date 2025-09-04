import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Filter, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type CustomFilterType = 
  | 'pendingExit'
  | 'pendingAssetReturn'
  | 'offboardedWithAssets'
  | 'recentlyAdded'
  | 'fullTimeWithoutAssets'
  | 'overdueExit'
  | 'allWithAssets'
  | null;

interface EmployeeCustomFiltersProps {
  onFilterChange: (filter: CustomFilterType) => void;
  currentFilter: CustomFilterType;
  employeeCount?: number; // To show count in badge
  assetData?: any[]; // Pass assets if available
}

export default function EmployeeCustomFilters({
  onFilterChange,
  currentFilter,
  employeeCount,
  assetData
}: EmployeeCustomFiltersProps) {
  const { language } = useLanguage();

  const filters = [
    {
      id: 'pendingExit' as CustomFilterType,
      label: language === 'English' ? 'Pending Exit' : 'في انتظار المغادرة',
      description: language === 'English' 
        ? 'Active with exit date set' 
        : 'نشط مع تاريخ مغادرة محدد',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'pendingAssetReturn' as CustomFilterType,
      label: language === 'English' ? 'Pending Asset Return' : 'في انتظار إرجاع الأصول',
      description: language === 'English' 
        ? 'Active with exit date and assets' 
        : 'نشط مع تاريخ مغادرة وأصول',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      id: 'offboardedWithAssets' as CustomFilterType,
      label: language === 'English' ? 'Offboarded with Assets' : 'غادر مع أصول',
      description: language === 'English' 
        ? 'Inactive but has assets' 
        : 'غير نشط ولكن لديه أصول',
      color: 'bg-red-100 text-red-800'
    },
    {
      id: 'recentlyAdded' as CustomFilterType,
      label: language === 'English' ? 'Recently Added' : 'أضيف مؤخراً',
      description: language === 'English' 
        ? 'Joined within 30 days' 
        : 'انضم خلال 30 يوم',
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'fullTimeWithoutAssets' as CustomFilterType,
      label: language === 'English' ? 'Full-Time Without Assets' : 'دوام كامل بدون أصول',
      description: language === 'English' 
        ? 'Full-time employees with no assets' 
        : 'موظفو دوام كامل بدون أصول',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'overdueExit' as CustomFilterType,
      label: language === 'English' ? 'Overdue Exit' : 'مغادرة متأخرة',
      description: language === 'English' 
        ? 'Exit date passed but still active' 
        : 'تاريخ المغادرة تجاوز ولكن لا يزال نشط',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'allWithAssets' as CustomFilterType,
      label: language === 'English' ? 'All with Assets' : 'الكل مع أصول',
      description: language === 'English' 
        ? 'Anyone who has assets' 
        : 'أي شخص لديه أصول',
      color: 'bg-gray-100 text-gray-800'
    }
  ];

  const currentFilterData = filters.find(f => f.id === currentFilter);

return (
  <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between font-normal"
          role="combobox"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {currentFilter && currentFilterData ? 
              currentFilterData.label : 
              (language === 'English' ? 'Custom Filters' : 'مرشحات مخصصة')
            }
          </span>
          {currentFilter && (
            <Badge variant="secondary" className="ml-auto">
              {employeeCount || 0}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 max-h-[300px] overflow-y-auto">
        <DropdownMenuLabel>
          {language === 'English' ? 'Quick Filters' : 'المرشحات السريعة'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {filters.map((filter) => (
          <DropdownMenuItem
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className="flex items-start gap-2 p-3 cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {currentFilter === filter.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
                <span className="font-medium">{filter.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{filter.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
        
        {currentFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onFilterChange(null)}
              className="text-red-600 gap-2"
            >
              <X className="h-4 w-4" />
              {language === 'English' ? 'Clear Filter' : 'مسح المرشح'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  </>
);
}
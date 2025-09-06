// client/src/components/dashboard/AssetMetrics.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Laptop, 
  Monitor,
  HardDrive,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface AssetMetricsProps {
  data: any;
  isLoading: boolean;
}

export default function AssetMetrics({ data, isLoading }: AssetMetricsProps) {
  const { language } = useLanguage();
  
  const translations = {
    assets: language === 'English' ? 'Assets' : 'الأصول',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    available: language === 'English' ? 'Available' : 'متاح',
    inUse: language === 'English' ? 'In Use' : 'قيد الاستخدام',
    maintenance: language === 'English' ? 'Maintenance' : 'الصيانة',
    laptops: language === 'English' ? 'Laptops' : 'أجهزة محمولة',
    desktops: language === 'English' ? 'Desktops' : 'أجهزة مكتبية',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    critical: language === 'English' ? 'Critical' : 'حرج',
  };

  // Calculate utilization rate
  const utilizationRate = data?.total ? 
    Math.round(((data.total - (data.available || 0)) / data.total) * 100) : 0;

  // Determine health status
  const getHealthStatus = () => {
    if (data?.underMaintenance > 5) return 'warning';
    if (data?.critical > 0) return 'critical';
    if (utilizationRate > 90) return 'high';
    return 'good';
  };

  const healthStatus = getHealthStatus();

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-t-2xl">
          <Skeleton className="h-6 w-32 rounded-full" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-24 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300 group hover:scale-[1.02]">
      <CardHeader className="bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/20 rounded-t-2xl">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-500 flex items-center justify-center shadow-md3-1 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-title-medium">{translations.assets}</span>
          </div>
          {healthStatus !== 'good' && (
            <Badge 
              variant={healthStatus === 'critical' ? 'destructive' : 'secondary'}
              className="rounded-full px-2 py-1 flex items-center gap-1 animate-pulse"
            >
              <AlertCircle className="h-3 w-3" />
              {healthStatus === 'critical' ? translations.critical : utilizationRate + '%'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Main Metric */}
        <div 
          className="cursor-pointer group/main"
          onClick={() => window.location.href = '/assets'}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-display-small font-bold text-gray-900 dark:text-white group-hover/main:text-secondary-600 transition-colors">
              {data?.total || 0}
            </span>
            <span className="text-body-small text-gray-500">{translations.totalAssets}</span>
          </div>
          
          {/* Utilization Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Utilization</span>
              <span>{utilizationRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  utilizationRate > 90 ? 'bg-gradient-to-r from-error to-error-dark' :
                  utilizationRate > 70 ? 'bg-gradient-to-r from-warning to-warning-dark' :
                  'bg-gradient-to-r from-secondary-400 to-secondary-600'
                }`}
                style={{ width: `${utilizationRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Available */}
          <div 
            className="p-3 bg-surface-container-low rounded-xl hover:bg-success-light/50 dark:hover:bg-success/10 transition-all duration-200 cursor-pointer group/item"
            onClick={() => window.location.href = '/assets?status=Available'}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-label-medium text-gray-600 dark:text-gray-400">
                {translations.available}
              </span>
            </div>
            <p className="text-title-large font-semibold text-gray-900 dark:text-white">
              {data?.available || 0}
            </p>
          </div>

          {/* In Use */}
          <div 
            className="p-3 bg-surface-container-low rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 cursor-pointer group/item"
            onClick={() => window.location.href = '/assets?status=In Use'}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-label-medium text-gray-600 dark:text-gray-400">
                {translations.inUse}
              </span>
            </div>
            <p className="text-title-large font-semibold text-gray-900 dark:text-white">
              {data?.inUse || 0}
            </p>
          </div>
        </div>

        {/* Asset Types */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Laptops */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl hover:bg-tertiary-50 dark:hover:bg-tertiary-900/10 transition-all duration-200 cursor-pointer"
            onClick={() => window.location.href = '/assets?type=Laptop'}
          >
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4 text-tertiary-600" />
              <span className="text-body-medium">{translations.laptops}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-title-medium font-semibold">{data?.laptops || 0}</span>
              {data?.availableLaptops > 0 && (
                <Badge variant="secondary" className="rounded-full text-xs">
                  {data.availableLaptops} free
                </Badge>
              )}
            </div>
          </div>

          {/* Desktops */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-200 cursor-pointer"
            onClick={() => window.location.href = '/assets?type=Desktop'}
          >
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-indigo-600" />
              <span className="text-body-medium">{translations.desktops}</span>
            </div>
            <span className="text-title-medium font-semibold">{data?.desktops || 0}</span>
          </div>

          {/* Under Maintenance */}
          {(data?.underMaintenance || 0) > 0 && (
            <div 
              className="flex items-center justify-between p-2 rounded-xl bg-warning-light/50 dark:bg-warning/10 hover:bg-warning-light dark:hover:bg-warning/20 transition-all duration-200 cursor-pointer"
              onClick={() => window.location.href = '/assets?status=Maintenance'}
            >
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-warning-text animate-pulse" />
                <span className="text-body-medium">{translations.maintenance}</span>
              </div>
              <Badge variant="secondary" className="rounded-full bg-warning-light text-warning-text">
                {data?.underMaintenance || 0}
              </Badge>
            </div>
          )}
        </div>

        {/* View All Link */}
        <button
          onClick={() => window.location.href = '/assets'}
          className="w-full mt-4 py-2 text-center text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 text-label-large font-medium rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-900/10 transition-all duration-200"
        >
          {translations.viewAll} →
        </button>
      </CardContent>
    </Card>
  );
}
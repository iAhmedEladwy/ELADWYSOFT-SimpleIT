// client/src/components/dashboard/AssetMetrics.tsx
import { Laptop, Package, Wrench, DollarSign, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { Skeleton } from '@/components/ui/skeleton';

interface AssetMetricsProps {
  data?: {
    total: number;
    totalValue: number;
    availableLaptops: number;
    reservedLaptops: number;
    underMaintenance: number;
    changes: {
      monthly: string;
    };
  };
  isLoading: boolean;
}

export default function AssetMetrics({ data, isLoading }: AssetMetricsProps) {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();

  const translations = {
    assetOverview: language === 'English' ? 'Asset Overview' : 'نظرة عامة على الأصول',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    totalValue: language === 'English' ? 'Total Value' : 'القيمة الإجمالية',
    laptopStatus: language === 'English' ? 'Laptop Status' : 'حالة الحواسيب المحمولة',
    available: language === 'English' ? 'Available' : 'متاح',
    reserved: language === 'English' ? 'Reserved' : 'محجوز',
    underMaintenance: language === 'English' ? 'Under Maintenance' : 'تحت الصيانة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    laptops: language === 'English' ? 'Laptops' : 'حواسيب محمولة',
    fromLastMonth: language === 'English' ? 'from last month' : 'من الشهر الماضي',
  };

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLaptops = (data?.availableLaptops || 0) + (data?.reservedLaptops || 0);
  const laptopAvailabilityPercent = totalLaptops > 0 
    ? Math.round((data?.availableLaptops || 0) / totalLaptops * 100) 
    : 0;

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-secondary" />
          {translations.assetOverview}
        </CardTitle>
        <button
          onClick={() => window.location.href = '/assets'}
          className="text-sm text-primary hover:underline"
        >
          {translations.viewAll} →
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Assets Card */}
        <div 
          onClick={() => window.location.href = '/assets'}
          className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{translations.totalAssets}</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {data?.total || 0}
                </p>
                {data?.changes.monthly && (
                  <Badge variant={data.changes.monthly.startsWith('+') ? 'success' : 'destructive'}>
                    {data.changes.monthly}
                  </Badge>
                )}
              </div>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        {/* Total Value Card */}
        <div 
          onClick={() => window.location.href = '/assets'}
          className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{translations.totalValue}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(data?.totalValue || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        {/* Laptop Availability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{translations.laptopStatus}</span>
            <span className="text-gray-600 dark:text-gray-400">
              {data?.availableLaptops || 0} / {totalLaptops} {translations.available}
            </span>
          </div>
          <Progress value={laptopAvailabilityPercent} className="h-2" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div 
              onClick={() => window.location.href = '/assets?type=Laptop&status=Available'}
              className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">{translations.available}</span>
              </div>
              <span className="font-bold text-green-700 dark:text-green-400">
                {data?.availableLaptops || 0}
              </span>
            </div>
            <div 
              onClick={() => window.location.href = '/assets?type=Laptop&status=Reserved'}
              className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">{translations.reserved}</span>
              </div>
              <span className="font-bold text-yellow-700 dark:text-yellow-400">
                {data?.reservedLaptops || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Maintenance Status */}
        <div 
          onClick={() => window.location.href = '/assets?status=Maintenance'}
          className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">{translations.underMaintenance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-700 dark:text-orange-400">
                {data?.underMaintenance || 0}
              </span>
              {data?.underMaintenance && data.underMaintenance > 5 && (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  HIGH
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
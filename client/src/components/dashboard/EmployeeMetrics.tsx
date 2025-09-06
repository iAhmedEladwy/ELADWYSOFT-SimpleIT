// client/src/components/dashboard/EmployeeMetrics.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface EmployeeMetricsProps {
  data: any;
  isLoading: boolean;
}

export default function EmployeeMetrics({ data, isLoading }: EmployeeMetricsProps) {
  const { language } = useLanguage();
  
  const translations = {
    employees: language === 'English' ? 'Employees' : 'الموظفون',
    totalActive: language === 'English' ? 'Total Active' : 'إجمالي النشط',
    fullTime: language === 'English' ? 'Full-Time' : 'دوام كامل',
    partTime: language === 'English' ? 'Part-Time' : 'دوام جزئي',
    newThisMonth: language === 'English' ? 'New This Month' : 'جديد هذا الشهر',
    pendingOffboarding: language === 'English' ? 'Pending Offboarding' : 'في انتظار المغادرة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
  };

  // Calculate trend
  const getTrend = () => {
    if (!data?.previousMonth) return { value: 0, direction: 'neutral' };
    const current = data.totalActive || 0;
    const previous = data.previousMonth || current;
    const change = ((current - previous) / previous) * 100;
    
    return {
      value: Math.abs(Math.round(change)),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const trend = getTrend();

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-t-2xl">
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
      <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-t-2xl">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-md3-1 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-title-medium">{translations.employees}</span>
          </div>
          {trend.direction !== 'neutral' && (
            <Badge 
              variant={trend.direction === 'up' ? 'default' : 'secondary'}
              className="rounded-full px-2 py-1 flex items-center gap-1"
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Main Metric */}
        <div 
          className="cursor-pointer group/main"
          onClick={() => window.location.href = '/employees'}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-display-small font-bold text-gray-900 dark:text-white group-hover/main:text-primary-600 transition-colors">
              {data?.totalActive || 0}
            </span>
            <span className="text-body-small text-gray-500">{translations.totalActive}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min((data?.totalActive || 0) / 100 * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Sub-metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Full-Time */}
          <div 
            className="p-3 bg-surface-container-low rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 cursor-pointer group/item"
            onClick={() => window.location.href = '/employees?employmentTypeFilter=Full-time'}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-primary-500 group-hover/item:scale-110 transition-transform" />
              <span className="text-label-medium text-gray-600 dark:text-gray-400">
                {translations.fullTime}
              </span>
            </div>
            <p className="text-title-large font-semibold text-gray-900 dark:text-white">
              {data?.fullTime || 0}
            </p>
          </div>

          {/* Part-Time */}
          <div 
            className="p-3 bg-surface-container-low rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-900/10 transition-all duration-200 cursor-pointer group/item"
            onClick={() => window.location.href = '/employees?employmentTypeFilter=Part-time'}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-secondary-500 group-hover/item:scale-110 transition-transform" />
              <span className="text-label-medium text-gray-600 dark:text-gray-400">
                {translations.partTime}
              </span>
            </div>
            <p className="text-title-large font-semibold text-gray-900 dark:text-white">
              {data?.partTime || 0}
            </p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* New This Month */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl hover:bg-success-light/50 dark:hover:bg-success/10 transition-all duration-200 cursor-pointer"
            onClick={() => window.location.href = '/employees'}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-success" />
              <span className="text-body-medium">{translations.newThisMonth}</span>
            </div>
            <Badge variant="secondary" className="rounded-full bg-success-light text-success-text">
              +{data?.newThisMonth || 0}
            </Badge>
          </div>

          {/* Pending Offboarding */}
          {(data?.offboarding || 0) > 0 && (
            <div 
              className="flex items-center justify-between p-2 rounded-xl hover:bg-error-light/50 dark:hover:bg-error/10 transition-all duration-200 cursor-pointer animate-pulse"
              onClick={() => window.location.href = '/employees?statusFilter=Resigned'}
            >
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-error" />
                <span className="text-body-medium">{translations.pendingOffboarding}</span>
              </div>
              <Badge variant="destructive" className="rounded-full">
                {data?.offboarding || 0}
              </Badge>
            </div>
          )}
        </div>

        {/* View All Link */}
        <button
          onClick={() => window.location.href = '/employees'}
          className="w-full mt-4 py-2 text-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-label-large font-medium rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200"
        >
          {translations.viewAll} →
        </button>
      </CardContent>
    </Card>
  );
}
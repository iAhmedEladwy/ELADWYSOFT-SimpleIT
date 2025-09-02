// client/src/components/dashboard/EmployeeMetrics.tsx
import { Users, UserPlus, UserMinus, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeMetricsProps {
  data?: {
    total: number;
    fullTime: number;
    partTime: number;
    newThisMonth: number;
    pendingOffboarding: number;
    changes: {
      monthly: string;
      newHires: number;
    };
  };
  isLoading: boolean;
}

export default function EmployeeMetrics({ data, isLoading }: EmployeeMetricsProps) {
  const { language } = useLanguage();

  const translations = {
    employeeOverview: language === 'English' ? 'Employee Overview' : 'نظرة عامة على الموظفين',
    totalActive: language === 'English' ? 'Total Active' : 'إجمالي النشط',
    fullTime: language === 'English' ? 'Full-Time' : 'دوام كامل',
    partTime: language === 'English' ? 'Part-Time' : 'دوام جزئي',
    newThisMonth: language === 'English' ? 'New This Month' : 'جديد هذا الشهر',
    pendingOffboarding: language === 'English' ? 'Pending Offboarding' : 'في انتظار المغادرة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
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
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: translations.totalActive,
      value: data?.total || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: data?.changes.monthly,
      onClick: () => window.location.href = '/employees',
    },
    {
      label: translations.fullTime,
      value: data?.fullTime || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => window.location.href = '/employees?type=full-time',
    },
    {
      label: translations.partTime,
      value: data?.partTime || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => window.location.href = '/employees?type=part-time',
    },
    {
      label: translations.newThisMonth,
      value: data?.newThisMonth || 0,
      icon: UserPlus,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      badge: data?.newThisMonth ? 'new' : undefined,
      onClick: () => window.location.href = '/employees?filter=new',
    },
    {
      label: translations.pendingOffboarding,
      value: data?.pendingOffboarding || 0,
      icon: UserMinus,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      badge: data?.pendingOffboarding && data.pendingOffboarding > 0 ? 'alert' : undefined,
      onClick: () => window.location.href = '/employees?status=offboarding',
    },
  ];

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {translations.employeeOverview}
        </CardTitle>
        <button
          onClick={() => window.location.href = '/employees'}
          className="text-sm text-primary hover:underline"
        >
          {translations.viewAll} →
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                onClick={metric.onClick}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor} group-hover:scale-110 transition-transform`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {metric.value}
                      </p>
                      {metric.change && (
                        <span className={`text-xs ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {metric.change}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {metric.badge && (
                  <Badge 
                    variant={metric.badge === 'alert' ? 'destructive' : 'secondary'}
                    className={metric.badge === 'alert' ? 'animate-pulse' : ''}
                  >
                    {metric.badge === 'new' ? 'NEW' : 'ACTION'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Mini chart or trend indicator */}
        {data?.changes.monthly && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{translations.fromLastMonth}</span>
              <div className="flex items-center gap-1">
                <TrendingUp className={`h-4 w-4 ${data.changes.monthly.startsWith('+') ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`font-semibold ${data.changes.monthly.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {data.changes.monthly}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
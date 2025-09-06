// client/src/components/dashboard/TicketMetrics.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface TicketMetricsProps {
  data: any;
  isLoading: boolean;
}

export default function TicketMetrics({ data, isLoading }: TicketMetricsProps) {
  const { language } = useLanguage();
  
  const translations = {
    tickets: language === 'English' ? 'Tickets' : 'التذاكر',
    activeTickets: language === 'English' ? 'Active Tickets' : 'التذاكر النشطة',
    open: language === 'English' ? 'Open' : 'مفتوح',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    resolved: language === 'English' ? 'Resolved' : 'محلول',
    critical: language === 'English' ? 'Critical' : 'حرج',
    high: language === 'English' ? 'High' : 'عالي',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    low: language === 'English' ? 'Low' : 'منخفض',
    resolvedThisMonth: language === 'English' ? 'Resolved This Month' : 'تم حلها هذا الشهر',
    avgResolutionTime: language === 'English' ? 'Avg Resolution' : 'متوسط الحل',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    hours: language === 'English' ? 'hrs' : 'ساعة',
  };

  // Calculate resolution rate
  const resolutionRate = (data?.active && data?.resolvedThisMonth) ? 
    Math.round((data.resolvedThisMonth / (data.active + data.resolvedThisMonth)) * 100) : 0;

  // Get priority distribution
  const getPriorityBadge = (priority: string, count: number) => {
    const variants: Record<string, any> = {
      critical: { variant: 'destructive', icon: XCircle, animate: true },
      high: { variant: 'secondary', icon: AlertTriangle, animate: true },
      medium: { variant: 'outline', icon: Clock, animate: false },
      low: { variant: 'secondary', icon: CheckCircle, animate: false }
    };
    
    return variants[priority.toLowerCase()] || variants.medium;
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-tertiary-50 to-tertiary-100 dark:from-tertiary-900/20 dark:to-tertiary-800/20 rounded-t-2xl">
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
      <CardHeader className="bg-gradient-to-r from-tertiary-50 to-tertiary-100 dark:from-tertiary-900/20 dark:to-tertiary-800/20 rounded-t-2xl">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary-500 flex items-center justify-center shadow-md3-1 group-hover:scale-110 transition-transform duration-300">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="text-title-medium">{translations.tickets}</span>
          </div>
          {resolutionRate > 0 && (
            <Badge 
              variant="secondary"
              className="rounded-full px-2 py-1 flex items-center gap-1 bg-success-light text-success-text"
            >
              <CheckCircle className="h-3 w-3" />
              {resolutionRate}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Main Metric */}
        <div 
          className="cursor-pointer group/main"
          onClick={() => window.location.href = '/tickets?statusFilter=Open'}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-display-small font-bold text-gray-900 dark:text-white group-hover/main:text-tertiary-600 transition-colors">
              {data?.active || 0}
            </span>
            <span className="text-body-small text-gray-500">{translations.activeTickets}</span>
          </div>
          
          {/* Resolution Progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Resolution Rate</span>
              <span>{resolutionRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-tertiary-400 to-tertiary-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${resolutionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="grid grid-cols-2 gap-2">
          {['Critical', 'High', 'Medium', 'Low'].map((priority) => {
            const count = data?.byPriority?.[priority.toLowerCase()] || 0;
            const config = getPriorityBadge(priority, count);
            const Icon = config.icon;
            
            return (
              <div
                key={priority}
                className={`p-2 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 ${
                  priority === 'Critical' ? 'border-error-border bg-error-light/30 hover:bg-error-light' :
                  priority === 'High' ? 'border-warning-border bg-warning-light/30 hover:bg-warning-light' :
                  priority === 'Medium' ? 'border-primary-200 bg-primary-50/30 hover:bg-primary-50' :
                  'border-gray-200 bg-gray-50/30 hover:bg-gray-50'
                } dark:bg-opacity-10`}
                onClick={() => window.location.href = `/tickets?priorityFilter=${priority}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Icon className={`h-3 w-3 ${
                      priority === 'Critical' ? 'text-error' :
                      priority === 'High' ? 'text-warning-text' :
                      priority === 'Medium' ? 'text-primary-600' :
                      'text-gray-500'
                    } ${config.animate ? 'animate-pulse' : ''}`} />
                    <span className="text-label-small">{translations[priority.toLowerCase() as keyof typeof translations] || priority}</span>
                  </div>
                  <span className={`text-title-medium font-bold ${
                    priority === 'Critical' ? 'text-error' :
                    priority === 'High' ? 'text-warning-text' :
                    priority === 'Medium' ? 'text-primary-600' :
                    'text-gray-700'
                  }`}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Resolved This Month */}
          <div 
            className="flex items-center justify-between p-2 rounded-xl hover:bg-success-light/50 dark:hover:bg-success/10 transition-all duration-200 cursor-pointer"
            onClick={() => window.location.href = '/tickets?statusFilter=Resolved'}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-body-medium">{translations.resolvedThisMonth}</span>
            </div>
            <Badge variant="secondary" className="rounded-full bg-success-light text-success-text">
              {data?.resolvedThisMonth || 0}
            </Badge>
          </div>

          {/* Average Resolution Time */}
          {data?.avgResolutionTime && (
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-body-medium">{translations.avgResolutionTime}</span>
              </div>
              <Badge variant="outline" className="rounded-full">
                {data.avgResolutionTime} {translations.hours}
              </Badge>
            </div>
          )}

          {/* Urgent Indicator */}
          {(data?.byPriority?.critical || 0) > 0 && (
            <div className="mt-2 p-2 bg-error-light dark:bg-error/10 rounded-xl flex items-center gap-2 animate-pulse">
              <Zap className="h-4 w-4 text-error" />
              <span className="text-label-medium text-error-text font-medium">
                {data.byPriority.critical} critical tickets need attention
              </span>
            </div>
          )}
        </div>

        {/* View All Link */}
        <button
          onClick={() => window.location.href = '/tickets'}
          className="w-full mt-4 py-2 text-center text-tertiary-600 hover:text-tertiary-700 dark:text-tertiary-400 dark:hover:text-tertiary-300 text-label-large font-medium rounded-xl hover:bg-tertiary-50 dark:hover:bg-tertiary-900/10 transition-all duration-200"
        >
          {translations.viewAll} →
        </button>
      </CardContent>
    </Card>
  );
}
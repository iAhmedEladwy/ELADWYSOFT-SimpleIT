// client/src/components/dashboard/TicketMetrics.tsx
import { Ticket, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface TicketMetricsProps {
  data?: {
    active: number;
    resolvedThisMonth: number;
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    changes: {
      weekly: string;
    };
  };
  isLoading: boolean;
}

export default function TicketMetrics({ data, isLoading }: TicketMetricsProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const translations = {
    ticketOverview: language === 'English' ? 'Ticket Overview' : 'نظرة عامة على التذاكر',
    activeTickets: language === 'English' ? 'Active Tickets' : 'التذاكر النشطة',
    resolvedThisMonth: language === 'English' ? 'Resolved This Month' : 'تم حلها هذا الشهر',
    byPriority: language === 'English' ? 'By Priority' : 'حسب الأولوية',
    critical: language === 'English' ? 'Critical' : 'حرج',
    high: language === 'English' ? 'High' : 'عالي',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    low: language === 'English' ? 'Low' : 'منخفض',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    fromLastWeek: language === 'English' ? 'from last week' : 'من الأسبوع الماضي',
    resolutionRate: language === 'English' ? 'Resolution Rate' : 'معدل الحل',
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

  const totalTickets = data?.active || 0;
  const resolutionRate = totalTickets > 0 && data?.resolvedThisMonth
    ? Math.round((data.resolvedThisMonth / (totalTickets + data.resolvedThisMonth)) * 100)
    : 0;

  const priorityColors = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', badge: 'destructive' },
    high: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', badge: 'warning' },
    medium: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', badge: 'secondary' },
    low: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', badge: 'default' },
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5 text-accent" />
          {translations.ticketOverview}
        </CardTitle>
        <button
          onClick={() => navigate('/tickets')}
          className="text-sm text-primary hover:underline"
        >
          {translations.viewAll} →
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Tickets */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate('/tickets?status=active')}
            className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              {data?.changes.weekly && (
                <span className={`text-xs font-semibold ${data.changes.weekly.startsWith('+') ? 'text-red-600' : 'text-green-600'}`}>
                  {data.changes.weekly}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{translations.activeTickets}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data?.active || 0}
            </p>
          </div>
          
          <div 
            onClick={() => navigate('/tickets?status=resolved')}
            className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              {resolutionRate > 0 && (
                <span className="text-xs font-semibold text-green-600">
                  {resolutionRate}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{translations.resolvedThisMonth}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {data?.resolvedThisMonth || 0}
            </p>
          </div>
        </div>

        {/* Resolution Rate Progress */}
        {resolutionRate > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{translations.resolutionRate}</span>
              <span className="font-semibold">{resolutionRate}%</span>
            </div>
            <Progress value={resolutionRate} className="h-2" />
          </div>
        )}

        {/* Priority Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translations.byPriority}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data?.byPriority || {}).map(([priority, count]) => {
              const colors = priorityColors[priority as keyof typeof priorityColors];
              return (
                <div
                  key={priority}
                  onClick={() => navigate(`/tickets?priority=${priority}`)}
                  className={`p-2 rounded-lg ${colors.bg} hover:opacity-90 cursor-pointer transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {translations[priority as keyof typeof translations]}
                    </span>
                    <Badge variant={colors.badge as any} className="text-xs">
                      {count}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Alert */}
        {data?.byPriority.critical && data.byPriority.critical > 0 && (
          <div 
            onClick={() => navigate('/tickets?priority=critical')}
            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 animate-pulse cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                {data.byPriority.critical} Critical tickets need immediate attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
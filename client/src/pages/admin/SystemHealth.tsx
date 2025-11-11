import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/hooks/use-language';
import { 
  Activity, 
  ArrowLeft, 
  Database, 
  Users, 
  Server, 
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient'; 
import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ROLE_IDS } from '@shared/roles.config';

interface SystemHealthMetric {
  id: number;
  metricName: string;
  metricValue: string;
  metricType: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold?: string;
  recordedAt: string;
  description?: string;
  unit?: string;
}

interface SystemOverview {
  totalAssets: number;
  totalEmployees: number;
  totalTickets: number;
  activeConnections: number;
  databaseSize: string;
  uptime: string;
  lastBackup?: string;
}

export default function SystemHealth() {
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  // Translations
  const t = {
    title: language === 'English' ? 'System Health' : 'حالة النظام',
    description: language === 'English' ? 'Monitor system performance and health metrics' : 'مراقبة أداء النظام ومقاييس الحالة',
    backToAdminConsole: language === 'English' ? 'Back to Admin Console' : 'العودة لوحدة التحكم',
    systemOverview: language === 'English' ? 'System Overview' : 'نظرة عامة على النظام',
    databaseMetrics: language === 'English' ? 'Database Metrics' : 'مقاييس قاعدة البيانات',
    performanceMetrics: language === 'English' ? 'Performance Metrics' : 'مقاييس الأداء',
    systemMetrics: language === 'English' ? 'System Metrics' : 'مقاييس النظام',
    refreshMetrics: language === 'English' ? 'Refresh Metrics' : 'تحديث المقاييس',
    lastUpdated: language === 'English' ? 'Last Updated' : 'آخر تحديث',
    healthy: language === 'English' ? 'Healthy' : 'سليم',
    warning: language === 'English' ? 'Warning' : 'تحذير',
    critical: language === 'English' ? 'Critical' : 'حرج',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    totalEmployees: language === 'English' ? 'Total Employees' : 'إجمالي الموظفين',
    totalTickets: language === 'English' ? 'Total Tickets' : 'إجمالي التذاكر',
    activeConnections: language === 'English' ? 'Active Connections' : 'الاتصالات النشطة',
    databaseSize: language === 'English' ? 'Database Size' : 'حجم قاعدة البيانات',
    systemUptime: language === 'English' ? 'System Uptime' : 'وقت تشغيل النظام',
    lastBackup: language === 'English' ? 'Last Backup' : 'آخر نسخة احتياطية',
    never: language === 'English' ? 'Never' : 'أبداً',
    refreshing: language === 'English' ? 'Refreshing...' : 'جاري التحديث...',
    noMetrics: language === 'English' ? 'No metrics available' : 'لا توجد مقاييس متاحة',
    loadingMetrics: language === 'English' ? 'Loading metrics...' : 'جاري تحميل المقاييس...',
    errorLoading: language === 'English' ? 'Error loading metrics' : 'خطأ في تحميل المقاييس'
  };

    // Fetch system overview - CORRECTED
    const { data: systemOverview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
      queryKey: ['admin-system-overview'],
      queryFn: () => apiRequest('/api/admin/system-overview', 'GET'),
      refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Fetch system health metrics - CORRECTED
    const { data: healthMetrics = [], isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
      queryKey: ['admin-system-health'],
      queryFn: () => apiRequest('/api/admin/system-health', 'GET'),
      refetchInterval: 30000 // Refresh every 30 seconds
    });

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOverview(), refetchMetrics()]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'healthy': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <Badge className={colors[status] || colors['healthy']}>
        {t[status as keyof typeof t] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(
      language === 'English' ? 'en-US' : 'ar-SA',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  };

  const getMetricProgress = (metric: SystemHealthMetric) => {
    if (!metric.threshold) return null;
    
    const value = parseFloat(metric.metricValue);
    const threshold = parseFloat(metric.threshold);
    
    if (isNaN(value) || isNaN(threshold)) return null;
    
    const percentage = Math.min((value / threshold) * 100, 100);
    return percentage;
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Group metrics by type
  const databaseMetrics = healthMetrics.filter(m => m.metricType === 'database');
  const performanceMetrics = healthMetrics.filter(m => m.metricType === 'performance');
  const systemMetrics = healthMetrics.filter(m => m.metricType === 'system');

  return (
    <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN, ROLE_IDS.ADMIN]} fallback={<div>Access denied</div>}>
      <Helmet>
        <title>{t.title} - SimpleIT</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-muted-foreground">{t.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefreshAll}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t.refreshing : t.refreshMetrics}</span>
            </Button>
            <Link href="/admin-console">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>{t.backToAdminConsole}</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                {t.systemOverview}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="text-center py-8">{t.loadingMetrics}</div>
              ) : systemOverview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.totalAssets}</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {systemOverview.totalAssets.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.totalEmployees}</p>
                        <p className="text-2xl font-bold text-green-600">
                          {systemOverview.totalEmployees.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.totalTickets}</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {systemOverview.totalTickets.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Network className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.activeConnections}</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {systemOverview.activeConnections}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">{t.errorLoading}</div>
              )}
              
              {systemOverview && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{t.databaseSize}</span>
                    <span className="text-sm text-muted-foreground">{systemOverview.databaseSize}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{t.systemUptime}</span>
                    <span className="text-sm text-muted-foreground">{systemOverview.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{t.lastBackup}</span>
                    <span className="text-sm text-muted-foreground">
                      {systemOverview.lastBackup ? formatDate(systemOverview.lastBackup) : t.never}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Metrics */}
          {databaseMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t.databaseMetrics}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {databaseMetrics.map((metric) => {
                    const progress = getMetricProgress(metric);
                    return (
                      <Card key={metric.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(metric.status)}
                              <span className="font-medium text-sm">{metric.metricName}</span>
                            </div>
                            {getStatusBadge(metric.status)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">
                                {metric.metricValue}
                                {metric.unit && <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>}
                              </span>
                            </div>
                            
                            {progress !== null && (
                              <div className="space-y-1">
                                <Progress 
                                  value={progress} 
                                  className={`h-2 ${getProgressColor(metric.status)}`}
                                />
                                {metric.threshold && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0</span>
                                    <span>{metric.threshold}{metric.unit}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {metric.description && (
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          )}
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(metric.recordedAt)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {performanceMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  {t.performanceMetrics}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performanceMetrics.map((metric) => {
                    const progress = getMetricProgress(metric);
                    return (
                      <Card key={metric.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(metric.status)}
                              <span className="font-medium text-sm">{metric.metricName}</span>
                            </div>
                            {getStatusBadge(metric.status)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">
                                {metric.metricValue}
                                {metric.unit && <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>}
                              </span>
                            </div>
                            
                            {progress !== null && (
                              <div className="space-y-1">
                                <Progress 
                                  value={progress} 
                                  className={`h-2 ${getProgressColor(metric.status)}`}
                                />
                                {metric.threshold && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0</span>
                                    <span>{metric.threshold}{metric.unit}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {metric.description && (
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          )}
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(metric.recordedAt)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Metrics (if any) */}
          {systemMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MemoryStick className="h-5 w-5" />
                  {t.systemMetrics}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemMetrics.map((metric) => {
                    const progress = getMetricProgress(metric);
                    return (
                      <Card key={metric.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(metric.status)}
                              <span className="font-medium text-sm">{metric.metricName}</span>
                            </div>
                            {getStatusBadge(metric.status)}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold">
                                {metric.metricValue}
                                {metric.unit && <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>}
                              </span>
                            </div>
                            
                            {progress !== null && (
                              <div className="space-y-1">
                                <Progress 
                                  value={progress} 
                                  className={`h-2 ${getProgressColor(metric.status)}`}
                                />
                                {metric.threshold && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0</span>
                                    <span>{metric.threshold}{metric.unit}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {metric.description && (
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                          )}
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(metric.recordedAt)}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Metrics State */}
          {!metricsLoading && healthMetrics.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t.noMetrics}</p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {metricsLoading && (
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{t.loadingMetrics}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
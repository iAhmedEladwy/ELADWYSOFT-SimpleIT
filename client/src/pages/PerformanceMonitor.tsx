import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { 
  Activity, 
  TrendingUp,
  Clock,
  Zap,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient'; 
import { Helmet } from 'react-helmet-async';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ROLE_IDS } from '@shared/roles.config';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface EndpointMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  totalRequests: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
}

interface PerformanceData {
  endpoints: EndpointMetric[];
  slowQueries: Array<{
    query: string;
    avgTime: number;
    executions: number;
  }>;
  recentTrends: Array<{
    timestamp: string;
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  }>;
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
    cacheHitRatio: number;
  };
}

export default function PerformanceMonitor() {
  const { language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  // Translations
  const t = {
    title: language === 'English' ? 'Performance Monitor' : 'مراقب الأداء',
    description: language === 'English' ? 'Monitor application performance and identify bottlenecks' : 'مراقبة أداء التطبيق وتحديد الاختناقات',
    refreshMetrics: language === 'English' ? 'Refresh Metrics' : 'تحديث المقاييس',
    refreshing: language === 'English' ? 'Refreshing...' : 'جاري التحديث...',
    endpointPerformance: language === 'English' ? 'Endpoint Performance' : 'أداء نقاط النهاية',
    slowQueries: language === 'English' ? 'Slow Database Queries' : 'استعلامات قاعدة البيانات البطيئة',
    performanceTrends: language === 'English' ? 'Performance Trends' : 'اتجاهات الأداء',
    systemMetrics: language === 'English' ? 'System Metrics' : 'مقاييس النظام',
    endpoint: language === 'English' ? 'Endpoint' : 'نقطة النهاية',
    avgResponseTime: language === 'English' ? 'Avg Response Time' : 'متوسط وقت الاستجابة',
    requests: language === 'English' ? 'Requests' : 'الطلبات',
    errorRate: language === 'English' ? 'Error Rate' : 'معدل الخطأ',
    p50: language === 'English' ? 'P50' : 'P50',
    p95: language === 'English' ? 'P95' : 'P95',
    p99: language === 'English' ? 'P99' : 'P99',
    query: language === 'English' ? 'Query' : 'الاستعلام',
    executionTime: language === 'English' ? 'Execution Time' : 'وقت التنفيذ',
    executions: language === 'English' ? 'Executions' : 'مرات التنفيذ',
    cpuUsage: language === 'English' ? 'CPU Usage' : 'استخدام المعالج',
    memoryUsage: language === 'English' ? 'Memory Usage' : 'استخدام الذاكرة',
    activeConnections: language === 'English' ? 'Active Connections' : 'الاتصالات النشطة',
    cacheHitRatio: language === 'English' ? 'Cache Hit Ratio' : 'نسبة إصابة ذاكرة التخزين المؤقت',
    noData: language === 'English' ? 'No performance data available' : 'لا توجد بيانات أداء متاحة',
    loading: language === 'English' ? 'Loading performance metrics...' : 'جاري تحميل مقاييس الأداء...',
    timeRange: language === 'English' ? 'Time Range' : 'النطاق الزمني',
    lastHour: language === 'English' ? 'Last Hour' : 'آخر ساعة',
    last6Hours: language === 'English' ? 'Last 6 Hours' : 'آخر 6 ساعات',
    last24Hours: language === 'English' ? 'Last 24 Hours' : 'آخر 24 ساعة',
    last7Days: language === 'English' ? 'Last 7 Days' : 'آخر 7 أيام',
  };

  // Fetch performance data
  const { data: performanceData, isLoading, refetch } = useQuery({
    queryKey: ['performance-metrics', timeRange],
    queryFn: () => apiRequest(`/api/developer-tools/performance?range=${timeRange}`, 'GET'),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <RoleGuard allowedRoles={[ROLE_IDS.SUPER_ADMIN]} fallback={<div>Access denied</div>}>
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
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{t.timeRange}:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="1h">{t.lastHour}</option>
                <option value="6h">{t.last6Hours}</option>
                <option value="24h">{t.last24Hours}</option>
                <option value="7d">{t.last7Days}</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? t.refreshing : t.refreshMetrics}</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        ) : !performanceData ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{t.noData}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* System Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.cpuUsage}</p>
                      <p className={`text-3xl font-bold ${getStatusColor((performanceData as any).systemMetrics?.cpuUsage || 0, { good: 50, warning: 80 })}`}>
                        {(performanceData as any).systemMetrics?.cpuUsage || 0}%
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.memoryUsage}</p>
                      <p className={`text-3xl font-bold ${getStatusColor((performanceData as any).systemMetrics?.memoryUsage || 0, { good: 60, warning: 85 })}`}>
                        {(performanceData as any).systemMetrics?.memoryUsage || 0}%
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.activeConnections}</p>
                      <p className="text-3xl font-bold">
                        {(performanceData as any).systemMetrics?.activeConnections || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.cacheHitRatio}</p>
                      <p className={`text-3xl font-bold ${getStatusColor(100 - ((performanceData as any).systemMetrics?.cacheHitRatio || 95), { good: 10, warning: 20 })}`}>
                        {(performanceData as any).systemMetrics?.cacheHitRatio || 0}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-teal-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t.performanceTrends}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={(performanceData as any).recentTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="avgResponseTime" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                      name={t.avgResponseTime + ' (ms)'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requestsPerMinute" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                      name={t.requests + '/min'}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Endpoint Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  {t.endpointPerformance}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">{t.endpoint}</th>
                        <th className="text-left p-2">{t.avgResponseTime}</th>
                        <th className="text-left p-2">{t.requests}</th>
                        <th className="text-left p-2">{t.errorRate}</th>
                        <th className="text-left p-2">{t.p95}</th>
                        <th className="text-left p-2">{t.p99}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((performanceData as any).endpoints || []).map((endpoint: EndpointMetric, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <Badge variant="outline">{endpoint.method}</Badge>
                            <span className="ml-2 font-mono text-sm">{endpoint.endpoint}</span>
                          </td>
                          <td className={`p-2 font-semibold ${getStatusColor(endpoint.avgResponseTime, { good: 200, warning: 500 })}`}>
                            {endpoint.avgResponseTime}ms
                          </td>
                          <td className="p-2">{endpoint.totalRequests.toLocaleString()}</td>
                          <td className="p-2">
                            <span className={getStatusColor(endpoint.errorRate, { good: 1, warning: 5 })}>
                              {endpoint.errorRate.toFixed(2)}%
                            </span>
                          </td>
                          <td className="p-2 text-gray-600">{endpoint.p95}ms</td>
                          <td className="p-2 text-gray-600">{endpoint.p99}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Slow Queries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t.slowQueries}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {((performanceData as any).slowQueries || []).map((query: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="flex items-start justify-between">
                        <code className="text-sm font-mono text-gray-700 flex-1">{query.query}</code>
                        <div className="text-right ml-4">
                          <p className={`font-bold ${getStatusColor(query.avgTime, { good: 100, warning: 500 })}`}>
                            {query.avgTime}ms
                          </p>
                          <p className="text-sm text-gray-500">{query.executions} executions</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

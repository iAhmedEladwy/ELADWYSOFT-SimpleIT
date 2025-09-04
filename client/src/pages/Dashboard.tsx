import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Tabs,
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Bell,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  Calendar
} from 'lucide-react';

// Import new dashboard components
import QuickActions from '@/components/dashboard/QuickActions';
import EmployeeMetrics from '@/components/dashboard/EmployeeMetrics';
import AssetMetrics from '@/components/dashboard/AssetMetrics';
import TicketMetrics from '@/components/dashboard/TicketMetrics';
import EnhancedDepartmentDistribution from '@/components/dashboard/EnhancedDepartmentDistribution';
import RecentAssets from '@/components/dashboard/RecentAssets';
import RecentTickets from '@/components/dashboard/RecentTickets';
import Notifications from '@/components/dashboard/Notifications';

// Import legacy components for backward compatibility
import StatsCard from '@/components/dashboard/StatsCard';
import AssetsByType from '@/components/dashboard/AssetsByType';

export default function Dashboard() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Get translations based on language
  const translations = {
    dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    welcome: language === 'English' 
      ? 'IT Asset Management System - Real-time Overview' 
      : 'نظام إدارة أصول تكنولوجيا المعلومات - نظرة عامة في الوقت الفعلي',
    overview: language === 'English' ? 'Overview' : 'نظرة عامة',
    analytics: language === 'English' ? 'Analytics' : 'التحليلات',
    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    activity: language === 'English' ? 'Activity' : 'النشاط',
    lastUpdated: language === 'English' ? 'Last updated' : 'آخر تحديث',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    autoRefresh: language === 'English' ? 'Auto-refresh' : 'تحديث تلقائي',
    exportData: language === 'English' ? 'Export Data' : 'تصدير البيانات',
    mainMetrics: language === 'English' ? 'Main Metrics' : 'المقاييس الرئيسية',
    recentActivity: language === 'English' ? 'Recent Activity' : 'النشاط الأخير',
    departmentInsights: language === 'English' ? 'Department Insights' : 'رؤى الأقسام',
    assetDistribution: language === 'English' ? 'Asset Distribution' : 'توزيع الأصول',
    maintenanceSchedule: language === 'English' ? 'Maintenance Schedule' : 'جدول الصيانة',
    upcomingMaintenance: language === 'English' ? 'Upcoming Maintenance' : 'الصيانة القادمة',
    overdueMaintenance: language === 'English' ? 'Overdue Maintenance' : 'صيانة متأخرة',
    today: language === 'English' ? 'Today' : 'اليوم',
    thisWeek: language === 'English' ? 'This Week' : 'هذا الأسبوع',
    thisMonth: language === 'English' ? 'This Month' : 'هذا الشهر',
  };

  // Fetch dashboard data with enhanced endpoint
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
  });

  // Handle auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
        setLastRefresh(new Date());
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  // Handle export data
  const handleExportData = () => {
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Format time since last update
  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            {translations.dashboard}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{translations.welcome}</p>
        </div>
        
        {/* Dashboard Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {translations.lastUpdated}: {formatTimeSince(lastRefresh)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {translations.refresh}
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            {translations.autoRefresh}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {translations.exportData}
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActions data={dashboardData?.quickActions} isLoading={isLoading} />

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {translations.overview}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            {translations.analytics}
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            {translations.activity}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            {translations.notifications}
            {dashboardData?.notifications?.unread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {dashboardData.notifications.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Metrics Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.mainMetrics}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <EmployeeMetrics data={dashboardData?.employees} isLoading={isLoading} />
              <AssetMetrics data={dashboardData?.assets} isLoading={isLoading} />
              <TicketMetrics data={dashboardData?.tickets} isLoading={isLoading} />
            </div>
          </div>

          {/* Department Distribution */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.departmentInsights}
            </h2>
            <EnhancedDepartmentDistribution 
              data={dashboardData?.departmentDistribution} 
              isLoading={isLoading} 
            />
          </div>

          {/* Recent Activity Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.recentActivity}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentAssets 
                assets={dashboardData?.assets?.recentlyUpdated || dashboardData?.recentAssets || []} 
                isLoading={isLoading}
              />
              <RecentTickets 
                tickets={dashboardData?.tickets?.recent || dashboardData?.recentTickets || []} 
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Maintenance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {translations.maintenanceSchedule}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(dashboardData?.maintenance || {}).map(([status, count]) => (
                    <div
                      key={status}
                      className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md
                        ${status === 'overdue' ? 'bg-red-50 dark:bg-red-900/20' :
                          status === 'scheduled' ? 'bg-blue-50 dark:bg-blue-900/20' :
                          status === 'inProgress' ? 'bg-orange-50 dark:bg-orange-900/20' :
                          'bg-green-50 dark:bg-green-900/20'}`}
                      onClick={() => window.location.href = `/assets?maintenanceStatus=${status}`}
                    >
                      <p className="text-sm font-medium capitalize">{status}</p>
                      <p className="text-2xl font-bold mt-1">{count as number}</p>
                      {status === 'overdue' && (count as number) > 0 && (
                        <Badge variant="destructive" className="mt-2 animate-pulse">
                          Action Required
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Distribution by Type */}
            <AssetsByType 
              assetsByType={dashboardData?.assets?.byType || dashboardData?.assetsByType || {}} 
              isLoading={isLoading}
            />
            
            {/* Enhanced Stats Cards */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Performance Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <span className="text-sm font-medium">Asset Utilization Rate</span>
                        <Badge variant="secondary">
                          {dashboardData?.assets?.total && dashboardData?.assets?.availableLaptops
                            ? `${Math.round(((dashboardData.assets.total - dashboardData.assets.availableLaptops) / dashboardData.assets.total) * 100)}%`
                            : '0%'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <span className="text-sm font-medium">Ticket Resolution Rate</span>
                        <Badge variant="secondary">
                          {dashboardData?.tickets?.resolvedThisMonth && dashboardData?.tickets?.active
                            ? `${Math.round((dashboardData.tickets.resolvedThisMonth / (dashboardData.tickets.active + dashboardData.tickets.resolvedThisMonth)) * 100)}%`
                            : '0%'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span className="text-sm font-medium">New Hire Onboarding</span>
                        <Badge variant="secondary">
                          {dashboardData?.employees?.newThisMonth || 0} this month
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <span className="text-sm font-medium">Assets Needing Attention</span>
                        <Badge variant={dashboardData?.maintenance?.overdue > 0 ? 'destructive' : 'secondary'}>
                          {(dashboardData?.maintenance?.overdue || 0) + (dashboardData?.assets?.underMaintenance || 0)}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Department Distribution (repeated for analytics) */}
          <EnhancedDepartmentDistribution 
            data={dashboardData?.departmentDistribution} 
            isLoading={isLoading} 
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Assets with more details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recently Updated Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(dashboardData?.assets?.recentlyUpdated || []).slice(0, 10).map((asset: any) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => window.location.href = `/assets/${asset.id}`}
                      >
                        <div>
                          <p className="font-medium">{asset.assetId}</p>
                          <p className="text-sm text-gray-500">{asset.type} - {asset.status}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(asset.updatedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Tickets with more details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Ticket Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(dashboardData?.tickets?.recent || dashboardData?.recentTickets || []).map((ticket: any) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => window.location.href = `/tickets/${ticket.id}`}
                      >
                        <div>
                          <p className="font-medium">#{ticket.ticketId}</p>
                          <p className="text-sm text-gray-500">{ticket.priority} - {ticket.status}</p>
                        </div>
                        <Badge 
                          variant={
                            ticket.priority === 'Critical' ? 'destructive' :
                            ticket.priority === 'High' ? 'warning' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    {/* Sample timeline items - you can populate with real data */}
                    <div className="space-y-4">
                      {dashboardData?.employees?.newThisMonth > 0 && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dashboardData.employees.newThisMonth} new employees joined</p>
                            <p className="text-sm text-gray-500">{translations.thisMonth}</p>
                          </div>
                        </div>
                      )}
                      {dashboardData?.tickets?.resolvedThisMonth > 0 && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dashboardData.tickets.resolvedThisMonth} tickets resolved</p>
                            <p className="text-sm text-gray-500">{translations.thisMonth}</p>
                          </div>
                        </div>
                      )}
                      {dashboardData?.maintenance?.overdue > 0 && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dashboardData.maintenance.overdue} assets have overdue maintenance</p>
                            <p className="text-sm text-gray-500">{translations.today}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Notifications />
        </TabsContent>
      </Tabs>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EmployeeForm from '@/components/employees/EmployeeForm';
import AssetForm from '@/components/assets/AssetForm';
import TicketForm from '@/components/tickets/TicketForm';
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
  Calendar,
  ChevronUp,
  ChevronDown
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

// Import MD3 styles
import { MD3 } from '@/styles/material-design';

export default function Dashboard() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);

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

  // Handler functions for quick actions
  const handleAddEmployee = () => {
    setShowEmployeeDialog(true);
  };
  
  const handleAddAsset = () => {
    setShowAssetDialog(true);
  };
  
  const handleOpenTicket = () => {
    setShowTicketDialog(true);
  };
  
  // Submit handlers
  const handleEmployeeSubmit = async (data: any) => {
    try {
      setShowEmployeeDialog(false);
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' 
          ? 'Employee added successfully' 
          : 'تمت إضافة الموظف بنجاح',
      });
      refetch();
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };
  
  const handleAssetSubmit = async (data: any) => {
    try {
      setShowAssetDialog(false);
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' 
          ? 'Asset added successfully' 
          : 'تمت إضافة الأصل بنجاح',
      });
      refetch();
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };
  
  const handleTicketSubmit = async (data: any) => {
    try {
      setShowTicketDialog(false);
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' 
          ? 'Ticket opened successfully' 
          : 'تم فتح التذكرة بنجاح',
      });
      refetch();
    } catch (error) {
      console.error('Error opening ticket:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
    toast({
      title: language === 'English' ? 'Dashboard Refreshed' : 'تم تحديث لوحة التحكم',
      description: language === 'English' 
        ? 'All data has been updated' 
        : 'تم تحديث جميع البيانات',
    });
  };

  const handleExportData = () => {
    toast({
      title: language === 'English' ? 'Exporting Data' : 'تصدير البيانات',
      description: language === 'English' 
        ? 'Preparing your dashboard report...' 
        : 'جاري إعداد تقرير لوحة التحكم...',
    });
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
        setLastRefresh(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-6 space-y-6 animate-fadeIn">
        {/* Enhanced Header with MD3 Styling */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md3-2 p-6 backdrop-blur-sm bg-opacity-95">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-display-small font-medium bg-gradient-to-r from-indigo-600 to-pink-600 gradient-text">
                {translations.dashboard}
              </h1>
              <p className="text-body-large text-gray-600 dark:text-gray-400 mt-1">
                {translations.welcome}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-surface-container-low rounded-full px-4 py-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                {translations.lastUpdated}: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button
                onClick={handleRefresh}
                size="sm"
                className="rounded-full shadow-md3-1 hover:shadow-md3-3 transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {translations.refresh}
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="rounded-full shadow-md3-1 hover:shadow-md3-3 transition-all duration-300"
              >
                <Activity className="h-4 w-4 mr-2" />
                {translations.autoRefresh}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="rounded-full shadow-md3-1 hover:shadow-md3-3 transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                {translations.exportData}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar with MD3 Styling */}
        <div className="animate-slideIn" style={{ animationDelay: '100ms' }}>
          <QuickActions 
            data={dashboardData?.quickActions} 
            isLoading={isLoading} 
            onAddEmployee={handleAddEmployee} 
            onAddAsset={handleAddAsset} 
            onOpenTicket={handleOpenTicket}
          />
        </div>

        {/* Main Dashboard Tabs with MD3 Styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-surface-container-low rounded-full p-1 inline-flex gap-1 shadow-md3-1">
            <TabsTrigger 
              value="overview" 
              className="rounded-full px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md3-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              {translations.overview}
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="rounded-full px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md3-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {translations.analytics}
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-full px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md3-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700"
            >
              <Activity className="h-4 w-4 mr-2" />
              {translations.activity}
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="relative rounded-full px-6 py-2.5 transition-all duration-300 data-[state=active]:bg-primary-500 data-[state=active]:text-white data-[state=active]:shadow-md3-2 data-[state=inactive]:hover:bg-gray-200 dark:data-[state=inactive]:hover:bg-gray-700"
            >
              <Bell className="h-4 w-4 mr-2" />
              {translations.notifications}
              {dashboardData?.notifications?.unread > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs rounded-full animate-bounceIn"
                >
                  {dashboardData.notifications.unread}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab with MD3 Enhancements */}
          <TabsContent value="overview" className="space-y-6 animate-fadeIn">
            {/* Main Metrics Section */}
            <div className="bg-surface-container rounded-3xl p-6">
              <h2 className="text-headline-medium font-medium mb-6 text-gray-800 dark:text-gray-200">
                {translations.mainMetrics}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="animate-slideIn" style={{ animationDelay: '200ms' }}>
                  <EmployeeMetrics data={dashboardData?.employees} isLoading={isLoading} />
                </div>
                <div className="animate-slideIn" style={{ animationDelay: '300ms' }}>
                  <AssetMetrics data={dashboardData?.assets} isLoading={isLoading} />
                </div>
                <div className="animate-slideIn" style={{ animationDelay: '400ms' }}>
                  <TicketMetrics data={dashboardData?.tickets} isLoading={isLoading} />
                </div>
              </div>
            </div>

            {/* Department Distribution */}
            <div className="animate-slideIn" style={{ animationDelay: '500ms' }}>
              <EnhancedDepartmentDistribution 
                data={dashboardData?.departmentDistribution} 
                isLoading={isLoading} 
              />
            </div>

            {/* Recent Activity Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="animate-slideIn" style={{ animationDelay: '600ms' }}>
                <RecentAssets 
                  assets={dashboardData?.recentAssets || dashboardData?.assets?.recent} 
                  isLoading={isLoading} 
                />
              </div>
              <div className="animate-slideIn" style={{ animationDelay: '700ms' }}>
                <RecentTickets 
                  tickets={dashboardData?.recentTickets || dashboardData?.tickets?.recent} 
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Maintenance Overview with MD3 Card Styling */}
            {dashboardData?.maintenance && (
              <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300 animate-slideIn" style={{ animationDelay: '800ms' }}>
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                  <CardTitle className="text-title-large">{translations.maintenanceSchedule}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl animate-gentlePulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(dashboardData.maintenance).map(([status, count], index) => (
                        <div
                          key={status}
                          className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md3-3 animate-scaleIn ${
                            status === 'overdue' ? 'bg-error-light dark:bg-red-900/20' :
                            status === 'scheduled' ? 'bg-primary-100 dark:bg-primary-900/20' :
                            status === 'inProgress' ? 'bg-warning-light dark:bg-orange-900/20' :
                            'bg-success-light dark:bg-green-900/20'
                          }`}
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={() => window.location.href = `/assets?maintenanceDue=${status}`}
                        >
                          <p className="text-label-large font-medium capitalize">{status}</p>
                          <p className="text-display-small font-bold mt-2">{count as number}</p>
                          {status === 'overdue' && (count as number) > 0 && (
                            <Badge variant="destructive" className="mt-3 animate-pulse rounded-full">
                              Action Required
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab with MD3 Enhancements */}
          <TabsContent value="analytics" className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Distribution by Type */}
              <div className="animate-slideIn">
                <AssetsByType 
                  assetsByType={dashboardData?.assets?.byType || dashboardData?.assetsByType || {}} 
                  isLoading={isLoading}
                />
              </div>
              
              {/* Enhanced Stats Cards with MD3 */}
              <div className="space-y-4">
                <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                    <CardTitle className="text-title-large">Key Performance Indicators</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6">
                    {isLoading ? (
                      [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl hover:shadow-md3-1 transition-all">
                          <span className="text-body-medium font-medium">Asset Utilization Rate</span>
                          <Badge className="rounded-full bg-primary-100 text-primary-700">
                            {dashboardData?.assets?.total && dashboardData?.assets?.availableLaptops
                              ? `${Math.round(((dashboardData.assets.total - dashboardData.assets.availableLaptops) / dashboardData.assets.total) * 100)}%`
                              : '0%'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-success-light dark:bg-green-900/20 rounded-2xl hover:shadow-md3-1 transition-all">
                          <span className="text-body-medium font-medium">Ticket Resolution Rate</span>
                          <Badge className="rounded-full bg-success-light text-success-text">
                            {dashboardData?.tickets?.resolvedThisMonth && dashboardData?.tickets?.active
                              ? `${Math.round((dashboardData.tickets.resolvedThisMonth / (dashboardData.tickets.active + dashboardData.tickets.resolvedThisMonth)) * 100)}%`
                              : '0%'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-tertiary-100 dark:bg-teal-900/20 rounded-2xl hover:shadow-md3-1 transition-all">
                          <span className="text-body-medium font-medium">New Hire Onboarding</span>
                          <Badge className="rounded-full bg-tertiary-100 text-tertiary-700">
                            {dashboardData?.employees?.newThisMonth || 0} this month
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-warning-light dark:bg-orange-900/20 rounded-2xl hover:shadow-md3-1 transition-all">
                          <span className="text-body-medium font-medium">Assets Needing Attention</span>
                          <Badge 
                            variant={dashboardData?.maintenance?.overdue > 0 ? 'destructive' : 'secondary'}
                            className="rounded-full"
                          >
                            {(dashboardData?.maintenance?.overdue || 0) + (dashboardData?.assets?.underMaintenance || 0)}
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Department Distribution for Analytics */}
            <EnhancedDepartmentDistribution 
              data={dashboardData?.departmentDistribution} 
              isLoading={isLoading} 
            />
          </TabsContent>

          {/* Activity Tab with MD3 Timeline */}
          <TabsContent value="activity" className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Assets with enhanced styling */}
              <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                  <CardTitle className="text-title-large">Recently Updated Assets</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : dashboardData?.recentAssets?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentAssets.slice(0, 5).map((asset: any, index: number) => (
                        <div 
                          key={asset.id} 
                          className="p-4 bg-surface-container-low rounded-2xl hover:shadow-md3-2 transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-slideIn"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => window.location.href = `/assets/${asset.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-body-large">{asset.assetTag}</p>
                              <p className="text-body-small text-gray-500">{asset.type} - {asset.brand}</p>
                            </div>
                            <Badge 
                              className="rounded-full"
                              variant={
                                asset.status === 'Available' ? 'default' :
                                asset.status === 'In Use' ? 'secondary' :
                                'outline'
                              }
                            >
                              {asset.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent assets</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Tickets with enhanced styling */}
              <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                  <CardTitle className="text-title-large">Recent Tickets</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : dashboardData?.recentTickets?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentTickets.slice(0, 5).map((ticket: any, index: number) => (
                        <div 
                          key={ticket.id} 
                          className="p-4 bg-surface-container-low rounded-2xl hover:shadow-md3-2 transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-slideIn"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => window.location.href = `/tickets/${ticket.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-body-large">{ticket.title}</p>
                              <p className="text-body-small text-gray-500">{ticket.category}</p>
                            </div>
                            <Badge 
                              variant={
                                ticket.priority === 'Critical' ? 'destructive' :
                                ticket.priority === 'High' ? 'warning' :
                                'secondary'
                              }
                              className="rounded-full ml-2"
                            >
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No recent tickets</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline with MD3 Styling */}
            <Card className="rounded-2xl shadow-md3-2 hover:shadow-md3-3 transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-tertiary-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                <CardTitle className="text-title-large">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-secondary-200 to-tertiary-200"></div>
                      <div className="space-y-6">
                        {dashboardData?.employees?.newThisMonth > 0 && (
                          <div className="flex gap-4 animate-slideIn">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center shadow-md3-1">
                              <div className="w-3 h-3 rounded-full bg-primary-500 animate-pulse"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-body-large">{dashboardData.employees.newThisMonth} new employees joined</p>
                              <p className="text-body-small text-gray-500">{translations.thisMonth}</p>
                            </div>
                          </div>
                        )}
                        {dashboardData?.tickets?.resolvedThisMonth > 0 && (
                          <div className="flex gap-4 animate-slideIn" style={{ animationDelay: '100ms' }}>
                            <div className="w-8 h-8 rounded-full bg-success-light dark:bg-green-900 flex items-center justify-center shadow-md3-1">
                              <div className="w-3 h-3 rounded-full bg-success animate-pulse"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-body-large">{dashboardData.tickets.resolvedThisMonth} tickets resolved</p>
                              <p className="text-body-small text-gray-500">{translations.thisMonth}</p>
                            </div>
                          </div>
                        )}
                        {dashboardData?.maintenance?.overdue > 0 && (
                          <div className="flex gap-4 animate-slideIn" style={{ animationDelay: '200ms' }}>
                            <div className="w-8 h-8 rounded-full bg-error-light dark:bg-red-900 flex items-center justify-center shadow-md3-1">
                              <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-body-large">{dashboardData.maintenance.overdue} assets overdue for maintenance</p>
                              <p className="text-body-small text-gray-500">Immediate attention required</p>
                            </div>
                          </div>
                        )}
                        {dashboardData?.assets?.newThisMonth > 0 && (
                          <div className="flex gap-4 animate-slideIn" style={{ animationDelay: '300ms' }}>
                            <div className="w-8 h-8 rounded-full bg-tertiary-100 dark:bg-teal-900 flex items-center justify-center shadow-md3-1">
                              <div className="w-3 h-3 rounded-full bg-tertiary-500 animate-pulse"></div>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-body-large">{dashboardData.assets.newThisMonth} new assets added</p>
                              <p className="text-body-small text-gray-500">{translations.thisMonth}</p>
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

          {/* Notifications Tab with MD3 Styling */}
          <TabsContent value="notifications" className="animate-fadeIn">
            <Notifications 
              notifications={dashboardData?.notifications} 
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>

        {/* Dialogs for Quick Actions - Preserved Original Functionality */}
        <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
          <DialogContent className="rounded-3xl shadow-md3-4">
            <DialogHeader>
              <DialogTitle className="text-headline-small">Add New Employee</DialogTitle>
            </DialogHeader>
            <EmployeeForm 
              onSubmit={handleEmployeeSubmit}
              onCancel={() => setShowEmployeeDialog(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
          <DialogContent className="rounded-3xl shadow-md3-4">
            <DialogHeader>
              <DialogTitle className="text-headline-small">Add New Asset</DialogTitle>
            </DialogHeader>
            <AssetForm 
              onSubmit={handleAssetSubmit}
              onCancel={() => setShowAssetDialog(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="rounded-3xl shadow-md3-4">
            <DialogHeader>
              <DialogTitle className="text-headline-small">Open New Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm 
              onSubmit={handleTicketSubmit}
              onCancel={() => setShowTicketDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
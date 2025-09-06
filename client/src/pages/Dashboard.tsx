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
  Calendar,
  BarChart3,
  UserPlus,
  Plus,
  Ticket,
  Users,
  UserX,
  Package,
  Laptop,
  AlertCircle,
  CalendarCheck
} from 'lucide-react';

// Import dashboard components
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
    insights: language === 'English' ? 'Insights' : 'رؤى',
    analytics: language === 'English' ? 'Analytics' : 'التحليلات',
    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    activity: language === 'English' ? 'Activity' : 'النشاط',
    lastUpdated: language === 'English' ? 'Last updated' : 'آخر تحديث',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    autoRefresh: language === 'English' ? 'Auto-refresh' : 'تحديث تلقائي',
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
    quickSummary: language === 'English' ? 'Quick Summary' : 'ملخص سريع',
    activityTimeline: language === 'English' ? 'Activity Timeline' : 'الجدول الزمني للنشاط',
  };

  // Fetch dashboard data with enhanced endpoint
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
  });

  // Handler Functions
  const handleAddEmployee = () => {
    setShowEmployeeDialog(true);
  };
  
  const handleAddAsset = () => {
    setShowAssetDialog(true);
  };
  
  const handleOpenTicket = () => {
    setShowTicketDialog(true);
  };
  
  // Submit Handlers
  const handleEmployeeSubmit = async (data: any) => {
    try {
      // The EmployeeForm component handles the actual submission
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
      // The AssetForm component handles the actual submission
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
      // The TicketForm component handles the actual submission
      setShowTicketDialog(false);
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' 
          ? 'Ticket created successfully' 
          : 'تم إنشاء التذكرة بنجاح',
      });
      refetch();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setLastRefresh(new Date());
    refetch();
    toast({
      title: language === 'English' ? 'Refreshed' : 'تم التحديث',
      description: language === 'English' 
        ? 'Dashboard data has been updated' 
        : 'تم تحديث بيانات لوحة التحكم',
    });
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
        refetch();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.dashboard}</h1>
          <p className="text-muted-foreground mt-1">
            {translations.welcome}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Quick Action Buttons - Improved Style */}
          <div className="flex gap-2 mr-3 border-r pr-3">
            <Button
              variant="outline"
              size="default"
              onClick={handleAddEmployee}
              className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 hover:border-blue-400"
              disabled={!dashboardData?.quickActions?.canAddEmployee}
            >
              <UserPlus className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Add Employee</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleAddAsset}
              className="gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 hover:border-green-400"
              disabled={!dashboardData?.quickActions?.canAddAsset}
            >
              <Plus className="h-4 w-4 text-green-600" />
              <span className="hidden sm:inline">Add Asset</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleOpenTicket}
              className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 hover:border-purple-400"
              disabled={!dashboardData?.quickActions?.canOpenTicket}
            >
              <Ticket className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline">Open Ticket</span>
            </Button>
          </div>
          
          {/* Existing Control Buttons */}
          <div className="text-sm text-muted-foreground">
            {translations.lastUpdated}: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
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
        </div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            {translations.overview}
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {translations.insights}
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

        {/* New Overview Tab - Simple summary view WITH ICONS */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Summary Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.quickSummary}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Total Employees Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.employees?.total || 0}
                      </p>
                      {dashboardData?.employees?.active > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          {dashboardData.employees.active} active
                        </p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Offboarding Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Pending Offboarding</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.employees?.pendingOffboarding || 0}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Assets to be returned
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                      <UserX className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offboarded with Assets Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Offboarded with Assets</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.employees?.offboardedWithAssets || 0}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Requires attention
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assets in Use Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Assets in Use</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.assets?.inUse || 0}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {dashboardData?.assets?.total || 0} total assets
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Laptops Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Available Laptops</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.assets?.availableLaptops || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Ready for assignment
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Laptop className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Tickets Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.tickets?.active || 0}
                      </p>
                      {dashboardData?.tickets?.critical > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {dashboardData.tickets.critical} critical
                        </p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Onboardings Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Upcoming Onboardings</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.employees?.upcomingOnboardings || 0}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Next 30 days
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                      <CalendarCheck className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentAssets 
              assets={dashboardData?.assets?.recentlyUpdated?.slice(0, 3) || dashboardData?.recentAssets?.slice(0, 3) || []} 
              isLoading={isLoading}
            />
            <RecentTickets 
              tickets={dashboardData?.tickets?.recent?.slice(0, 3) || dashboardData?.recentTickets?.slice(0, 3) || []} 
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Insights Tab (formerly Overview) - Detailed view */}
        <TabsContent value="insights" className="space-y-6">
          {/* Maintenance Overview - Moved to top */}
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
                      onClick={() => window.location.href = `/assets?maintenanceDue=${status}`}
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

          {/* Asset Distribution by Type - Moved from Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetsByType 
              assetsByType={dashboardData?.assets?.byType || dashboardData?.assetsByType || {}} 
              isLoading={isLoading}
            />
            
            {/* Department Distribution */}
            <EnhancedDepartmentDistribution 
              data={dashboardData?.departmentDistribution} 
              isLoading={isLoading} 
            />
          </div>

          {/* Activity Timeline - Moved from Activity tab */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translations.activityTimeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
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
                            <p className="font-medium">{dashboardData.maintenance.overdue} assets overdue for maintenance</p>
                            <p className="text-sm text-gray-500">{translations.today}</p>
                          </div>
                        </div>
                      )}
                      {dashboardData?.assets?.underMaintenance > 0 && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dashboardData.assets.underMaintenance} assets under maintenance</p>
                            <p className="text-sm text-gray-500">{translations.today}</p>
                          </div>
                        </div>
                      )}
                      {dashboardData?.tickets?.critical > 0 && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dashboardData.tickets.critical} critical tickets pending</p>
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
        </TabsContent>

        {/* Notifications Tab - Unchanged */}
        <TabsContent value="notifications">
          <Notifications 
            notifications={dashboardData?.notifications?.items || []} 
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Employee Dialog - FIXED SIZE */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Add New Employee' : 'إضافة موظف جديد'}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            onSuccess={handleEmployeeSubmit}
            onCancel={() => setShowEmployeeDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Asset Dialog - FIXED SIZE */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Add New Asset' : 'إضافة أصل جديد'}
            </DialogTitle>
          </DialogHeader>
          <AssetForm
            onSuccess={handleAssetSubmit}
            onCancel={() => setShowAssetDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog - FIXED SIZE */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Create New Ticket' : 'إنشاء تذكرة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <TicketForm
            onSuccess={handleTicketSubmit}
            onCancel={() => setShowTicketDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
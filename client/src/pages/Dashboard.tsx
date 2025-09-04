// client/src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { useToast } from '@/hooks/use-toast'; // ADD THIS IMPORT
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // ADD THIS
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

// Import form components for dialogs - ADD THESE
import EmployeeForm from '@/components/employees/EmployeeForm';
import AssetForm from '@/components/assets/AssetForm';
import TicketForm from '@/components/tickets/TicketForm';

export default function Dashboard() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast(); // ADD THIS
  const [activeTab, setActiveTab] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // ADD THESE STATE VARIABLES FOR DIALOGS
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
    noData: language === 'English' ? 'No data available' : 'لا توجد بيانات متاحة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    showMore: language === 'English' ? 'Show More' : 'عرض المزيد',
    // ADD THESE TRANSLATIONS
    addEmployee: language === 'English' ? 'Add New Employee' : 'إضافة موظف جديد',
    addAsset: language === 'English' ? 'Add New Asset' : 'إضافة أصل جديد',
    createTicket: language === 'English' ? 'Create New Ticket' : 'إنشاء تذكرة جديدة',
    success: language === 'English' ? 'Success' : 'نجح',
    employeeAdded: language === 'English' ? 'Employee added successfully' : 'تمت إضافة الموظف بنجاح',
    assetAdded: language === 'English' ? 'Asset added successfully' : 'تمت إضافة الأصل بنجاح',
    ticketCreated: language === 'English' ? 'Ticket created successfully' : 'تم إنشاء التذكرة بنجاح',
  };

  // Fetch dashboard data with proper error handling
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/dashboard'],
    refetchInterval: autoRefresh ? 30000 : false,
    retry: 3,
  });

  // ADD THESE HANDLER FUNCTIONS
  const handleAddEmployee = () => {
    setShowEmployeeDialog(true);
  };
  
  const handleAddAsset = () => {
    setShowAssetDialog(true);
  };
  
  const handleOpenTicket = () => {
    setShowTicketDialog(true);
  };
  
  const handleEmployeeSubmit = async () => {
    setShowEmployeeDialog(false);
    toast({
      title: translations.success,
      description: translations.employeeAdded,
    });
    refetch(); // Refresh dashboard data
  };
  
  const handleAssetSubmit = async () => {
    setShowAssetDialog(false);
    toast({
      title: translations.success,
      description: translations.assetAdded,
    });
    refetch(); // Refresh dashboard data
  };
  
  const handleTicketSubmit = async () => {
    setShowTicketDialog(false);
    toast({
      title: translations.success,
      description: translations.ticketCreated,
    });
    refetch(); // Refresh dashboard data
  };

  // Update last refresh time whenever data is fetched
  useEffect(() => {
    if (dashboardData) {
      setLastRefresh(new Date());
    }
  }, [dashboardData]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const handleRefresh = () => {
    refetch();
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    console.log('Exporting dashboard data...');
  };

  // Format last refresh time
  const formatRefreshTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {translations.dashboard}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {translations.welcome}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {translations.lastUpdated}: {formatRefreshTime()}
          </span>
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

      {/* Quick Actions Bar - UPDATE WITH CALLBACKS */}
      <QuickActions 
        data={dashboardData?.quickActions} 
        isLoading={isLoading}
        onAddEmployee={handleAddEmployee}
        onAddAsset={handleAddAsset}
        onOpenTicket={handleOpenTicket}
      />

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
              data={dashboardData?.departments} 
              isLoading={isLoading} 
            />
          </div>

          {/* Recent Activity Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.recentActivity}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentAssets data={dashboardData?.recentAssets} isLoading={isLoading} />
              <RecentTickets data={dashboardData?.recentTickets} isLoading={isLoading} />
            </div>
          </div>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {translations.maintenanceSchedule}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Add maintenance schedule component */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {translations.noData}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Legacy components for backward compatibility */}
            <StatsCard 
              title="Asset Distribution by Type"
              data={dashboardData?.assetsByType}
              isLoading={isLoading}
            />
            <AssetsByType 
              data={dashboardData?.assetsByType} 
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <RecentAssets 
            data={dashboardData?.recentAssets} 
            isLoading={isLoading} 
            showAll 
          />
          <RecentTickets 
            data={dashboardData?.recentTickets} 
            isLoading={isLoading}
            showAll
          />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Notifications 
            data={dashboardData?.notifications} 
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
      
      {/* ADD DIALOGS AT THE END */}
      
      {/* Employee Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.addEmployee}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            onSubmit={handleEmployeeSubmit}
            onCancel={() => setShowEmployeeDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Asset Dialog */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.addAsset}</DialogTitle>
          </DialogHeader>
          <AssetForm
            onSubmit={handleAssetSubmit}
            onCancel={() => setShowAssetDialog(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.createTicket}</DialogTitle>
          </DialogHeader>
          <TicketForm
            mode="create"
            onSubmit={handleTicketSubmit}
            onCancel={() => setShowTicketDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
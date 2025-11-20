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
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
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
  CalendarCheck,
  Bell
} from 'lucide-react';

// Import dashboard components
import EmployeeMetrics from '@/components/dashboard/EmployeeMetrics';
import AssetMetrics from '@/components/dashboard/AssetMetrics';
import TicketMetrics from '@/components/dashboard/TicketMetrics';
import EnhancedDepartmentDistribution from '@/components/dashboard/EnhancedDepartmentDistribution';
import RecentAssets from '@/components/dashboard/RecentAssets';
import RecentTickets from '@/components/dashboard/RecentTickets';
import QuickActions from '@/components/dashboard/QuickActions';

// Import legacy components for backward compatibility
import StatsCard from '@/components/dashboard/StatsCard';
import AssetsByType from '@/components/dashboard/AssetsByType';
import Notifications from '@/components/dashboard/Notifications';

export default function Dashboard() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  
  // Get tab from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'overview';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);

  // Comprehensive translations based on language
  const translations = {
    // Main Dashboard
    dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    welcome: language === 'English' 
      ? 'IT Asset Management System - Real-time Overview' 
      : 'نظام إدارة أصول تكنولوجيا المعلومات - نظرة عامة في الوقت الفعلي',
    
    // Tab Labels
    overview: language === 'English' ? 'Overview' : 'نظرة عامة',
    insights: language === 'English' ? 'Insights' : 'رؤى',
    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    
    // Header Actions
    lastUpdated: language === 'English' ? 'Last updated' : 'آخر تحديث',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    refreshed: language === 'English' ? 'Refreshed' : 'تم التحديث',
    autoRefresh: language === 'English' ? 'Auto-refresh' : 'تحديث تلقائي',
    dashboardUpdated: language === 'English' ? 'Dashboard data has been updated' : 'تم تحديث بيانات لوحة التحكم',
    
    // Section Titles
    quickSummary: language === 'English' ? 'Quick Summary' : 'ملخص سريع',
    mainMetrics: language === 'English' ? 'Main Metrics' : 'المقاييس الرئيسية',
    activityTimeline: language === 'English' ? 'Activity Timeline' : 'الجدول الزمني للنشاط',
    maintenanceOverview: language === 'English' ? 'Maintenance Overview' : 'نظرة عامة على الصيانة',
    
    // Quick Summary Card Titles
    totalEmployees: language === 'English' ? 'Total Employees' : 'إجمالي الموظفين',
    pendingOffboarding: language === 'English' ? 'Pending Offboarding' : 'في انتظار المغادرة',
    offboardedWithAssets: language === 'English' ? 'Offboarded with Assets' : 'غادروا مع أصول',
    recentlyAdded: language === 'English' ? 'Recently Added' : 'أضيف مؤخراً',
    assetsInUse: language === 'English' ? 'Assets in Use' : 'الأصول قيد الاستخدام',
    availableLaptops: language === 'English' ? 'Available Laptops' : 'أجهزة محمولة متاحة',
    openTickets: language === 'English' ? 'Open Tickets' : 'تذاكر مفتوحة',
    resolvedThisMonth: language === 'English' ? 'Resolved This Month' : 'تم حلها هذا الشهر',
    
    // Card Descriptions
    active: language === 'English' ? 'active' : 'نشط',
    assetsToBeReturned: language === 'English' ? 'Assets to be returned' : 'أصول يجب إرجاعها',
    requiresAttention: language === 'English' ? 'Requires attention' : 'يتطلب الانتباه',
    lastThirtyDays: language === 'English' ? 'Last 30 days' : 'آخر 30 يوم',
    totalAssets: language === 'English' ? 'total assets' : 'إجمالي الأصول',
    inInventory: language === 'English' ? 'in inventory' : 'في المخزون',
    highPriority: language === 'English' ? 'high priority' : 'أولوية عالية',
    ticketsClosed: language === 'English' ? 'Tickets closed' : 'تذاكر مغلقة',
    
    // Maintenance Card Labels
    total: language === 'English' ? 'Total' : 'الإجمالي',
    overdue: language === 'English' ? 'Overdue' : 'متأخر',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    
    // Maintenance Descriptions
    allMaintenance: language === 'English' ? 'All maintenance' : 'جميع الصيانات',
    needAttention: language === 'English' ? 'Need attention' : 'تحتاج انتباه',
    planned: language === 'English' ? 'Planned' : 'مخطط',
    beingServiced: language === 'English' ? 'Being serviced' : 'قيد الخدمة',
    thisMonth: language === 'English' ? 'This month' : 'هذا الشهر',
    
    // Department Section
    departmentsByTicketVolume: language === 'English' ? 'Departments by Ticket Volume' : 'الأقسام حسب حجم التذاكر',
    
    // Quick Actions
    addEmployee: language === 'English' ? 'Add Employee' : 'إضافة موظف',
    addAsset: language === 'English' ? 'Add Asset' : 'إضافة أصل',
    openTicket: language === 'English' ? 'Open Ticket' : 'فتح تذكرة',
    
    // Dialog Titles
    addNewEmployee: language === 'English' ? 'Add New Employee' : 'إضافة موظف جديد',
    addNewAsset: language === 'English' ? 'Add New Asset' : 'إضافة أصل جديد',
    createNewTicket: language === 'English' ? 'Create New Ticket' : 'إنشاء تذكرة جديدة',
    
    // Success Messages
    success: language === 'English' ? 'Success' : 'نجح',
    employeeAddedSuccess: language === 'English' ? 'Employee added successfully' : 'تمت إضافة الموظف بنجاح',
    assetAddedSuccess: language === 'English' ? 'Asset added successfully' : 'تمت إضافة الأصل بنجاح',
    ticketCreatedSuccess: language === 'English' ? 'Ticket created successfully' : 'تم إنشاء التذكرة بنجاح',
  };

  // Fetch dashboard data with enhanced endpoint
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/summary'],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds if enabled
  });

  // Fetch employees and assets for custom calculations
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
  });

  // Calculate offboarded with assets (matching EmployeeCustomFilters logic)
  const offboardedWithAssets = employees.filter((emp: any) => {
    const isOffboarded = emp.status === 'Resigned' || emp.status === 'Terminated';
    const hasAssets = assets.some((asset: any) => 
      (asset.assignedTo && asset.assignedTo === emp.id) ||
      (asset.assignedEmployeeId && asset.assignedEmployeeId === emp.id) ||
      (asset.assignedToId && asset.assignedToId === emp.id) ||
      (asset.assignedTo && asset.assignedTo === emp.empId) ||
      (asset.assignedEmployee && asset.assignedEmployee === emp.id)
    );
    return isOffboarded && hasAssets;
  });

  // Calculate recently added (joined within 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentlyAdded = employees.filter((emp: any) => {
    if (!emp.joiningDate) return false;
    const joiningDate = new Date(emp.joiningDate);
    return joiningDate >= thirtyDaysAgo;
  });

  // Calculate assets in use (status === "In Use")
  const assetsInUse = assets.filter((asset: any) => asset.status === 'In Use');

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
        title: translations.success,
        description: translations.employeeAddedSuccess,
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
        title: translations.success,
        description: translations.assetAddedSuccess,
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
        title: translations.success,
        description: translations.ticketCreatedSuccess,
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
      title: translations.refreshed,
      description: translations.dashboardUpdated,
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
              <span className="hidden sm:inline">{translations.addEmployee}</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleAddAsset}
              className="gap-2 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 hover:border-green-400"
              disabled={!dashboardData?.quickActions?.canAddAsset}
            >
              <Plus className="h-4 w-4 text-green-600" />
              <span className="hidden sm:inline">{translations.addAsset}</span>
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={handleOpenTicket}
              className="gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 hover:border-purple-400"
              disabled={!dashboardData?.quickActions?.canOpenTicket}
            >
              <Ticket className="h-4 w-4 text-purple-600" />
              <span className="hidden sm:inline">{translations.openTicket}</span>
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
          </TabsTrigger>
        </TabsList>

        {/* New Overview Tab - Simple summary view WITH ICONS AND CUSTOM CALCULATIONS */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Summary Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.quickSummary}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Total Employees Card */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/employees?statusFilter=All`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.totalEmployees}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.employees?.total || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboardData?.employees?.active || 0} {translations.active}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Offboarding Card */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/employees?customFilter=pendingExit`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.pendingOffboarding}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.employees?.pendingOffboarding || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {translations.assetsToBeReturned}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                      <UserX className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offboarded with Assets Card - Using custom calculation from filters */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/employees?customFilter=offboardedWithAssets`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.offboardedWithAssets}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : offboardedWithAssets.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {translations.requiresAttention}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recently Added Employees Card - Using custom calculation */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/employees?customFilter=recentlyAdded`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.recentlyAdded}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : recentlyAdded.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {translations.lastThirtyDays}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assets in Use Card - Using status === "In Use" */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/assets?status=In Use`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.assetsInUse}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : assetsInUse.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {assets.length} {translations.totalAssets}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Laptops Card */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/assets?type=Laptop&status=Available`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.availableLaptops}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.assets?.availableLaptops || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {translations.inInventory}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Laptop className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Open Tickets Card */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/tickets`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.openTickets}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.tickets?.active || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dashboardData?.tickets?.byPriority?.high || 0} {translations.highPriority}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resolved This Month Card */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.location.href = `/tickets`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">{translations.resolvedThisMonth}</p>
                      <p className="text-2xl font-bold mt-1">
                        {isLoading ? '...' : dashboardData?.tickets?.resolvedThisMonth || 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {translations.ticketsClosed}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CalendarCheck className="h-6 w-6 text-green-600" />
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
          {/* Maintenance Overview - Without Parent Card Container */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {translations.maintenanceOverview}
            </h2>
            
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                
                {/* Total Maintenance Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/assets?status=Maintenance`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{translations.total}</p>
                        <p className="text-3xl font-bold mt-2">
                          {((dashboardData?.maintenance?.scheduled || 0) + 
                            (dashboardData?.maintenance?.inProgress || 0) + 
                            (dashboardData?.maintenance?.overdue || 0))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {translations.allMaintenance}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overdue Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/assets?maintenanceDue=overdue`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{translations.overdue}</p>
                        <p className="text-3xl font-bold mt-2">
                          {dashboardData?.maintenance?.overdue || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {translations.needAttention}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Scheduled Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/assets?maintenanceDue=scheduled`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{translations.scheduled}</p>
                        <p className="text-3xl font-bold mt-2">
                          {dashboardData?.maintenance?.scheduled || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {translations.planned}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* In Progress Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/assets?maintenanceDue=in-progress`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{translations.inProgress}</p>
                        <p className="text-3xl font-bold mt-2">
                          {dashboardData?.maintenance?.inProgress || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {translations.beingServiced}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Completed Card */}
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/assets?maintenanceDue=completed`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{translations.completed}</p>
                        <p className="text-3xl font-bold mt-2">
                          {dashboardData?.maintenance?.completed || 0}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {translations.thisMonth}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                        <CalendarCheck className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </div>

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

          {/* Asset Distribution and Department Stats - Side by Side - MOVED UP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Distribution by Type */}
            <AssetsByType 
              assetsByType={dashboardData?.assets?.byType || dashboardData?.assetsByType || {}} 
              isLoading={isLoading}
            />
            
            {/* Department with Most Tickets - REPLACED */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  {translations.departmentsByTicketVolume}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(dashboardData?.tickets?.byDepartment || {})
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([dept, count], index) => (
                        <div key={dept} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="text-sm font-medium">{dept}</span>
                          </div>
                          <Badge variant={index === 0 ? "destructive" : "secondary"}>
                            {count as number} tickets
                          </Badge>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline - Moved to the end */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
              {translations.activityTimeline}
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

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Notifications />
        </TabsContent>
      </Tabs>

      {/* Dialog for Add Employee */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.addNewEmployee}</DialogTitle>
          </DialogHeader>
          <EmployeeForm 
            onSubmit={handleEmployeeSubmit} 
            onCancel={() => setShowEmployeeDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for Add Asset */}
      <Dialog open={showAssetDialog} onOpenChange={setShowAssetDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.addNewAsset}</DialogTitle>
          </DialogHeader>
          <AssetForm 
            onSubmit={handleAssetSubmit} 
            onCancel={() => setShowAssetDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog for Open Ticket */}
      <TicketForm 
        mode="create"
        open={showTicketDialog}
        onOpenChange={setShowTicketDialog}
        onSuccess={(ticket) => {
          handleTicketSubmit();
          setShowTicketDialog(false);
        }}
      />
    </div>
  );
}
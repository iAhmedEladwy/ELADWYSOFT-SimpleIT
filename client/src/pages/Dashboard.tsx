import { useState } from 'react';
import { Wrench, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentAssets from '@/components/dashboard/RecentAssets';
import RecentTickets from '@/components/dashboard/RecentTickets';
import AssetsByType from '@/components/dashboard/AssetsByType';
import DepartmentDistribution from '@/components/dashboard/DepartmentDistribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import Notifications from '@/components/dashboard/Notifications';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Users, 
  Laptop, 
  Ticket, 
  DollarSign 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview');

  // Get translations based on language
  const translations = {
    dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    welcome: language === 'English' 
      ? 'Welcome to SimpleIT - IT Asset Management System' 
      : 'مرحبًا بك في SimpleIT - نظام إدارة أصول تكنولوجيا المعلومات',
    overview: language === 'English' ? 'Overview' : 'نظرة عامة',

    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    totalEmployees: language === 'English' ? 'Total Employees' : 'إجمالي الموظفين',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    activeTickets: language === 'English' ? 'Active Tickets' : 'التذاكر النشطة',
    assetValue: language === 'English' ? 'Asset Value' : 'قيمة الأصول',
    fromLastYear: language === 'English' ? 'from last year' : 'من العام الماضي',
    fromLastMonth: language === 'English' ? 'from last month' : 'من الشهر الماضي',
    fromLastWeek: language === 'English' ? 'from last week' : 'من الأسبوع الماضي',
    fromLastQuarter: language === 'English' ? 'from last quarter' : 'من الربع الأخير',
    maintenanceDue: language === 'English' ? 'Maintenance Due' : 'الصيانة المستحقة',
    overdue: language === 'English' ? 'Overdue' : 'متأخر',
    dueThisWeek: language === 'English' ? 'Due This Week' : 'مستحق هذا الأسبوع',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    maintenanceOverview: language === 'English' ? 'Maintenance Overview' : 'نظرة عامة على الصيانة',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    totalRecords: language === 'English' ? 'Total Records' : 'إجمالي السجلات',
    viewScheduled: language === 'English' ? 'View Scheduled' : 'عرض المجدول',
    viewInProgress: language === 'English' ? 'View In Progress' : 'عرض قيد التنفيذ',
    viewCompleted: language === 'English' ? 'View Completed' : 'عرض المكتمل',
    noData: language === 'English' ? 'No data available' : 'لا توجد بيانات متاحة',
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
  });

 // Navigation handlers for maintenance cards - using window.location
  const handleMaintenanceNavigation = (status: string) => {
    window.location.href = `/assets?maintenanceDue=${status}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.dashboard}</h1>
        <p className="text-gray-600">{translations.welcome}</p>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">{translations.overview}</TabsTrigger>
          <TabsTrigger value="notifications">{translations.notifications}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </>
            ) : (
              <>
                <StatsCard
                  title={translations.totalEmployees}
                  value={dashboardData?.counts?.employees || 0}
                  icon={<Users className="h-6 w-6" />}
                  change={dashboardData?.changes?.employees || '0%'}
                  changeLabel={translations.fromLastYear}
                  changeColor={dashboardData?.changes?.employees?.startsWith('-') ? 'error' : 'success'}
                  iconColor="primary"
                />
                <StatsCard
                  title={translations.totalAssets}
                  value={dashboardData?.counts?.assets || 0}
                  icon={<Laptop className="h-6 w-6" />}
                  change={dashboardData?.changes?.assets || '0%'}
                  changeLabel={translations.fromLastMonth}
                  changeColor={dashboardData?.changes?.assets?.startsWith('-') ? 'error' : 'success'}
                  iconColor="secondary"
                />
                <StatsCard
                  title={translations.activeTickets}
                  value={dashboardData?.counts?.activeTickets || 0}
                  icon={<Ticket className="h-6 w-6" />}
                  change={dashboardData?.changes?.activeTickets || '0%'}
                  changeLabel={translations.fromLastWeek}
                  changeColor={dashboardData?.changes?.activeTickets?.startsWith('-') ? 'success' : 'warning'}
                  iconColor="accent"
                />
                <StatsCard
                  title={translations.assetValue}
                  value={dashboardData?.counts?.totalAssetValue || 0}
                  icon={<DollarSign className="h-6 w-6" />}
                  change={dashboardData?.changes?.totalAssetValue || '0%'}
                  changeLabel={translations.fromLastQuarter}
                  changeColor={dashboardData?.changes?.totalAssetValue?.startsWith('-') ? 'error' : 'success'}
                  iconColor="warning"
                  isCurrency={true}
                />
              </>
            )}
          </div>


          {/* Enhanced Maintenance Overview Widget */}
            <Card className="col-span-1 md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{translations.maintenanceOverview}</CardTitle>
                </div>
                 <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/maintenance'}
                >
                  {translations.viewAll}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : dashboardData?.maintenanceCounts ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Scheduled Maintenance Card */}
                    <div 
                      className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleMaintenanceNavigation('scheduled')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="h-8 w-8 text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">
                          {translations.viewScheduled} →
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {translations.scheduled}
                      </p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {dashboardData.maintenanceCounts.scheduled || 0}
                      </p>
                    </div>

                    {/* In Progress Maintenance Card */}
                    <div 
                      className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleMaintenanceNavigation('inProgress')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">
                          {translations.viewInProgress} →
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {translations.inProgress}
                      </p>
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                        {dashboardData.maintenanceCounts.inProgress || 0}
                      </p>
                    </div>

                    {/* Completed Maintenance Card */}
                    <div 
                      className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
                      onClick={() => handleMaintenanceNavigation('completed')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          {translations.viewCompleted} →
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {translations.completed}
                      </p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {dashboardData.maintenanceCounts.completed || 0}
                      </p>
                    </div>

                    {/* Total Maintenance Records Card */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Wrench className="h-8 w-8 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {translations.totalRecords}
                      </p>
                      <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {dashboardData.maintenanceCounts.total || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {translations.noData}
                  </div>
                )}
              </CardContent>
            </Card>

               {/* Recent Assets and Tickets - with enhancements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentAssets 
                  assets={dashboardData?.recentAssets || []} 
                  isLoading={isLoading}
                  onViewAll={() => window.location.href = '/assets'}
                />
                <RecentTickets 
                  tickets={dashboardData?.recentTickets || []} 
                  isLoading={isLoading}
                  onViewAll={() => window.location.href = '/tickets'}
                />
              </div>
              {/* Assets by Type & Department Distribution - with enhancements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AssetsByType 
                      assetsByType={dashboardData?.assetsByType || {}} 
                      isLoading={isLoading}
                      onTypeClick={(type) => window.location.href = `/assets?type=${type}`}
                    />
                    <DepartmentDistribution 
                      employeesByDepartment={dashboardData?.employeesByDepartment || {}} 
                      isLoading={isLoading}
                      onDepartmentClick={(dept) => window.location.href = `/employees?department=${dept}`}
                    />
                  </div>
                </TabsContent>

        <TabsContent value="notifications">
          <Notifications />
        </TabsContent>
      </Tabs>
    </div>
  );
}

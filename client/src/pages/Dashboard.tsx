import { useState } from 'react';
import { Wrench } from 'lucide-react';
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
    overdue: language === 'English' ? 'Overdue' : 'متأخر',
    dueThisWeek: language === 'English' ? 'Due This Week' : 'مستحق هذا الأسبوع',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    activeMaintenance: language === 'English' ? 'Active Maintenance' : 'الصيانة النشطة',
    fromThisMonth: language === 'English' ? 'scheduled this month' : 'مجدول هذا الشهر',
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/summary'],
  });

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
           {dashboardData?.maintenanceCounts && dashboardData.maintenanceCounts.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations.activeMaintenance}
                  </CardTitle>
                  <Wrench className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {dashboardData.maintenanceCounts.total}
                  </span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">
                      {dashboardData.maintenanceCounts.scheduled} {language === 'English' ? 'Scheduled' : 'مجدول'}
                    </span>
                    <span className="text-yellow-600">
                      {dashboardData.maintenanceCounts.inProgress} {language === 'English' ? 'In Progress' : 'قيد التنفيذ'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          {/* Recent Assets and Tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentAssets assets={dashboardData?.recentAssets || []} isLoading={isLoading} />
            <RecentTickets tickets={dashboardData?.recentTickets || []} isLoading={isLoading} />
          </div>

          {/* Assets by Type & Department Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AssetsByType 
              assetsByType={dashboardData?.assetsByType || {}} 
              isLoading={isLoading} 
            />
            <DepartmentDistribution 
              employeesByDepartment={dashboardData?.employeesByDepartment || {}} 
              isLoading={isLoading}
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

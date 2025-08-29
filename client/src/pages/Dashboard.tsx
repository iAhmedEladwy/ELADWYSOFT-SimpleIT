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
    maintenanceDue: language === 'English' ? 'Maintenance Due' : 'الصيانة المستحقة',
    overdue: language === 'English' ? 'Overdue' : 'متأخر',
    dueThisWeek: language === 'English' ? 'Due This Week' : 'مستحق هذا الأسبوع',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
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
          {/* Maintenance Due Widget - Add this as a 5th card or in a new row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Maintenance Overview Card */}
            <Card className="col-span-1 md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{translations.maintenanceDue}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/assets?maintenanceDue=dueSoon'}
                >
                  {translations.viewAll}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Overdue */}
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => window.location.href = '/assets?maintenanceDue=overdue'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                          <span className="text-2xl">⏰</span>
                        </div>
                        <div>
                          <p className="text-sm text-red-600 font-medium">{translations.overdue}</p>
                          <p className="text-2xl font-bold text-red-700">
                            {dashboardData?.maintenanceCounts?.overdue || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Due This Week */}
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                      onClick={() => window.location.href = '/assets?maintenanceDue=dueSoon'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <span className="text-2xl">🛠️</span>
                        </div>
                        <div>
                          <p className="text-sm text-yellow-600 font-medium">{translations.dueThisWeek}</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {dashboardData?.maintenanceCounts?.dueThisWeek || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Scheduled */}
                    <div 
                      className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => window.location.href = '/assets?maintenanceDue=scheduled'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <span className="text-2xl">📅</span>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">{translations.scheduled}</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {dashboardData?.maintenanceCounts?.scheduled || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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

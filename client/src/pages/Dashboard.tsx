import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentAssets from '@/components/dashboard/RecentAssets';
import RecentTickets from '@/components/dashboard/RecentTickets';
import AssetsByType from '@/components/dashboard/AssetsByType';
import DepartmentDistribution from '@/components/dashboard/DepartmentDistribution';
import RecentActivity from '@/components/dashboard/RecentActivity';
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
    recentActivity: language === 'English' ? 'Recent Activity' : 'النشاط الأخير',
    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    totalEmployees: language === 'English' ? 'Total Employees' : 'إجمالي الموظفين',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    activeTickets: language === 'English' ? 'Active Tickets' : 'التذاكر النشطة',
    assetValue: language === 'English' ? 'Asset Value' : 'قيمة الأصول',
    fromLastYear: language === 'English' ? 'from last year' : 'من العام الماضي',
    fromLastMonth: language === 'English' ? 'from last month' : 'من الشهر الماضي',
    fromLastWeek: language === 'English' ? 'from last week' : 'من الأسبوع الماضي',
    fromLastQuarter: language === 'English' ? 'from last quarter' : 'من الربع الأخير',
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
          <TabsTrigger value="recent-activity">{translations.recentActivity}</TabsTrigger>
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
                  change="+12%"
                  changeLabel={translations.fromLastYear}
                  iconColor="primary"
                />
                <StatsCard
                  title={translations.totalAssets}
                  value={dashboardData?.counts?.assets || 0}
                  icon={<Laptop className="h-6 w-6" />}
                  change="+8%"
                  changeLabel={translations.fromLastMonth}
                  iconColor="secondary"
                />
                <StatsCard
                  title={translations.activeTickets}
                  value={dashboardData?.counts?.activeTickets || 0}
                  icon={<Ticket className="h-6 w-6" />}
                  change="-5%"
                  changeLabel={translations.fromLastWeek}
                  changeColor="warning"
                  iconColor="accent"
                />
                <StatsCard
                  title={translations.assetValue}
                  value={dashboardData?.counts?.totalAssetValue || 0}
                  icon={<DollarSign className="h-6 w-6" />}
                  change="+14%"
                  changeLabel={translations.fromLastQuarter}
                  iconColor="warning"
                  isCurrency={true}
                />
              </>
            )}
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

        <TabsContent value="recent-activity">
          <RecentActivity activities={dashboardData?.recentActivity || []} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="notifications">
          <Notifications />
        </TabsContent>
      </Tabs>
    </div>
  );
}

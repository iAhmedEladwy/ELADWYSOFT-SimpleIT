/**
 * Employee Portal Dashboard (Landing Page)
 * 
 * Context: SimpleIT v0.4.5 - Dashboard with summary statistics and quick actions
 * 
 * Features:
 * - Assets summary (total assigned, by type)
 * - Tickets summary (open, in progress, resolved)
 * - Recent activity timeline
 * - Quick action buttons
 * - Welcome message with employee name
 * - Bilingual support (English/Arabic)
 * 
 * API Endpoints: 
 * - GET /api/portal/dashboard-stats
 * - GET /api/portal/my-profile (for employee name)
 */

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Ticket, 
  Plus, 
  User, 
  Calendar, 
  TrendingUp,
  Laptop,
  Smartphone,
  Monitor,
  AlertCircle
} from 'lucide-react';
import PortalLayout from '@/components/portal/PortalLayout';
import { useEmployeeLink } from '@/hooks/use-employee-link';
import EmployeeLinkRequired from '@/components/portal/EmployeeLinkRequired';

export default function PortalDashboard() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const { canAccessPortal, needsEmployeeLink, availableEmployees, isLoading: isEmployeeLoading } = useEmployeeLink();

  const translations = {
    welcome: language === 'English' ? 'Welcome' : 'مرحباً',
    dashboard: language === 'English' ? 'Dashboard' : 'لوحة التحكم',
    myAssets: language === 'English' ? 'My Assets' : 'أصولي',
    myTickets: language === 'English' ? 'My Tickets' : 'تذاكري',
    createTicket: language === 'English' ? 'Create Ticket' : 'إنشاء تذكرة',
    viewProfile: language === 'English' ? 'View Profile' : 'عرض الملف الشخصي',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    totalTickets: language === 'English' ? 'Total Tickets' : 'إجمالي التذاكر',
    openTickets: language === 'English' ? 'Open' : 'مفتوح',
    inProgressTickets: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    resolvedTickets: language === 'English' ? 'Resolved' : 'تم الحل',
    recentActivity: language === 'English' ? 'Recent Activity' : 'النشاط الحديث',
    quickActions: language === 'English' ? 'Quick Actions' : 'إجراءات سريعة',
    loading: language === 'English' ? 'Loading dashboard...' : 'جاري تحميل لوحة التحكم...',
    error: language === 'English' ? 'Failed to load dashboard data' : 'فشل تحميل بيانات لوحة التحكم',
    noRecentActivity: language === 'English' ? 'No recent activity' : 'لا يوجد نشاط حديث',
    laptop: language === 'English' ? 'Laptop' : 'لابتوب',
    desktop: language === 'English' ? 'Desktop' : 'مكتب',
    mobile: language === 'English' ? 'Mobile' : 'جوال',
    tablet: language === 'English' ? 'Tablet' : 'لوحي',
    other: language === 'English' ? 'Other' : 'أخرى',
  };

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/portal/dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/portal/dashboard-stats', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      return response.json();
    },
    enabled: canAccessPortal && !isEmployeeLoading,
  });

  // Fetch employee profile for welcome message
  const { data: profile } = useQuery({
    queryKey: ['/api/portal/my-profile'],
    queryFn: async () => {
      const response = await fetch('/api/portal/my-profile', {
        credentials: 'include',
      });
      if (response.ok) {
        return response.json();
      }
      return null;
    },
    enabled: canAccessPortal && !isEmployeeLoading,
  });

  const getAssetIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laptop': return <Laptop className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Smartphone className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Employee Link Check */}
        {needsEmployeeLink && (
          <EmployeeLinkRequired availableEmployees={availableEmployees} />
        )}

        {/* Welcome Header */}
        {canAccessPortal && (
          <div>
            <h1 className="text-3xl font-bold">
              {translations.welcome}{profile?.englishName ? `, ${profile.englishName}` : ''}
            </h1>
            <p className="text-gray-600 mt-2">
              {language === 'English'
                ? 'Manage your IT assets and support requests'
                : 'إدارة أصول تكنولوجيا المعلومات وطلبات الدعم الخاصة بك'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {(statsLoading || isEmployeeLoading) && canAccessPortal && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{translations.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {statsError && canAccessPortal && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{translations.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content */}
        {!statsLoading && !isEmployeeLoading && !statsError && dashboardStats && canAccessPortal && (
          <div className="space-y-6">
            {/* Assets Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {translations.myAssets}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardStats.assetsCount?.total || 0}
                    </div>
                    <p className="text-sm text-gray-600">{translations.totalAssets}</p>
                  </div>
                  {Object.entries(dashboardStats.assetsCount?.byType || {}).map(([type, count]) => (
                    <div key={type} className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        {getAssetIcon(type)}
                      </div>
                      <div className="text-lg font-semibold">{count as number}</div>
                      <p className="text-xs text-gray-600">
                        {translations[type.toLowerCase() as keyof typeof translations] || type}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  {translations.myTickets}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardStats.ticketsCount?.total || 0}
                    </div>
                    <p className="text-sm text-gray-600">{translations.totalTickets}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">
                      {dashboardStats.ticketsCount?.open || 0}
                    </div>
                    <p className="text-xs text-gray-600">{translations.openTickets}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">
                      {dashboardStats.ticketsCount?.inProgress || 0}
                    </div>
                    <p className="text-xs text-gray-600">{translations.inProgressTickets}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {dashboardStats.ticketsCount?.resolved || 0}
                    </div>
                    <p className="text-xs text-gray-600">{translations.resolvedTickets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {translations.recentActivity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardStats.recentActivity?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardStats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">{translations.noRecentActivity}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
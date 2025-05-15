import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function Reports() {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();

  // Translations
  const translations = {
    title: language === 'English' ? 'Reports & Analytics' : 'التقارير والتحليلات',
    description: language === 'English' 
      ? 'View insights and statistics about employees, assets and tickets' 
      : 'عرض الرؤى والإحصاءات حول الموظفين والأصول والتذاكر',
    employeeReports: language === 'English' ? 'Employee Reports' : 'تقارير الموظفين',
    assetReports: language === 'English' ? 'Asset Reports' : 'تقارير الأصول',
    ticketReports: language === 'English' ? 'Ticket Reports' : 'تقارير التذاكر',
    activeVsExited: language === 'English' ? 'Active vs Exited Employees' : 'الموظفون النشطون مقابل المغادرين',
    departmentDistribution: language === 'English' ? 'Department Distribution' : 'توزيع الإدارات',
    employmentType: language === 'English' ? 'Employment Type Summary' : 'ملخص نوع التوظيف',
    upcomingExits: language === 'English' ? 'Upcoming Exits (30 days)' : 'المغادرات القادمة (30 يومًا)',
    assetsByType: language === 'English' ? 'Assets by Type' : 'الأصول حسب النوع',
    assetsByStatus: language === 'English' ? 'Assets by Status' : 'الأصول حسب الحالة',
    assignedVsUnassigned: language === 'English' ? 'Assigned vs Unassigned Assets' : 'الأصول المعينة مقابل غير المعينة',
    warrantyExpiry: language === 'English' ? 'Assets Nearing Warranty Expiry' : 'الأصول التي تقترب من انتهاء الضمان',
    assetValue: language === 'English' ? 'Total Purchase Cost' : 'إجمالي تكلفة الشراء',
    assetUtilization: language === 'English' ? 'Asset Lifespan Utilization' : 'استخدام عمر الأصول',
    ticketsByStatus: language === 'English' ? 'Tickets by Status' : 'التذاكر حسب الحالة',
    ticketsByPriority: language === 'English' ? 'Tickets by Priority' : 'التذاكر حسب الأولوية',
    ticketsByCategory: language === 'English' ? 'Tickets by Category' : 'التذاكر حسب الفئة',
    recentTickets: language === 'English' ? 'Recent Tickets (30 days)' : 'التذاكر الأخيرة (30 يومًا)',
    resolutionTime: language === 'English' ? 'Average Resolution Time' : 'متوسط ​​وقت الحل',
    loading: language === 'English' ? 'Loading...' : 'جار التحميل...',
    active: language === 'English' ? 'Active' : 'نشط',
    exited: language === 'English' ? 'Exited' : 'مغادر',
    assigned: language === 'English' ? 'Assigned' : 'معين',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
    unauthorized: language === 'English' 
      ? 'You do not have permission to access this page' 
      : 'ليس لديك إذن للوصول إلى هذه الصفحة',
  };

  // Check if user has manager access
  if (!hasAccess(2)) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {translations.unauthorized}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch employee reports
  const { 
    data: employeeReports, 
    isLoading: employeeReportsLoading 
  } = useQuery({
    queryKey: ['/api/reports/employees'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch asset reports
  const { 
    data: assetReports, 
    isLoading: assetReportsLoading 
  } = useQuery({
    queryKey: ['/api/reports/assets'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch ticket reports
  const { 
    data: ticketReports, 
    isLoading: ticketReportsLoading 
  } = useQuery({
    queryKey: ['/api/reports/tickets'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Prepare chart data
  const activeVsExitedData = employeeReports ? [
    { name: translations.active, value: employeeReports.activeVsExited.active },
    { name: translations.exited, value: employeeReports.activeVsExited.exited }
  ] : [];

  const departmentData = employeeReports ? Object.entries(employeeReports.departmentCounts).map(([name, value]) => ({
    name,
    value
  })) : [];

  const employmentTypeData = employeeReports ? Object.entries(employeeReports.employmentTypes).map(([name, value]) => ({
    name,
    value
  })) : [];

  const assetsByTypeData = assetReports ? Object.entries(assetReports.assetsByType).map(([name, value]) => ({
    name,
    value
  })) : [];

  const assetsByStatusData = assetReports ? Object.entries(assetReports.assetsByStatus).map(([name, value]) => ({
    name,
    value
  })) : [];

  const assignedVsUnassignedData = assetReports ? [
    { name: translations.assigned, value: assetReports.assignedVsUnassigned.assigned },
    { name: translations.unassigned, value: assetReports.assignedVsUnassigned.unassigned }
  ] : [];

  const ticketsByStatusData = ticketReports ? Object.entries(ticketReports.ticketsByStatus).map(([name, value]) => ({
    name,
    value
  })) : [];

  const ticketsByPriorityData = ticketReports ? Object.entries(ticketReports.ticketsByPriority).map(([name, value]) => ({
    name,
    value
  })) : [];

  const ticketsByCategoryData = ticketReports ? Object.entries(ticketReports.ticketsByCategory).map(([name, value]) => ({
    name,
    value
  })) : [];

  // Colors for charts
  const COLORS = ['#1E40AF', '#4F46E5', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6B7280'];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
        <p className="text-gray-600">{translations.description}</p>
      </div>

      <Tabs defaultValue="employees" className="mb-6">
        <TabsList>
          <TabsTrigger value="employees">{translations.employeeReports}</TabsTrigger>
          <TabsTrigger value="assets">{translations.assetReports}</TabsTrigger>
          <TabsTrigger value="tickets">{translations.ticketReports}</TabsTrigger>
        </TabsList>

        {/* Employee Reports */}
        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active vs Exited Employees */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.activeVsExited}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {employeeReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeVsExitedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {activeVsExitedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.departmentDistribution}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {employeeReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={departmentData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1E40AF" name="Employees" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Employment Type Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.employmentType}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {employeeReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={employmentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {employmentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Exits */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.upcomingExits}</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeReportsLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : employeeReports?.upcomingExits?.length > 0 ? (
                  <div className="overflow-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exit Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeeReports.upcomingExits.map((employee: any) => (
                          <tr key={employee.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.englishName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(employee.exitDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No upcoming exits in the next 30 days
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Reports */}
        <TabsContent value="assets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets by Type */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetsByType}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {assetReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetsByTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assetsByTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Assets by Status */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetsByStatus}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {assetReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={assetsByStatusData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4F46E5" name="Assets" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Assigned vs Unassigned */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assignedVsUnassigned}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {assetReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assignedVsUnassignedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {assignedVsUnassignedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Assets Nearing Warranty Expiry */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.warrantyExpiry}</CardTitle>
              </CardHeader>
              <CardContent>
                {assetReportsLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : assetReports?.nearingWarrantyExpiry?.length > 0 ? (
                  <div className="overflow-auto max-h-80">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Asset ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Warranty Expiry
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assetReports.nearingWarrantyExpiry.map((asset: any) => (
                          <tr key={asset.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {asset.assetId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(asset.warrantyExpiryDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    No assets nearing warranty expiry in the next 90 days
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Purchase Cost */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetValue}</CardTitle>
              </CardHeader>
              <CardContent className="h-40 flex items-center justify-center">
                {assetReportsLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="text-center">
                    <h3 className="text-4xl font-bold text-primary">
                      ${assetReports?.totalPurchaseCost.toLocaleString()}
                    </h3>
                    <p className="text-gray-500 mt-2">Total investment in IT assets</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Asset Lifespan Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetUtilization}</CardTitle>
              </CardHeader>
              <CardContent>
                {assetReportsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : assetReports?.assetLifespanUtilization?.length > 0 ? (
                  <div className="overflow-auto max-h-40">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Asset ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilization
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assetReports.assetLifespanUtilization.map((asset: any) => (
                          <tr key={asset.assetId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {asset.assetId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {asset.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-primary h-2.5 rounded-full" 
                                  style={{ width: `${asset.utilizationPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs">{asset.utilizationPercentage}%</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-500">
                    No asset lifespan data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ticket Reports */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tickets by Status */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.ticketsByStatus}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {ticketReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketsByStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ticketsByStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Tickets by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.ticketsByPriority}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {ticketReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ticketsByPriorityData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8B5CF6" name="Tickets" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Tickets by Category */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.ticketsByCategory}</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {ticketReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketsByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ticketsByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Recent Tickets & Resolution Time */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.recentTickets}</CardTitle>
              </CardHeader>
              <CardContent className="h-40">
                {ticketReportsLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <div className="flex flex-col space-y-4">
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-primary">
                        {ticketReports?.recentTicketsCount || 0}
                      </h3>
                      <p className="text-gray-500">Tickets submitted in the last 30 days</p>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-secondary">
                        {translations.resolutionTime}: {ticketReports?.averageResolutionTime || 'N/A'}
                      </h3>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

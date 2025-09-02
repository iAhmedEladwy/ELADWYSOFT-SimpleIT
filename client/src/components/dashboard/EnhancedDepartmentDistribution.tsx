// client/src/components/dashboard/EnhancedDepartmentDistribution.tsx
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Package } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface DepartmentDistributionProps {
  data?: {
    employees: Record<string, number>;
    assets: Record<string, number>;
  };
  isLoading: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function EnhancedDepartmentDistribution({ data, isLoading }: DepartmentDistributionProps) {
  const { language } = useLanguage();

  const translations = {
    departmentDistribution: language === 'English' ? 'Department Distribution' : 'توزيع الأقسام',
    employees: language === 'English' ? 'Employees' : 'الموظفون',
    assets: language === 'English' ? 'Assets' : 'الأصول',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    total: language === 'English' ? 'Total' : 'المجموع',
    department: language === 'English' ? 'Department' : 'القسم',
    count: language === 'English' ? 'Count' : 'العدد',
    noData: language === 'English' ? 'No data available' : 'لا توجد بيانات',
  };

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const employeeData = Object.entries(data?.employees || {}).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / Object.values(data?.employees || {}).reduce((a, b) => a + b, 0)) * 100)
  }));

  const assetData = Object.entries(data?.assets || {}).map(([name, value]) => ({
    name,
    value,
    percentage: Math.round((value / Object.values(data?.assets || {}).reduce((a, b) => a + b, 0)) * 100)
  }));

  const combinedData = Object.keys({ ...data?.employees, ...data?.assets }).map(dept => ({
    department: dept,
    employees: data?.employees[dept] || 0,
    assets: data?.assets[dept] || 0,
  }));

  const totalEmployees = Object.values(data?.employees || {}).reduce((a, b) => a + b, 0);
  const totalAssets = Object.values(data?.assets || {}).reduce((a, b) => a + b, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} ({entry.payload.percentage}%)
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any, type: 'employees' | 'assets') => {
    if (type === 'employees') {
      window.location.href = `/employees?department=${data.department}`;
    } else {
      window.location.href = `/assets?department=${data.department}`;
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {translations.departmentDistribution}
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {totalEmployees} {translations.employees}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Package className="h-3 w-3" />
            {totalAssets} {translations.assets}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="combined" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="combined">Combined</TabsTrigger>
            <TabsTrigger value="employees">{translations.employees}</TabsTrigger>
            <TabsTrigger value="assets">{translations.assets}</TabsTrigger>
          </TabsList>

          <TabsContent value="combined" className="mt-4">
            {combinedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="department" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="employees" 
                    fill="#3B82F6" 
                    name={translations.employees}
                    onClick={(data) => handleBarClick(data, 'employees')}
                    className="cursor-pointer hover:opacity-80"
                  />
                  <Bar 
                    dataKey="assets" 
                    fill="#10B981" 
                    name={translations.assets}
                    onClick={(data) => handleBarClick(data, 'assets')}
                    className="cursor-pointer hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {translations.noData}
              </div>
            )}
          </TabsContent>

          <TabsContent value="employees" className="mt-4">
            {employeeData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={employeeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {employeeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          onClick={() => window.location.href = `/employees?department=${entry.name}`}
                          className="cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {employeeData.map((dept, index) => (
                    <div
                      key={dept.name}
                      onClick={() => window.location.href = `/employees?department=${dept.name}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{dept.value}</Badge>
                        <span className="text-xs text-gray-500">{dept.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {translations.noData}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assets" className="mt-4">
            {assetData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={assetData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          onClick={() => window.location.href = `/assets?department=${entry.name}`}
                          className="cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {assetData.map((dept, index) => (
                    <div
                      key={dept.name}
                      onClick={() => window.location.href = `/assets?department=${dept.name}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{dept.value}</Badge>
                        <span className="text-xs text-gray-500">{dept.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {translations.noData}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
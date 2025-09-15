import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { useCurrency } from '@/lib/currencyContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  Ticket,
  Download,
  Filter,
  Calendar as CalendarIcon,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Activity,
  Monitor,
  Settings2,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Shield,
  Zap,
  Target,
  Heart,
  Cpu,
  Database,
  PiggyBank,
  Gauge
} from 'lucide-react';
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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';

export default function Reports() {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();
  const { formatCurrency } = useCurrency();

  // State for filtering and customization
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'line'>('pie');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'all' | 'employees' | 'assets' | 'tickets'>('all');

  // Enhanced translations
  const translations = {
    title: language === 'English' ? 'Reports & Analytics' : 'التقارير والتحليلات',
    description: language === 'English' 
      ? 'View insights and statistics about employees, assets and tickets' 
      : 'عرض الرؤى والإحصاءات حول الموظفين والأصول والتذاكر',
    
    // Tab titles
    employeeReports: language === 'English' ? 'Employee Reports' : 'تقارير الموظفين',
    assetReports: language === 'English' ? 'Asset Reports' : 'تقارير الأصول',
    ticketReports: language === 'English' ? 'Ticket Reports' : 'تقارير التذاكر',
    overview: language === 'English' ? 'Overview' : 'نظرة عامة',
    
    // Chart titles - Employee
    activeVsExited: language === 'English' ? 'Active vs Exited Employees' : 'الموظفون النشطون مقابل المغادرين',
    departmentDistribution: language === 'English' ? 'Department Distribution' : 'توزيع الإدارات',
    employmentType: language === 'English' ? 'Employment Type Summary' : 'ملخص نوع التوظيف',
    upcomingExits: language === 'English' ? 'Upcoming Exits (30 days)' : 'المغادرات القادمة (30 يومًا)',
    newHires: language === 'English' ? 'New Hires (Last 90 days)' : 'التوظيفات الجديدة (آخر 90 يوم)',
    turnoverRate: language === 'English' ? 'Turnover Analysis' : 'تحليل معدل الدوران',
    
    // Chart titles - Asset
    assetsByType: language === 'English' ? 'Assets by Type' : 'الأصول حسب النوع',
    assetsByStatus: language === 'English' ? 'Assets by Status' : 'الأصول حسب الحالة',
    assignedVsUnassigned: language === 'English' ? 'Assigned vs Unassigned Assets' : 'الأصول المعينة مقابل غير المعينة',
    warrantyExpiry: language === 'English' ? 'Assets Nearing Warranty Expiry' : 'الأصول التي تقترب من انتهاء الضمان',
    assetValue: language === 'English' ? 'Total Purchase Cost' : 'إجمالي تكلفة الشراء',
    assetUtilization: language === 'English' ? 'Asset Lifespan Utilization' : 'استخدام عمر الأصول',
    maintenanceCosts: language === 'English' ? 'Maintenance Costs by Type' : 'تكاليف الصيانة حسب النوع',
    assetAge: language === 'English' ? 'Asset Age Distribution' : 'توزيع أعمار الأصول',
    
    // Chart titles - Ticket
    ticketsByStatus: language === 'English' ? 'Tickets by Status' : 'التذاكر حسب الحالة',
    ticketsByPriority: language === 'English' ? 'Tickets by Priority' : 'التذاكر حسب الأولوية',
    ticketsByCategory: language === 'English' ? 'Tickets by Category' : 'التذاكر حسب الفئة',
    recentTickets: language === 'English' ? 'Recent Tickets (30 days)' : 'التذاكر الأخيرة (30 يومًا)',
    resolutionTime: language === 'English' ? 'Average Resolution Time' : 'متوسط ​​وقت الحل',
    ticketTrends: language === 'English' ? 'Ticket Volume Trends' : 'اتجاهات حجم التذاكر',
    
    // Controls and actions
    filters: language === 'English' ? 'Filters' : 'المرشحات',
    exportData: language === 'English' ? 'Export Data' : 'تصدير البيانات',
    chartType: language === 'English' ? 'Chart Type' : 'نوع المخطط',
    dateRange: language === 'English' ? 'Date Range' : 'النطاق الزمني',
    dateFrom: language === 'English' ? 'From Date' : 'من تاريخ',
    dateTo: language === 'English' ? 'To Date' : 'إلى تاريخ',
    applyFilters: language === 'English' ? 'Apply Filters' : 'تطبيق المرشحات',
    resetFilters: language === 'English' ? 'Reset' : 'إعادة تعيين',
    
    // Status and values
    loading: language === 'English' ? 'Loading...' : 'جار التحميل...',
    active: language === 'English' ? 'Active' : 'نشط',
    exited: language === 'English' ? 'Exited' : 'مغادر',
    assigned: language === 'English' ? 'Assigned' : 'معين',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
    inUse: language === 'English' ? 'in use' : 'قيد الاستخدام',
    open: language === 'English' ? 'open' : 'مفتوح',
    total: language === 'English' ? 'Total' : 'المجموع',
    noData: language === 'English' ? 'No data available' : 'لا توجد بيانات متاحة',
    
    // Summary cards
    totalEmployees: language === 'English' ? 'Total Employees' : 'إجمالي الموظفين',
    totalAssets: language === 'English' ? 'Total Assets' : 'إجمالي الأصول',
    totalTickets: language === 'English' ? 'Total Tickets' : 'إجمالي التذاكر',
    totalValue: language === 'English' ? 'Total Asset Value' : 'إجمالي قيمة الأصول',
    
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
    isLoading: employeeReportsLoading,
    error: employeeReportsError,
    refetch: refetchEmployeeReports
  } = useQuery({
    queryKey: ['/api/reports/employees'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch asset reports
  const { 
    data: assetReports, 
    isLoading: assetReportsLoading,
    error: assetReportsError,
    refetch: refetchAssetReports
  } = useQuery({
    queryKey: ['/api/reports/assets'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch ticket reports
  const { 
    data: ticketReports, 
    isLoading: ticketReportsLoading,
    error: ticketReportsError,
    refetch: refetchTicketReports
  } = useQuery({
    queryKey: ['/api/reports/tickets'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Check for any errors
  const hasErrors = employeeReportsError || assetReportsError || ticketReportsError;

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

  const ticketsByCategoryData = ticketReports ? Object.entries(ticketReports.ticketsByRequestType).map(([name, value]) => ({
    name,
    value
  })) : [];

  // Modern color palette for charts
  const MODERN_COLORS = [
    '#6366F1', // Modern indigo
    '#8B5CF6', // Modern purple  
    '#EC4899', // Modern pink
    '#F59E0B', // Modern amber
    '#10B981', // Modern emerald
    '#3B82F6', // Modern blue
    '#EF4444', // Modern red
    '#84CC16', // Modern lime
    '#F97316', // Modern orange
    '#06B6D4', // Modern cyan
    '#8B5A2B', // Modern brown
    '#6B7280'  // Modern gray
  ];
  
  const GRADIENT_COLORS = [
    'from-indigo-500 to-purple-600',
    'from-purple-500 to-pink-600', 
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-red-500 to-pink-600',
    'from-lime-500 to-green-600'
  ];

  // Filter functionality
  const applyFilters = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    // Create filters object
    const filters = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      chartType: selectedChartType,
      reportType: selectedReportType
    };

    // Apply filters to data
    console.log('Applying filters:', filters);
    
    // Re-fetch data with date filters
    const fetchFilteredData = async () => {
      try {
        // For employee data
        if (selectedReportType === 'employees' || selectedReportType === 'all') {
          await refetchEmployeeReports();
        }
        
        // For asset data
        if (selectedReportType === 'assets' || selectedReportType === 'all') {
          await refetchAssetReports();
        }
        
        // For ticket data
        if (selectedReportType === 'tickets' || selectedReportType === 'all') {
          await refetchTicketReports();
        }

        // Show success message
        alert(`Filters applied successfully! Date range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}, Chart type: ${selectedChartType}`);
      } catch (error) {
        console.error('Error applying filters:', error);
        alert('Error applying filters. Please try again.');
      }
    };

    fetchFilteredData();
  };

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedChartType('bar');
    setSelectedReportType('all');
    setDateRange({ from: '', to: '' });
    
    // Refetch all data
    refetchEmployeeReports();
    refetchAssetReports();
    refetchTicketReports();
    
    alert('Filters reset successfully!');
  };

  // Export functionality
  const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    try {
      // Use provided headers or extract from first data object
      const csvHeaders = headers || Object.keys(data[0]);
      
      // Create CSV content
      const csvContent = [
        csvHeaders.join(','), // Header row
        ...data.map(row => 
          csvHeaders.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Enhanced export with multiple datasets
  const exportAllData = () => {
    const allData = [
      ...activeVsExitedData.map(item => ({ ...item, category: 'Employee Status' })),
      ...departmentData.map(item => ({ ...item, category: 'Department Distribution' })),
      ...assetsByTypeData.map(item => ({ ...item, category: 'Assets by Type' })),
      ...assetsByStatusData.map(item => ({ ...item, category: 'Assets by Status' })),
      ...ticketsByStatusData.map(item => ({ ...item, category: 'Tickets by Status' })),
      ...ticketsByPriorityData.map(item => ({ ...item, category: 'Tickets by Priority' }))
    ];
    
    exportToCSV(allData, 'complete-reports-data', ['category', 'name', 'value']);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-6 space-y-6">
        {/* Error Message */}
        {hasErrors && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {language === 'English' 
                    ? 'Unable to load some reports data. Please try refreshing the page.' 
                    : 'تعذر تحميل بعض بيانات التقارير. يرجى تحديث الصفحة.'}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Enhanced Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{translations.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">{translations.description}</p>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>{translations.filters}</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={exportAllData}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{translations.exportData}</span>
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{translations.dateFrom}</Label>
                  <Calendar
                    mode="picker"
                    value={dateRange.from}
                    onChange={(value) => setDateRange(prev => ({ ...prev, from: value || '' }))}
                    placeholder={translations.dateFrom}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{translations.dateTo}</Label>
                  <Calendar
                    mode="picker"
                    value={dateRange.to}
                    onChange={(value) => setDateRange(prev => ({ ...prev, to: value || '' }))}
                    placeholder={translations.dateTo}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{translations.chartType}</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={selectedChartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChartType('pie')}
                      className="flex-1"
                    >
                      <PieChartIcon className="h-4 w-4 mr-1" />
                      Pie
                    </Button>
                    <Button
                      variant={selectedChartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChartType('bar')}
                      className="flex-1"
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Bar
                    </Button>
                    <Button
                      variant={selectedChartType === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedChartType('line')}
                      className="flex-1"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Line
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={resetFilters}>
                  {translations.resetFilters}
                </Button>
                <Button onClick={applyFilters}>
                  {translations.applyFilters}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UITooltip>
            <TooltipTrigger asChild>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">{translations.totalEmployees}</p>
                    {employeeReportsLoading ? (
                      <Skeleton className="h-8 w-16 bg-indigo-400/30" />
                    ) : (
                      <p className="text-3xl font-bold">{activeVsExitedData.find(item => item.name === translations.active)?.value || 0}</p>
                    )}
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {employeeReportsLoading ? (
                        <Skeleton className="h-4 w-20 bg-indigo-400/30" />
                      ) : (
                        <span className="text-sm text-indigo-100">
                          +{Math.round(((activeVsExitedData.find(item => item.name === translations.active)?.value || 0) / 
                          (activeVsExitedData.reduce((sum, item) => sum + (item.value as number), 0) || 1)) * 100)}% {translations.active}
                        </span>
                      )}
                    </div>
                  </div>
                  <Users className="h-10 w-10 text-indigo-200" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {language === 'English' 
                  ? 'Total number of active employees in the organization. This metric shows currently working staff and their percentage of the total workforce.'
                  : 'العدد الإجمالي للموظفين النشطين في المنظمة. يُظهر هذا المؤشر الموظفين العاملين حاليًا ونسبتهم من إجمالي القوى العاملة.'
                }
              </p>
            </TooltipContent>
          </UITooltip>

          <UITooltip>
            <TooltipTrigger asChild>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">{translations.totalAssets}</p>
                    {assetReportsLoading ? (
                      <Skeleton className="h-8 w-16 bg-emerald-400/30" />
                    ) : (
                      <p className="text-3xl font-bold">{assetsByStatusData.reduce((sum, item) => sum + (item.value as number), 0)}</p>
                    )}
                    <div className="flex items-center mt-2">
                      <Activity className="h-4 w-4 mr-1" />
                      {assetReportsLoading ? (
                        <Skeleton className="h-4 w-20 bg-emerald-400/30" />
                      ) : (
                        <span className="text-sm text-emerald-100">
                          {assetsByStatusData.find(item => item.name === 'Active')?.value || 0} {translations.inUse}
                        </span>
                      )}
                    </div>
                  </div>
                  <Monitor className="h-10 w-10 text-emerald-200" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {language === 'English' 
                  ? 'Total number of IT assets in your inventory including computers, monitors, servers, and other equipment. Shows active assets currently in use.'
                  : 'العدد الإجمالي لأصول تكنولوجيا المعلومات في المخزون بما في ذلك أجهزة الكمبيوتر والشاشات والخوادم والمعدات الأخرى. يُظهر الأصول النشطة قيد الاستخدام حاليًا.'
                }
              </p>
            </TooltipContent>
          </UITooltip>

          <UITooltip>
            <TooltipTrigger asChild>
              <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm font-medium">{translations.totalTickets}</p>
                    {ticketReportsLoading ? (
                      <Skeleton className="h-8 w-16 bg-pink-400/30" />
                    ) : (
                      <p className="text-3xl font-bold">{ticketsByStatusData.reduce((sum, item) => sum + (item.value as number), 0)}</p>
                    )}
                    <div className="flex items-center mt-2">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {ticketReportsLoading ? (
                        <Skeleton className="h-4 w-20 bg-pink-400/30" />
                      ) : (
                        <span className="text-sm text-pink-100">
                          {ticketsByStatusData.find(item => item.name === 'Open')?.value || 0} {translations.open}
                        </span>
                      )}
                    </div>
                  </div>
                  <Ticket className="h-10 w-10 text-pink-200" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {language === 'English' 
                  ? 'Total number of support tickets submitted by users. Includes all ticket statuses with emphasis on currently open tickets requiring attention.'
                  : 'العدد الإجمالي لتذاكر الدعم المقدمة من المستخدمين. يشمل جميع حالات التذاكر مع التركيز على التذاكر المفتوحة حاليًا التي تتطلب الاهتمام.'
                }
              </p>
            </TooltipContent>
          </UITooltip>

          <UITooltip>
            <TooltipTrigger asChild>
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">{translations.totalValue}</p>
                    {assetReportsLoading ? (
                      <Skeleton className="h-8 w-20 bg-amber-400/30" />
                    ) : (
                      <p className="text-3xl font-bold">{formatCurrency(assetReports?.totalPurchaseCost || 0)}</p>
                    )}
                    <div className="flex items-center mt-2">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-sm text-amber-100">{translations.assetValue}</span>
                    </div>
                  </div>
                  <DollarSign className="h-10 w-10 text-amber-200" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {language === 'English' 
                  ? 'Total monetary value of all IT assets in your organization. This represents the cumulative investment in hardware, software licenses, and technology infrastructure.'
                  : 'القيمة النقدية الإجمالية لجميع أصول تكنولوجيا المعلومات في مؤسستك. وهذا يمثل الاستثمار التراكمي في الأجهزة وتراخيص البرامج والبنية التحتية التكنولوجية.'
                }
              </p>
            </TooltipContent>
          </UITooltip>
        </div>

        {/* Enhanced Tabbed Reports Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <Tabs defaultValue="employees" className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent p-1">
                <TabsTrigger 
                  value="employees" 
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border border-transparent rounded-lg px-4 py-2"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {translations.employeeReports}
                </TabsTrigger>
                <TabsTrigger 
                  value="assets" 
                  className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 border border-transparent rounded-lg px-4 py-2"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  {translations.assetReports}
                </TabsTrigger>
                <TabsTrigger 
                  value="tickets" 
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 border border-transparent rounded-lg px-4 py-2"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  {translations.ticketReports}
                </TabsTrigger>
              </TabsList>
            </div>

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
                          <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
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
                          <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
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
                          <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
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
                          <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
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
                      {formatCurrency(assetReports?.totalPurchaseCost || 0)}
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
                          <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
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
                          <Cell key={`cell-${index}`} fill={MODERN_COLORS[index % MODERN_COLORS.length]} />
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

        {/* Additional Analytics Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-blue-600" />
            System Analytics & KPIs
          </h2>
          
          {/* Performance Metrics Grid - Only Real Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {/* Asset Utilization Rate */}
            {assetReports && assignedVsUnassignedData.length > 0 && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Asset Utilization</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {Math.round((assignedVsUnassignedData.find(item => item.name === translations.assigned)?.value || 0) / 
                          (assignedVsUnassignedData.reduce((sum, item) => sum + (item.value as number), 0) || 1) * 100)}%
                        </p>
                        <p className="text-xs text-blue-500">Assigned Assets</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {language === 'English' 
                      ? 'Percentage of assets currently assigned to employees versus total assets in inventory.'
                      : 'نسبة الأصول المعينة حاليًا للموظفين مقابل إجمالي الأصول في المخزون.'
                    }
                  </p>
                </TooltipContent>
              </UITooltip>
            )}

            {/* Total Assets Count */}
            {assetReports && assetsByStatusData.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Assets</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {assetsByStatusData.reduce((sum, item) => sum + (item.value as number), 0)}
                    </p>
                    <p className="text-xs text-emerald-500">In System</p>
                  </div>
                  <Monitor className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
            )}

            {/* Active Employees */}
            {employeeReports && activeVsExitedData.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Employees</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {activeVsExitedData.find(item => item.name === translations.active)?.value || 0}
                    </p>
                    <p className="text-xs text-purple-500">Currently Working</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            )}

            {/* Total Tickets */}
            {ticketReports && ticketsByStatusData.length > 0 && (
              <div className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Total Tickets</p>
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                      {ticketsByStatusData.reduce((sum, item) => sum + (item.value as number), 0)}
                    </p>
                    <p className="text-xs text-rose-500">All Time</p>
                  </div>
                  <Ticket className="h-8 w-8 text-rose-500" />
                </div>
              </div>
            )}

            {/* Open Tickets */}
            {ticketReports && ticketsByStatusData.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Open Tickets</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {ticketsByStatusData.find(item => item.name === 'Open')?.value || 0}
                    </p>
                    <p className="text-xs text-amber-500">Needs Attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </div>
            )}

            {/* Cost Per Employee */}
            {assetReports && employeeReports && assetReports.totalPurchaseCost && activeVsExitedData.length > 0 && (
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg p-4 cursor-help">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Cost per Employee</p>
                        <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                          {formatCurrency(
                            Math.round(assetReports.totalPurchaseCost / 
                            (activeVsExitedData.find(item => item.name === translations.active)?.value || 1))
                          )}
                        </p>
                        <p className="text-xs text-teal-500">Asset Investment</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-teal-500" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    {language === 'English' 
                      ? 'Average cost of IT assets per active employee. Calculated from total asset value divided by active employees.'
                      : 'متوسط تكلفة أصول تكنولوجيا المعلومات لكل موظف نشط. محسوب من إجمالي قيمة الأصول مقسوم على الموظفين النشطين.'
                    }
                  </p>
                </TooltipContent>
              </UITooltip>
            )}

            {/* Average Resolution Time */}
            {ticketReports && ticketReports.averageResolutionTime && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Avg Resolution</p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                      {ticketReports.averageResolutionTime}
                    </p>
                    <p className="text-xs text-indigo-500">Ticket Response</p>
                  </div>
                  <Clock className="h-8 w-8 text-indigo-500" />
                </div>
              </div>
            )}

            {/* Recent Tickets Count */}
            {ticketReports && ticketReports.recentTicketsCount !== undefined && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Recent Tickets</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {ticketReports.recentTicketsCount}
                    </p>
                    <p className="text-xs text-green-500">Last 30 Days</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </div>
            )}
          </div>

          {/* Asset Financial Summary - Only Real Data */}
          {assetReports && assetReports.totalPurchaseCost && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Asset Financial Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Total Asset Investment</h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(assetReports.totalPurchaseCost)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current portfolio value
                  </p>
                </div>
                
                {activeVsExitedData.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Investment per Employee</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(
                        Math.round(assetReports.totalPurchaseCost / 
                        (activeVsExitedData.find(item => item.name === translations.active)?.value || 1))
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Assets per active employee
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </Tabs>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

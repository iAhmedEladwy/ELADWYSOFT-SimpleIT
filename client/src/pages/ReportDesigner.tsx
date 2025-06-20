import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart3, PieChart, LineChart, Table, Download, Plus, Settings } from 'lucide-react';

type ReportType = 'table' | 'bar' | 'pie' | 'line';
type DataSource = 'employees' | 'assets' | 'tickets' | 'maintenance' | 'transactions';

interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  dataSource: DataSource;
  fields: string[];
  filters: Record<string, any>;
  groupBy?: string;
  sortBy?: string;
}

export default function ReportDesigner() {
  const { language } = useLanguage();
  const [activeReport, setActiveReport] = useState<ReportConfig | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource>('employees');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportType, setReportType] = useState<ReportType>('table');

  const translations = {
    title: language === 'English' ? 'Report Designer' : 'مصمم التقارير',
    description: language === 'English' ? 'Create custom reports and analytics' : 'إنشاء تقارير مخصصة وتحليلات',
    dataSource: language === 'English' ? 'Data Source' : 'مصدر البيانات',
    reportType: language === 'English' ? 'Report Type' : 'نوع التقرير',
    fields: language === 'English' ? 'Fields' : 'الحقول',
    preview: language === 'English' ? 'Preview' : 'معاينة',
    export: language === 'English' ? 'Export' : 'تصدير',
    save: language === 'English' ? 'Save Report' : 'حفظ التقرير',
    newReport: language === 'English' ? 'New Report' : 'تقرير جديد',
    employees: language === 'English' ? 'Employees' : 'الموظفين',
    assets: language === 'English' ? 'Assets' : 'الأصول',
    tickets: language === 'English' ? 'Tickets' : 'التذاكر',
    maintenance: language === 'English' ? 'Maintenance' : 'الصيانة',
    transactions: language === 'English' ? 'Transactions' : 'المعاملات',
    table: language === 'English' ? 'Table' : 'جدول',
    barChart: language === 'English' ? 'Bar Chart' : 'رسم بياني شريطي',
    pieChart: language === 'English' ? 'Pie Chart' : 'رسم بياني دائري',
    lineChart: language === 'English' ? 'Line Chart' : 'رسم بياني خطي',
  };

  // Fetch available data sources and their fields
  const { data: employeesData } = useQuery({
    queryKey: ['/api/employees'],
    enabled: selectedDataSource === 'employees'
  });

  const { data: assetsData } = useQuery({
    queryKey: ['/api/assets'],
    enabled: selectedDataSource === 'assets'
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['/api/tickets'],
    enabled: selectedDataSource === 'tickets'
  });

  // Define available fields for each data source
  const dataSourceFields = {
    employees: ['name', 'department', 'position', 'joiningDate', 'status', 'email'],
    assets: ['assetId', 'name', 'type', 'brand', 'status', 'purchasePrice', 'assignedTo'],
    tickets: ['ticketId', 'title', 'type', 'priority', 'status', 'assignedTo', 'createdAt'],
    maintenance: ['assetId', 'type', 'date', 'cost', 'description', 'status'],
    transactions: ['assetId', 'type', 'date', 'amount', 'description', 'fromUser', 'toUser']
  };

  const reportTypeIcons = {
    table: <Table className="h-4 w-4" />,
    bar: <BarChart3 className="h-4 w-4" />,
    pie: <PieChart className="h-4 w-4" />,
    line: <LineChart className="h-4 w-4" />
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const generateReport = () => {
    const newReport: ReportConfig = {
      id: Date.now().toString(),
      name: `${translations[selectedDataSource]} ${translations[reportType]} Report`,
      type: reportType,
      dataSource: selectedDataSource,
      fields: selectedFields,
      filters: {},
    };
    setActiveReport(newReport);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implementation for report export
    console.log(`Exporting report as ${format}`);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{translations.title}</h1>
          <p className="text-gray-600 mt-1">{translations.description}</p>
        </div>
        <Button onClick={() => setActiveReport(null)} className="btn-enhanced">
          <Plus className="h-4 w-4 mr-2" />
          {translations.newReport}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Configuration
              </CardTitle>
              <CardDescription>
                Set up your report parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Source Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{translations.dataSource}</label>
                <Select value={selectedDataSource} onValueChange={(value: DataSource) => setSelectedDataSource(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employees">{translations.employees}</SelectItem>
                    <SelectItem value="assets">{translations.assets}</SelectItem>
                    <SelectItem value="tickets">{translations.tickets}</SelectItem>
                    <SelectItem value="maintenance">{translations.maintenance}</SelectItem>
                    <SelectItem value="transactions">{translations.transactions}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Report Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{translations.reportType}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(reportTypeIcons).map(([type, icon]) => (
                    <Button
                      key={type}
                      variant={reportType === type ? "default" : "outline"}
                      onClick={() => setReportType(type as ReportType)}
                      className="flex items-center justify-center p-3"
                    >
                      {icon}
                      <span className="ml-2 text-xs">
                        {translations[type as keyof typeof translations]}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Fields Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{translations.fields}</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {dataSourceFields[selectedDataSource].map(field => (
                    <div key={field} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={field}
                        checked={selectedFields.includes(field)}
                        onChange={() => handleFieldToggle(field)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={field} className="text-sm capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Button 
                onClick={generateReport} 
                className="w-full btn-enhanced"
                disabled={selectedFields.length === 0}
              >
                {translations.preview}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{translations.preview}</CardTitle>
                {activeReport && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportReport('csv')}
                      className="btn-enhanced"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportReport('excel')}
                      className="btn-enhanced"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportReport('pdf')}
                      className="btn-enhanced"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeReport ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{activeReport.dataSource}</Badge>
                    <Badge variant="outline">{activeReport.type}</Badge>
                    <Badge variant="outline">{activeReport.fields.length} fields</Badge>
                  </div>
                  
                  {/* Report Preview Content */}
                  <div className="border rounded-lg p-4 min-h-96 bg-gray-50">
                    <div className="text-center text-gray-500 mt-20">
                      <div className="text-6xl mb-4">
                        {reportTypeIcons[activeReport.type]}
                      </div>
                      <h3 className="text-lg font-medium">{activeReport.name}</h3>
                      <p className="text-sm mt-2">
                        Preview will show data from {activeReport.dataSource} as {activeReport.type}
                      </p>
                      <p className="text-xs mt-1 text-gray-400">
                        Fields: {activeReport.fields.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-20">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium">No Report Selected</h3>
                  <p className="text-sm mt-2">Configure your report settings and click preview to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
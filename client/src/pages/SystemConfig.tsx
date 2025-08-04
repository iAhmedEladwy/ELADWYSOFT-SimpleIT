import { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, Settings, Download, Upload, FileDown, FileUp, 
  X, CheckCircle2, AlertCircle, Loader2, Database,
  Mail, Shield, Globe, Filter, Clock, Trash, Monitor, User
} from 'lucide-react';
import { FieldMappingInterface } from '@/components/import/FieldMappingInterface';

// Types
interface SystemConfig {
  id: string;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  employeePrefix: string;
  assetPrefix: string;
  ticketPrefix: string;
  language: 'English' | 'Arabic';
  timezone: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'auto';
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors?: string[];
}

// Data type options for the new interface
const DATA_TYPE_OPTIONS = [
  { 
    value: 'employees', 
    label: { English: 'Employees', Arabic: 'الموظفون' },
    description: { English: 'Manage employee records and information', Arabic: 'إدارة سجلات ومعلومات الموظفين' },
    icon: Users,
    color: 'text-blue-600'
  },
  { 
    value: 'assets', 
    label: { English: 'Assets', Arabic: 'الأصول' },
    description: { English: 'Manage IT assets and equipment', Arabic: 'إدارة الأصول والمعدات التقنية' },
    icon: Database,
    color: 'text-green-600'
  },
  { 
    value: 'tickets', 
    label: { English: 'Tickets', Arabic: 'التذاكر' },
    description: { English: 'Manage support tickets and requests', Arabic: 'إدارة تذاكر الدعم والطلبات' },
    icon: Clock,
    color: 'text-orange-600'
  }
];

const SystemConfig = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [config, setConfig] = useState<SystemConfig>({
    id: '1',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPassword: '',
    employeePrefix: 'EMP-',
    assetPrefix: 'AST-',
    ticketPrefix: 'TKT-',
    language: 'English',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    theme: 'light'
  });

  // Import/Export state
  const [selectedDataType, setSelectedDataType] = useState<string>('employees');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Field mapping state
  const [showFieldMapping, setShowFieldMapping] = useState(false);
  const [parsedFileData, setParsedFileData] = useState<any[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);

  const language = config.language;

  // Queries
  const { data: systemConfig, isLoading } = useQuery({
    queryKey: ['/api/config'],
  });

  // Update config when data is loaded
  useEffect(() => {
    if (systemConfig) {
      setConfig(systemConfig);
    }
  }, [systemConfig]);

  // Mutations
  const updateConfigMutation = useMutation({
    mutationFn: (newConfig: SystemConfig) => 
      apiRequest('/api/config', 'PUT', newConfig),
    onSuccess: () => {
      toast({
        title: language === 'English' ? 'Settings Updated' : 'تم تحديث الإعدادات',
        description: language === 'English' ? 'Configuration saved successfully.' : 'تم حفظ التكوين بنجاح.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/config'] });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to save settings.' : 'فشل في حفظ الإعدادات.',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleSaveConfig = () => {
    updateConfigMutation.mutate(config);
  };

  const handleConfigChange = (field: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // File handling
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResults(null);
      setImportError(null);
    }
  };

  const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportResults(null);
      setImportError(null);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  // Import/Export functions
  const handleFileImport = async () => {
    if (!selectedFile) return;

    try {
      // Parse CSV file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', selectedDataType);

      const previewResponse = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!previewResponse.ok) {
        throw new Error('Failed to parse file');
      }

      const previewData = await previewResponse.json();
      
      setParsedFileData(previewData.data || []);
      setFileColumns(previewData.columns || []);
      setShowFieldMapping(true);
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to process file');
    }
  };

  // Field mapping types
  interface FieldMapping {
    sourceColumn: string | null;
    targetField: string;
    isValid: boolean;
    warnings: string[];
  }

  const handleMappingComplete = async (mappings: FieldMapping[]) => {
    try {
      setIsImporting(true);
      setImportProgress(0);
      setShowFieldMapping(false);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(`/api/import/${selectedDataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: parsedFileData,
          fieldMapping: mappings,
        }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      setImportResults(result);
      setSelectedFile(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedDataType}`] });
      
      toast({
        title: language === 'English' ? 'Import Successful' : 'تم الاستيراد بنجاح',
        description: language === 'English' 
          ? `Successfully imported ${result.imported} records.` 
          : `تم استيراد ${result.imported} سجل بنجاح.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
      toast({
        title: language === 'English' ? 'Import Failed' : 'فشل الاستيراد',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setTimeout(() => setImportProgress(0), 2000);
    }
  };

  const handleMappingCancel = () => {
    setShowFieldMapping(false);
    setParsedFileData([]);
    setFileColumns([]);
  };

  const handleDownloadTemplate = async (entityType: 'employees' | 'assets' | 'tickets') => {
    try {
      const response = await fetch(`/api/${entityType}/template`);
      if (!response.ok) throw new Error('Failed to download template');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${entityType}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: language === 'English' ? 'Template Downloaded' : 'تم تنزيل القالب',
        description: language === 'English' ? 'Template file saved to downloads.' : 'تم حفظ ملف القالب في التنزيلات.',
      });
    } catch (error) {
      toast({
        title: language === 'English' ? 'Download Failed' : 'فشل التنزيل',
        description: language === 'English' ? 'Failed to download template.' : 'فشل في تنزيل القالب.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (entityType: 'employees' | 'assets' | 'tickets') => {
    try {
      const response = await fetch(`/api/export/${entityType}`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${entityType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: language === 'English' ? 'Export Successful' : 'تم التصدير بنجاح',
        description: language === 'English' ? 'Data exported successfully.' : 'تم تصدير البيانات بنجاح.',
      });
    } catch (error) {
      toast({
        title: language === 'English' ? 'Export Failed' : 'فشل التصدير',
        description: language === 'English' ? 'Failed to export data.' : 'فشل في تصدير البيانات.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">
          {language === 'English' ? 'System Configuration' : 'تكوين النظام'}
        </h1>
      </div>

      <Tabs defaultValue="defaults" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="defaults">
            {language === 'English' ? 'System Defaults' : 'الافتراضات'}
          </TabsTrigger>
          <TabsTrigger value="employees">
            {language === 'English' ? 'Employees' : 'الموظفون'}
          </TabsTrigger>
          <TabsTrigger value="assets">
            {language === 'English' ? 'Assets' : 'الأصول'}
          </TabsTrigger>
          <TabsTrigger value="tickets">
            {language === 'English' ? 'Tickets' : 'التذاكر'}
          </TabsTrigger>
          <TabsTrigger value="email">
            {language === 'English' ? 'Email' : 'البريد الإلكتروني'}
          </TabsTrigger>
          <TabsTrigger value="users">
            {language === 'English' ? 'Users & Roles' : 'المستخدمون والأدوار'}
          </TabsTrigger>
          <TabsTrigger value="import-export">
            {language === 'English' ? 'Import/Export' : 'استيراد/تصدير'}
          </TabsTrigger>
        </TabsList>

        {/* System Defaults Tab */}
        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {language === 'English' ? 'System Defaults' : 'الإعدادات الافتراضية للنظام'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure default system settings and preferences.'
                  : 'تكوين الإعدادات والتفضيلات الافتراضية للنظام.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">
                    {language === 'English' ? 'Default Language' : 'اللغة الافتراضية'}
                  </Label>
                  <Select 
                    value={config.language} 
                    onValueChange={(value: 'English' | 'Arabic') => handleConfigChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Arabic">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    {language === 'English' ? 'Timezone' : 'المنطقة الزمنية'}
                  </Label>
                  <Select 
                    value={config.timezone} 
                    onValueChange={(value) => handleConfigChange('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">
                    {language === 'English' ? 'Date Format' : 'تنسيق التاريخ'}
                  </Label>
                  <Select 
                    value={config.dateFormat} 
                    onValueChange={(value) => handleConfigChange('dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">
                    {language === 'English' ? 'Theme' : 'المظهر'}
                  </Label>
                  <Select 
                    value={config.theme} 
                    onValueChange={(value: 'light' | 'dark' | 'auto') => handleConfigChange('theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{language === 'English' ? 'Light' : 'فاتح'}</SelectItem>
                      <SelectItem value="dark">{language === 'English' ? 'Dark' : 'داكن'}</SelectItem>
                      <SelectItem value="auto">{language === 'English' ? 'Auto' : 'تلقائي'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'ID Prefixes' : 'بادئات المعرفات'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeePrefix">
                      {language === 'English' ? 'Employee Prefix' : 'بادئة الموظف'}
                    </Label>
                    <Input
                      id="employeePrefix"
                      value={config.employeePrefix}
                      onChange={(e) => handleConfigChange('employeePrefix', e.target.value)}
                      placeholder="EMP-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetPrefix">
                      {language === 'English' ? 'Asset Prefix' : 'بادئة الأصل'}
                    </Label>
                    <Input
                      id="assetPrefix"
                      value={config.assetPrefix}
                      onChange={(e) => handleConfigChange('assetPrefix', e.target.value)}
                      placeholder="AST-"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketPrefix">
                      {language === 'English' ? 'Ticket Prefix' : 'بادئة التذكرة'}
                    </Label>
                    <Input
                      id="ticketPrefix"
                      value={config.ticketPrefix}
                      onChange={(e) => handleConfigChange('ticketPrefix', e.target.value)}
                      placeholder="TKT-"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جاري الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      {language === 'English' ? 'Save Settings' : 'حفظ الإعدادات'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {language === 'English' ? 'Data Management' : 'إدارة البيانات'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Import and export data for employees, assets, and tickets.'
                    : 'استيراد وتصدير البيانات للموظفين والأصول والتذاكر.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Type Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <Label className="text-base font-medium">
                      {language === 'English' ? 'Select Data Type' : 'اختيار نوع البيانات'}
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DATA_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedDataType === option.value;
                      return (
                        <Card 
                          key={option.value}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedDataType(option.value)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-8 w-8 ${option.color}`} />
                              <div className="flex-1">
                                <h3 className="font-medium text-sm">
                                  {option.label[language]}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {option.description[language]}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Field Mapping Interface */}
                {showFieldMapping && (
                  <div className="mt-6">
                    <FieldMappingInterface
                      entityType={selectedDataType as 'employees' | 'assets' | 'tickets'}
                      fileData={parsedFileData}
                      fileColumns={fileColumns.map(col => ({ 
                        name: col, 
                        sampleValues: [], 
                        dataType: 'text' as const 
                      }))}
                      onMappingComplete={handleMappingComplete}
                      onCancel={handleMappingCancel}
                    />
                  </div>
                )}

                {/* Action Section - Detailed Interface based on selected action */}
                {!showFieldMapping && (
                  <div className="mt-6">
                    {/* File Upload Interface */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5 text-blue-600" />
                          {language === 'English' ? 'Import Data' : 'استيراد البيانات'}
                        </CardTitle>
                        <CardDescription>
                          {language === 'English' 
                            ? `Upload CSV files to import ${selectedDataType} data into your system.` 
                            : `رفع ملفات CSV لاستيراد بيانات ${selectedDataType} إلى النظام.`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* File Upload Area */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                            dragActive 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onDrop={handleFileDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                        >
                          <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              {language === 'English' 
                                ? 'Drag and drop your CSV file here' 
                                : 'اسحب وأفلت ملف CSV هنا'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'English' ? 'or click to browse' : 'أو انقر للتصفح'}
                            </p>
                            <input
                              id="file-input"
                              type="file"
                              accept=".csv"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('file-input')?.click()}
                              className="mt-2"
                            >
                              {language === 'English' ? 'Choose File' : 'اختيار ملف'}
                            </Button>
                          </div>
                        </div>

                        {/* Selected File Display */}
                        {selectedFile && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border">
                            <div className="flex items-center gap-2">
                              <FileUp className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">{selectedFile.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Button 
                            onClick={() => handleDownloadTemplate(selectedDataType as 'employees' | 'assets' | 'tickets')}
                            variant="outline" 
                            className="w-full"
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Get Template' : 'احصل على القالب'}
                          </Button>
                          
                          <Button 
                            onClick={() => handleExport(selectedDataType as 'employees' | 'assets' | 'tickets')}
                            variant="outline"
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Export Data' : 'تصدير البيانات'}
                          </Button>

                          <Button 
                            onClick={() => {
                              if (selectedFile) {
                                handleFileImport();
                              }
                            }}
                            disabled={!selectedFile || isImporting}
                            className="w-full"
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {language === 'English' ? 'Importing...' : 'جاري الاستيراد...'}
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                {language === 'English' ? 'Import File' : 'استيراد الملف'}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Import Progress */}
                    {isImporting && (
                      <Card className="mt-4">
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            <Progress value={importProgress} className="w-full" />
                            <p className="text-sm text-center text-muted-foreground">
                              {importProgress}% {language === 'English' ? 'complete' : 'مكتمل'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Import Results */}
                    {importResults && (
                      <Card className="mt-4">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-4">
                            {importResults.success ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="font-medium text-lg">
                              {language === 'English' ? 'Import Results' : 'نتائج الاستيراد'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium">{language === 'English' ? 'Total Records' : 'إجمالي السجلات'}</p>
                              <p className="text-2xl font-bold">{importResults.total || 0}</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <p className="font-medium text-green-800">{language === 'English' ? 'Successfully Imported' : 'تم الاستيراد بنجاح'}</p>
                              <p className="text-2xl font-bold text-green-600">{importResults.imported || 0}</p>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg">
                              <p className="font-medium text-red-800">{language === 'English' ? 'Failed' : 'فشل'}</p>
                              <p className="text-2xl font-bold text-red-600">{importResults.failed || 0}</p>
                            </div>
                          </div>
                          {importResults.errors && importResults.errors.length > 0 && (
                            <div className="mt-4 p-4 bg-red-50 rounded-lg">
                              <p className="font-medium text-red-800 mb-2">
                                {language === 'English' ? 'Errors:' : 'الأخطاء:'}
                              </p>
                              <ul className="list-disc list-inside text-red-700 max-h-32 overflow-y-auto text-sm">
                                {importResults.errors.slice(0, 10).map((error: string, index: number) => (
                                  <li key={index}>{error}</li>
                                ))}
                                {importResults.errors.length > 10 && (
                                  <li>
                                    {language === 'English' 
                                      ? `... and ${importResults.errors.length - 10} more errors` 
                                      : `... و ${importResults.errors.length - 10} أخطاء أخرى`}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Import Error */}
                    {importError && (
                      <Card className="mt-4 border-red-200">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium text-red-800 text-lg">
                              {language === 'English' ? 'Import Error' : 'خطأ في الاستيراد'}
                            </span>
                          </div>
                          <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{importError}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab - Custom Fields Management */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'English' ? 'Employee Configuration' : 'تكوين الموظفين'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure employee-related settings and custom fields.'
                  : 'تكوين الإعدادات والحقول المخصصة المتعلقة بالموظفين.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Default Departments' : 'الأقسام الافتراضية'}
                  </h3>
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Available Departments' : 'الأقسام المتاحة'}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales'].map(dept => (
                        <span key={dept} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Employment Types' : 'أنواع التوظيف'}
                  </h3>
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Available Types' : 'الأنواع المتاحة'}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Full-time', 'Part-time', 'Contract', 'Intern'].map(type => (
                        <span key={type} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'Employee Status Options' : 'خيارات حالة الموظف'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Active', 'Resigned', 'Terminated', 'On Leave'].map(status => (
                    <span key={status} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {status}
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Custom Fields' : 'الحقول المخصصة'}
                  </h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Add Custom Field' : 'إضافة حقل مخصص'}
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>{language === 'English' ? 'No custom fields configured' : 'لا توجد حقول مخصصة مكونة'}</p>
                  <p className="text-sm mt-2">
                    {language === 'English' 
                      ? 'Add custom fields to capture additional employee information.' 
                      : 'أضف حقولاً مخصصة لالتقاط معلومات إضافية عن الموظفين.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab - Custom Fields Management */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {language === 'English' ? 'Asset Configuration' : 'تكوين الأصول'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure asset types, statuses, and custom fields.'
                  : 'تكوين أنواع الأصول والحالات والحقول المخصصة.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Asset Types' : 'أنواع الأصول'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Laptop', 'Desktop', 'Monitor', 'Phone', 'Server', 'Network', 'Printer', 'Tablet', 'Mobile'].map(type => (
                      <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Asset Statuses' : 'حالات الأصول'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Available', 'In Use', 'Maintenance', 'Retired', 'Damaged', 'Sold'].map(status => (
                      <span key={status} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'Common Brands' : 'العلامات التجارية الشائعة'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['Dell', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Cisco', 'Canon', 'Samsung'].map(brand => (
                    <span key={brand} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Custom Fields' : 'الحقول المخصصة'}
                  </h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Add Custom Field' : 'إضافة حقل مخصص'}
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>{language === 'English' ? 'No custom fields configured' : 'لا توجد حقول مخصصة مكونة'}</p>
                  <p className="text-sm mt-2">
                    {language === 'English' 
                      ? 'Add custom fields to capture additional asset specifications.' 
                      : 'أضف حقولاً مخصصة لالتقاط مواصفات إضافية للأصول.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab - Custom Fields Management */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {language === 'English' ? 'Ticket Configuration' : 'تكوين التذاكر'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure ticket categories, priorities, and custom fields.'
                  : 'تكوين فئات التذاكر والأولويات والحقول المخصصة.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Request Types' : 'أنواع الطلبات'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Service Request', 'Incident', 'Problem', 'Change'].map(type => (
                      <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Categories' : 'الفئات'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Hardware', 'Software', 'Network', 'Security', 'Access'].map(category => (
                      <span key={category} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Priority Levels' : 'مستويات الأولوية'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Low', 'Medium', 'High', 'Critical'].map(priority => (
                      <span key={priority} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {priority}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Status Options' : 'خيارات الحالة'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
                      <span key={status} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {status}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Fields Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Custom Fields' : 'الحقول المخصصة'}
                  </h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Add Custom Field' : 'إضافة حقل مخصص'}
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <p>{language === 'English' ? 'No custom fields configured' : 'لا توجد حقول مخصصة مكونة'}</p>
                  <p className="text-sm mt-2">
                    {language === 'English' 
                      ? 'Add custom fields to capture additional ticket information.' 
                      : 'أضف حقولاً مخصصة لالتقاط معلومات إضافية عن التذاكر.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab - Complete Configuration */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {language === 'English' ? 'Email Configuration' : 'تكوين البريد الإلكتروني'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure email server settings for notifications and alerts.'
                  : 'تكوين إعدادات خادم البريد الإلكتروني للإشعارات والتنبيهات.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emailHost">
                    {language === 'English' ? 'SMTP Host' : 'مضيف SMTP'}
                  </Label>
                  <Input
                    id="emailHost"
                    value={config.emailHost}
                    onChange={(e) => handleConfigChange('emailHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailPort">
                    {language === 'English' ? 'SMTP Port' : 'منفذ SMTP'}
                  </Label>
                  <Input
                    id="emailPort"
                    value={config.emailPort}
                    onChange={(e) => handleConfigChange('emailPort', e.target.value)}
                    placeholder="587"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailUser">
                    {language === 'English' ? 'Email Username' : 'اسم مستخدم البريد الإلكتروني'}
                  </Label>
                  <Input
                    id="emailUser"
                    value={config.emailUser}
                    onChange={(e) => handleConfigChange('emailUser', e.target.value)}
                    placeholder="your-email@domain.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailPassword">
                    {language === 'English' ? 'Email Password' : 'كلمة مرور البريد الإلكتروني'}
                  </Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    value={config.emailPassword}
                    onChange={(e) => handleConfigChange('emailPassword', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'Notification Settings' : 'إعدادات الإشعارات'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ticketNotifications">
                      {language === 'English' ? 'Ticket Notifications' : 'إشعارات التذاكر'}
                    </Label>
                    <Switch id="ticketNotifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="assetNotifications">
                      {language === 'English' ? 'Asset Notifications' : 'إشعارات الأصول'}
                    </Label>
                    <Switch id="assetNotifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenanceNotifications">
                      {language === 'English' ? 'Maintenance Reminders' : 'تذكيرات الصيانة'}
                    </Label>
                    <Switch id="maintenanceNotifications" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending}>
                  {updateConfigMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {language === 'English' ? 'Save Email Settings' : 'حفظ إعدادات البريد الإلكتروني'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Roles Tab - Complete User Management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {language === 'English' ? 'Users & Roles Management' : 'إدارة المستخدمين والأدوار'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage user accounts and role-based access control.'
                  : 'إدارة حسابات المستخدمين والتحكم في الوصول القائم على الأدوار.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'System Users' : 'مستخدمو النظام'}
                  </h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Add User' : 'إضافة مستخدم'}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-600">Admin</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'English' 
                        ? 'Full system access and configuration rights'
                        : 'الوصول الكامل للنظام وحقوق التكوين'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-600">Manager</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'English' 
                        ? 'Department management and reporting access'
                        : 'إدارة القسم والوصول إلى التقارير'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Agent</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'English' 
                        ? 'Ticket handling and asset management'
                        : 'معالجة التذاكر وإدارة الأصول'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-600">Employee</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'English' 
                        ? 'Basic access to create tickets and view assets'
                        : 'الوصول الأساسي لإنشاء التذاكر وعرض الأصول'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'Security Settings' : 'إعدادات الأمان'}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passwordComplexity">
                      {language === 'English' ? 'Enforce Password Complexity' : 'فرض تعقيد كلمة المرور'}
                    </Label>
                    <Switch id="passwordComplexity" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sessionTimeout">
                      {language === 'English' ? 'Auto Session Timeout' : 'انتهاء الجلسة التلقائي'}
                    </Label>
                    <Switch id="sessionTimeout" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="twoFactor">
                      {language === 'English' ? 'Two-Factor Authentication' : 'المصادقة الثنائية'}
                    </Label>
                    <Switch id="twoFactor" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'User Management Actions' : 'إجراءات إدارة المستخدمين'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Bulk Import Users' : 'استيراد مجمع للمستخدمين'}
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Export User List' : 'تصدير قائمة المستخدمين'}
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === 'English' ? 'Reset Passwords' : 'إعادة تعيين كلمات المرور'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfig;
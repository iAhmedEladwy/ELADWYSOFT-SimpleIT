import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Save, Globe, Loader2, Trash, Plus, Edit, Check, X, Mail, Download, Upload, Package, Ticket, Building, FileDown, Users, Monitor } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SystemConfig() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  // State variables
  const [assetIdPrefix, setAssetIdPrefix] = useState('SIT-');
  const [empIdPrefix, setEmpIdPrefix] = useState('EMP-');
  const [ticketIdPrefix, setTicketIdPrefix] = useState('TKT-');
  const [currency, setCurrency] = useState('USD');
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editedDeptName, setEditedDeptName] = useState('');

  // Asset management state
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetTypeDesc, setNewAssetTypeDesc] = useState('');
  const [editingAssetTypeId, setEditingAssetTypeId] = useState<number | null>(null);
  const [editedAssetTypeName, setEditedAssetTypeName] = useState('');
  const [editedAssetTypeDesc, setEditedAssetTypeDesc] = useState('');

  const [newAssetBrand, setNewAssetBrand] = useState('');
  const [newAssetBrandDesc, setNewAssetBrandDesc] = useState('');
  const [editingAssetBrandId, setEditingAssetBrandId] = useState<number | null>(null);
  const [editedAssetBrandName, setEditedAssetBrandName] = useState('');
  const [editedAssetBrandDesc, setEditedAssetBrandDesc] = useState('');

  const [newAssetStatus, setNewAssetStatus] = useState('');
  const [newAssetStatusDesc, setNewAssetStatusDesc] = useState('');
  const [editingAssetStatusId, setEditingAssetStatusId] = useState<number | null>(null);
  const [editedAssetStatusName, setEditedAssetStatusName] = useState('');
  const [editedAssetStatusDesc, setEditedAssetStatusDesc] = useState('');

  const [newServiceProvider, setNewServiceProvider] = useState('');
  const [newServiceProviderContact, setNewServiceProviderContact] = useState('');
  const [newServiceProviderPhone, setNewServiceProviderPhone] = useState('');
  const [newServiceProviderEmail, setNewServiceProviderEmail] = useState('');
  
  // Email configuration states
  const [emailHost, setEmailHost] = useState('');
  const [emailPort, setEmailPort] = useState('');
  const [emailUsername, setEmailUsername] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailSecure, setEmailSecure] = useState(true);

  // Fetch system config
  const { data: config } = useQuery<any>({
    queryKey: ['/api/system-config'],
    enabled: hasAccess(3),
  });

  // Fetch asset management data
  const { data: assetTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-types'],
    enabled: hasAccess(3),
  });

  const { data: assetBrands = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-brands'],
    enabled: hasAccess(3),
  });

  const { data: assetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    enabled: hasAccess(3),
  });

  const { data: serviceProviders = [] } = useQuery<any[]>({
    queryKey: ['/api/service-providers'],
    enabled: hasAccess(3),
  });
  
  // Update local state when config data is loaded
  useEffect(() => {
    if (config) {
      setAssetIdPrefix(config.assetIdPrefix || 'SIT-');
      setEmpIdPrefix(config.empIdPrefix || 'EMP-');
      setTicketIdPrefix(config.ticketIdPrefix || 'TKT-');
      setCurrency(config.currency || 'USD');
      setDepartments(config.departments || []);
      setEmailHost(config.emailHost || '');
      setEmailPort(config.emailPort || '');
      setEmailUsername(config.emailUsername || '');
      setEmailPassword(config.emailPassword || '');
      setEmailSecure(config.emailSecure !== undefined ? config.emailSecure : true);
    }
  }, [config]);

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('PUT', '/api/system-config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Settings updated successfully' : 'تم تحديث الإعدادات بنجاح',
      });
    },
    onError: (error) => {
      console.error("Config update error:", error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' 
          ? 'Failed to update settings. Please try again.' 
          : 'فشل تحديث الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    }
  });

  // Handle saving configuration
  const handleSaveConfig = () => {
    const configData = {
      language,
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      emailHost,
      emailPort,
      emailUsername,
      emailPassword,
      emailSecure,
      departments: departments || []
    };
    updateConfigMutation.mutate(configData);
  };

  // Department management functions
  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    
    const updatedDepartments = [...departments, newDepartment.trim()];
    setDepartments(updatedDepartments);
    setNewDepartment('');
    
    // Save immediately
    const configData = {
      language,
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      emailHost,
      emailPort,
      emailUsername,
      emailPassword,
      emailSecure,
      departments: updatedDepartments
    };
    updateConfigMutation.mutate(configData);
  };

  const handleEditDepartment = (index: number, deptName: string) => {
    setEditingDeptIndex(index);
    setEditedDeptName(deptName);
  };

  const handleSaveDepartment = (index: number) => {
    if (!editedDeptName.trim()) return;
    
    const updatedDepartments = [...departments];
    updatedDepartments[index] = editedDeptName.trim();
    setDepartments(updatedDepartments);
    setEditingDeptIndex(null);
    setEditedDeptName('');
    
    // Save immediately
    const configData = {
      language,
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      emailHost,
      emailPort,
      emailUsername,
      emailPassword,
      emailSecure,
      departments: updatedDepartments
    };
    updateConfigMutation.mutate(configData);
  };

  const handleCancelEditDepartment = () => {
    setEditingDeptIndex(null);
    setEditedDeptName('');
  };

  const handleDeleteDepartment = (index: number) => {
    const updatedDepartments = departments.filter((_, i) => i !== index);
    setDepartments(updatedDepartments);
    
    // Save immediately
    const configData = {
      language,
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      emailHost,
      emailPort,
      emailUsername,
      emailPassword,
      emailSecure,
      departments: updatedDepartments
    };
    updateConfigMutation.mutate(configData);
  };

  // Handle file import
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/import/${type}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: language === 'English' ? 'Success' : 'تم بنجاح',
          description: language === 'English' ? `${type} imported successfully` : `تم استيراد ${type} بنجاح`,
        });
        // Reset file input
        event.target.value = '';
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/${type}`] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' 
          ? `Failed to import ${type}. Please check the file format.` 
          : `فشل استيراد ${type}. يرجى التحقق من تنسيق الملف.`,
        variant: 'destructive'
      });
      // Reset file input
      event.target.value = '';
    }
  };

  const translations = {
    systemConfig: language === 'English' ? 'System Configuration' : 'إعدادات النظام',
    generalSettings: language === 'English' ? 'General Settings' : 'الإعدادات العامة',
    generalSettingsDesc: language === 'English' ? 'Configure basic system settings, language, currency, and data management' : 'تكوين إعدادات النظام الأساسية واللغة والعملة وإدارة البيانات',
    language: language === 'English' ? 'Language' : 'اللغة',
    currency: language === 'English' ? 'Currency' : 'العملة',
    assetIdPrefix: language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل',
    empIdPrefix: language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف',
    ticketIdPrefix: language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة',
    emailSettings: language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 lg:bg-none lg:bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 mb-6">
        <div className="flex items-center justify-center">
          <Settings className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold text-center">{translations.systemConfig}</h1>
        </div>
        <p className="text-center text-blue-100 mt-2 text-lg">
          {language === 'English' ? 'Mobile Optimized' : 'محسّن للجوال'}
        </p>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block container mx-auto py-4 px-4 lg:px-6">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <div className="flex items-center">
            <Settings className="h-5 w-5 lg:h-6 lg:w-6 mr-2" />
            <h1 className="text-xl lg:text-2xl font-bold">{translations.systemConfig}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-6 pb-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-4 h-auto gap-1">
            <TabsTrigger value="general" className="text-sm py-3 px-2">
              <Globe className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{translations.generalSettings}</span>
              <span className="sm:hidden">{language === 'English' ? 'General' : 'عام'}</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="text-sm py-3 px-2">
              <Building className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{language === 'English' ? 'Departments' : 'الأقسام'}</span>
              <span className="sm:hidden">{language === 'English' ? 'Depts' : 'أقسام'}</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-sm py-3 px-2">
              <Settings className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{language === 'English' ? 'Assets' : 'الأصول'}</span>
              <span className="sm:hidden">{language === 'English' ? 'Assets' : 'أصول'}</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="text-sm py-3 px-2">
              <Mail className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">{translations.emailSettings}</span>
              <span className="sm:hidden">{language === 'English' ? 'Email' : 'بريد'}</span>
            </TabsTrigger>
          </TabsList>

          {/* General Configuration Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {translations.generalSettings}
                </CardTitle>
                <CardDescription>
                  {translations.generalSettingsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{translations.language}</Label>
                      <Select value={language} onValueChange={toggleLanguage}>
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
                      <Label>{translations.assetIdPrefix}</Label>
                      <Input
                        value={assetIdPrefix}
                        onChange={(e) => setAssetIdPrefix(e.target.value)}
                        placeholder="AST-"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{translations.empIdPrefix}</Label>
                      <Input
                        value={empIdPrefix}
                        onChange={(e) => setEmpIdPrefix(e.target.value)}
                        placeholder="EMP-"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{translations.ticketIdPrefix}</Label>
                      <Input
                        value={ticketIdPrefix}
                        onChange={(e) => setTicketIdPrefix(e.target.value)}
                        placeholder="TKT-"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{translations.currency}</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                          <SelectItem value="AED">AED (د.إ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Import/Export Section */}
                <div className="space-y-4 mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <FileDown className="h-5 w-5" />
                    {language === 'English' ? 'Data Import/Export' : 'استيراد/تصدير البيانات'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Export Section */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {language === 'English' ? 'Export Data' : 'تصدير البيانات'}
                      </h4>
                      <div className="space-y-2">
                        <Button
                          onClick={() => window.open('/api/export/employees', '_blank')}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Export Employees' : 'تصدير الموظفين'}
                        </Button>
                        <Button
                          onClick={() => window.open('/api/export/assets', '_blank')}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <Monitor className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Export Assets' : 'تصدير الأصول'}
                        </Button>
                        <Button
                          onClick={() => window.open('/api/export/tickets', '_blank')}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-green-700 border-green-300 hover:bg-green-100"
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Export Tickets' : 'تصدير التذاكر'}
                        </Button>
                      </div>
                    </div>

                    {/* Import Section */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        {language === 'English' ? 'Import Data' : 'استيراد البيانات'}
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <label htmlFor="import-employees" className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-blue-700 border-blue-300 hover:bg-blue-100"
                              asChild
                            >
                              <span>
                                <Users className="h-4 w-4 mr-2" />
                                {language === 'English' ? 'Import Employees' : 'استيراد الموظفين'}
                              </span>
                            </Button>
                          </label>
                          <input
                            id="import-employees"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => handleImport(e, 'employees')}
                          />
                        </div>
                        <div>
                          <label htmlFor="import-assets" className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-blue-700 border-blue-300 hover:bg-blue-100"
                              asChild
                            >
                              <span>
                                <Monitor className="h-4 w-4 mr-2" />
                                {language === 'English' ? 'Import Assets' : 'استيراد الأصول'}
                              </span>
                            </Button>
                          </label>
                          <input
                            id="import-assets"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => handleImport(e, 'assets')}
                          />
                        </div>
                        <div>
                          <label htmlFor="import-tickets" className="cursor-pointer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-blue-700 border-blue-300 hover:bg-blue-100"
                              asChild
                            >
                              <span>
                                <Ticket className="h-4 w-4 mr-2" />
                                {language === 'English' ? 'Import Tickets' : 'استيراد التذاكر'}
                              </span>
                            </Button>
                          </label>
                          <input
                            id="import-tickets"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={(e) => handleImport(e, 'tickets')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                      <strong>{language === 'English' ? 'Note:' : 'ملاحظة:'}</strong>{' '}
                      {language === 'English' 
                        ? 'CSV files should match the system format. Export a sample file first to see the required structure.' 
                        : 'يجب أن تتطابق ملفات CSV مع تنسيق النظام. قم بتصدير ملف عينة أولاً لرؤية الهيكل المطلوب.'}
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending} className="w-full sm:w-auto">
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {translations.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-blue-800">
                      {language === 'English' ? 'Department Management' : 'إدارة الأقسام'}
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      {language === 'English' ? 'Manage company departments for employee organization' : 'إدارة أقسام الشركة لتنظيم الموظفين'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">
                      {language === 'English' ? 'Add New Department' : 'إضافة قسم جديد'}
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder={language === 'English' ? "Enter department name (e.g., IT Department, HR, Finance)" : "أدخل اسم القسم (مثل: قسم تكنولوجيا المعلومات، الموارد البشرية)"}
                      className="flex-grow"
                    />
                    <Button 
                      onClick={handleAddDepartment} 
                      variant="default" 
                      className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
                      disabled={!newDepartment.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'English' ? 'Add Department' : 'إضافة القسم'}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {language === 'English' ? 'Current Departments' : 'الأقسام الحالية'}
                  </h3>
                  
                  {departments.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[300px]">
                          <thead>
                            <tr className="bg-blue-50 border-b">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-blue-800">
                                {language === 'English' ? 'Department Name' : 'اسم القسم'}
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-blue-800">
                                {language === 'English' ? 'Actions' : 'الإجراءات'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {departments.map((dept, index) => (
                              <tr key={index} className="hover:bg-blue-25">
                                <td className="px-4 py-3">
                                  {editingDeptIndex === index ? (
                                    <Input
                                      value={editedDeptName}
                                      onChange={(e) => setEditedDeptName(e.target.value)}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-blue-500" />
                                      <span className="text-sm font-medium">{dept}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    {editingDeptIndex === index ? (
                                      <>
                                        <Button
                                          onClick={() => handleSaveDepartment(index)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          onClick={handleCancelEditDepartment}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          onClick={() => handleEditDepartment(index, dept)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          onClick={() => handleDeleteDepartment(index)}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg bg-gray-50">
                      <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">
                        {language === 'English' ? 'No departments configured yet' : 'لم يتم تكوين أقسام بعد'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {language === 'English' ? 'Add departments to organize your employees' : 'أضف أقسامًا لتنظيم موظفيك'}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-2">
                      <Building className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">
                          {language === 'English' ? 'Important Note' : 'ملاحظة مهمة'}
                        </h4>
                        <p className="text-yellow-700 text-sm mt-1">
                          {language === 'English' 
                            ? 'These departments will be available when creating or editing employee records. Changes are saved automatically.' 
                            : 'ستكون هذه الأقسام متاحة عند إنشاء أو تعديل سجلات الموظفين. يتم حفظ التغييرات تلقائيًا.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Asset Management Tab */}
          <TabsContent value="assets">
            <div className="grid gap-6">
              <Tabs defaultValue="types" className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="types">{language === 'English' ? 'Types' : 'الأنواع'}</TabsTrigger>
                  <TabsTrigger value="brands">{language === 'English' ? 'Brands' : 'العلامات'}</TabsTrigger>
                  <TabsTrigger value="statuses">{language === 'English' ? 'Statuses' : 'الحالات'}</TabsTrigger>
                  <TabsTrigger value="providers">{language === 'English' ? 'Service Providers' : 'مقدمو الخدمات'}</TabsTrigger>
                </TabsList>

                {/* Asset Types */}
                <TabsContent value="types">
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === 'English' ? 'Asset Types' : 'أنواع الأصول'}</CardTitle>
                      <CardDescription>
                        {language === 'English' ? 'Manage asset type categories' : 'إدارة فئات أنواع الأصول'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={language === 'English' ? 'Type name' : 'اسم النوع'}
                            value={newAssetType}
                            onChange={(e) => setNewAssetType(e.target.value)}
                          />
                          <Input
                            placeholder={language === 'English' ? 'Description (optional)' : 'الوصف (اختياري)'}
                            value={newAssetTypeDesc}
                            onChange={(e) => setNewAssetTypeDesc(e.target.value)}
                          />
                          <Button onClick={handleAddAssetType} disabled={!newAssetType.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add' : 'إضافة'}
                          </Button>
                        </div>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'English' ? 'Name' : 'الاسم'}</TableHead>
                                <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                                <TableHead>{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assetTypes.map((type) => (
                                <TableRow key={type.id}>
                                  <TableCell>
                                    {editingAssetTypeId === type.id ? (
                                      <Input
                                        value={editedAssetTypeName}
                                        onChange={(e) => setEditedAssetTypeName(e.target.value)}
                                        className="w-full text-sm"
                                      />
                                    ) : (
                                      <span className="font-medium">{type.name}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingAssetTypeId === type.id ? (
                                      <Input
                                        value={editedAssetTypeDesc}
                                        onChange={(e) => setEditedAssetTypeDesc(e.target.value)}
                                        className="w-full text-sm"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-600">{type.description || '-'}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {editingAssetTypeId === type.id ? (
                                        <>
                                          <Button size="sm" onClick={() => handleUpdateAssetType(type.id)}>
                                            <Check className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditAssetType(type)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteAssetType(type.id)}
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Asset Brands */}
                <TabsContent value="brands">
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === 'English' ? 'Asset Brands' : 'علامات الأصول'}</CardTitle>
                      <CardDescription>
                        {language === 'English' ? 'Manage asset brand names' : 'إدارة أسماء علامات الأصول'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={language === 'English' ? 'Brand name' : 'اسم العلامة التجارية'}
                            value={newAssetBrand}
                            onChange={(e) => setNewAssetBrand(e.target.value)}
                          />
                          <Input
                            placeholder={language === 'English' ? 'Description (optional)' : 'الوصف (اختياري)'}
                            value={newAssetBrandDesc}
                            onChange={(e) => setNewAssetBrandDesc(e.target.value)}
                          />
                          <Button onClick={handleAddAssetBrand} disabled={!newAssetBrand.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add' : 'إضافة'}
                          </Button>
                        </div>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'English' ? 'Name' : 'الاسم'}</TableHead>
                                <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                                <TableHead>{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assetBrands.map((brand) => (
                                <TableRow key={brand.id}>
                                  <TableCell>
                                    {editingAssetBrandId === brand.id ? (
                                      <Input
                                        value={editedAssetBrandName}
                                        onChange={(e) => setEditedAssetBrandName(e.target.value)}
                                        className="w-full text-sm"
                                      />
                                    ) : (
                                      <span className="font-medium">{brand.name}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingAssetBrandId === brand.id ? (
                                      <Input
                                        value={editedAssetBrandDesc}
                                        onChange={(e) => setEditedAssetBrandDesc(e.target.value)}
                                        className="w-full text-sm"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-600">{brand.description || '-'}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {editingAssetBrandId === brand.id ? (
                                        <>
                                          <Button size="sm" onClick={() => handleUpdateAssetBrand(brand.id)}>
                                            <Check className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditAssetBrand(brand)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteAssetBrand(brand.id)}
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Asset Statuses */}
                <TabsContent value="statuses">
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === 'English' ? 'Asset Statuses' : 'حالات الأصول'}</CardTitle>
                      <CardDescription>
                        {language === 'English' ? 'Manage asset status options' : 'إدارة خيارات حالة الأصول'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder={language === 'English' ? 'Status name' : 'اسم الحالة'}
                            value={newAssetStatus}
                            onChange={(e) => setNewAssetStatus(e.target.value)}
                          />
                          <Input
                            placeholder={language === 'English' ? 'Description (optional)' : 'الوصف (اختياري)'}
                            value={newAssetStatusDesc}
                            onChange={(e) => setNewAssetStatusDesc(e.target.value)}
                          />
                          <Button onClick={handleAddAssetStatus} disabled={!newAssetStatus.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add' : 'إضافة'}
                          </Button>
                        </div>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'English' ? 'Name' : 'الاسم'}</TableHead>
                                <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                                <TableHead>{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assetStatuses.map((status) => (
                                <TableRow key={status.id}>
                                  <TableCell>
                                    {editingAssetStatusId === status.id ? (
                                      <Input
                                        value={editedAssetStatusName}
                                        onChange={(e) => setEditedAssetStatusName(e.target.value)}
                                        className="w-full text-sm"
                                      />
                                    ) : (
                                      <span className="font-medium">{status.name}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingAssetStatusId === status.id ? (
                                      <Input
                                        value={editedAssetStatusDesc}
                                        onChange={(e) => setEditedAssetStatusDesc(e.target.value)}
                                        className="w-full text-sm"
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-600">{status.description || '-'}</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {editingAssetStatusId === status.id ? (
                                        <>
                                          <Button size="sm" onClick={() => handleUpdateAssetStatus(status.id)}>
                                            <Check className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditAssetStatus(status)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteAssetStatus(status.id)}
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Service Providers */}
                <TabsContent value="providers">
                  <Card>
                    <CardHeader>
                      <CardTitle>{language === 'English' ? 'Service Providers' : 'مقدمو الخدمات'}</CardTitle>
                      <CardDescription>
                        {language === 'English' ? 'Manage service provider information' : 'إدارة معلومات مقدمي الخدمات'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input
                            placeholder={language === 'English' ? 'Provider name' : 'اسم مقدم الخدمة'}
                            value={newServiceProvider}
                            onChange={(e) => setNewServiceProvider(e.target.value)}
                          />
                          <Input
                            placeholder={language === 'English' ? 'Contact person' : 'الشخص المسؤول'}
                            value={newServiceProviderContact}
                            onChange={(e) => setNewServiceProviderContact(e.target.value)}
                          />
                          <Input
                            placeholder={language === 'English' ? 'Phone' : 'الهاتف'}
                            value={newServiceProviderPhone}
                            onChange={(e) => setNewServiceProviderPhone(e.target.value)}
                          />
                          <Input
                            placeholder={language === 'English' ? 'Email' : 'البريد الإلكتروني'}
                            value={newServiceProviderEmail}
                            onChange={(e) => setNewServiceProviderEmail(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleAddServiceProvider} disabled={!newServiceProvider.trim()}>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Add Service Provider' : 'إضافة مقدم خدمة'}
                        </Button>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{language === 'English' ? 'Name' : 'الاسم'}</TableHead>
                                <TableHead>{language === 'English' ? 'Contact' : 'الاتصال'}</TableHead>
                                <TableHead>{language === 'English' ? 'Phone' : 'الهاتف'}</TableHead>
                                <TableHead>{language === 'English' ? 'Email' : 'البريد'}</TableHead>
                                <TableHead>{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {serviceProviders.map((provider) => (
                                <TableRow key={provider.id}>
                                  <TableCell>
                                    <span className="font-medium">{provider.name}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600">{provider.contactPerson || '-'}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600">{provider.phone || '-'}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600">{provider.email || '-'}</span>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDeleteServiceProvider(provider.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Email Configuration Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {translations.emailSettings}
                </CardTitle>
                <CardDescription>
                  {language === 'English' ? 'Configure email server settings for system notifications' : 'تكوين إعدادات خادم البريد الإلكتروني للإشعارات النظامية'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Email Host' : 'خادم البريد الإلكتروني'}</Label>
                    <Input
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Port' : 'المنفذ'}</Label>
                    <Input
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Username' : 'اسم المستخدم'}</Label>
                    <Input
                      value={emailUsername}
                      onChange={(e) => setEmailUsername(e.target.value)}
                      placeholder="your-email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Password' : 'كلمة المرور'}</Label>
                    <Input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-secure"
                    checked={emailSecure}
                    onCheckedChange={setEmailSecure}
                  />
                  <Label htmlFor="email-secure">
                    {language === 'English' ? 'Use Secure Connection (SSL/TLS)' : 'استخدام اتصال آمن (SSL/TLS)'}
                  </Label>
                </div>
                <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending} className="w-full sm:w-auto">
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {translations.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
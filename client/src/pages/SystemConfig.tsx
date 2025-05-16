import { useState } from 'react';
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
import { Settings, Save, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemConfig() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [assetIdPrefix, setAssetIdPrefix] = useState('BOLT-');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for new items
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusDescription, setNewStatusDescription] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6');
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderContact, setNewProviderContact] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderEmail, setNewProviderEmail] = useState('');
  
  // Custom fields queries
  const { data: customAssetTypes = [] } = useQuery({
    queryKey: ['/api/custom-asset-types'],
    enabled: hasAccess('admin'),
  });
  
  const { data: customAssetBrands = [] } = useQuery({
    queryKey: ['/api/custom-asset-brands'],
    enabled: hasAccess('admin'),
  });
  
  const { data: customAssetStatuses = [] } = useQuery({
    queryKey: ['/api/custom-asset-statuses'],
    enabled: hasAccess('admin'),
  });
  
  const { data: serviceProviders = [] } = useQuery({
    queryKey: ['/api/service-providers'],
    enabled: hasAccess('admin'),
  });
  
  // System config data query
  const { data: systemConfigData } = useQuery({
    queryKey: ['/api/system-config'],
    onSuccess: (data) => {
      if (data) {
        setAssetIdPrefix(data.assetIdPrefix || 'BOLT-');
        setCurrency(data.currency || 'USD');
        setIsLoading(false);
      }
    }
  });
  
  // Custom fields mutations
  const createAssetTypeMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('/api/custom-asset-types', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      setNewTypeName('');
      setNewTypeDescription('');
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type added successfully' : 'تمت إضافة نوع الأصل بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset type' : 'فشل في إضافة نوع الأصل',
        variant: 'destructive',
      });
    },
  });
  
  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/custom-asset-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type deleted successfully' : 'تم حذف نوع الأصل بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete asset type' : 'فشل في حذف نوع الأصل',
        variant: 'destructive',
      });
    },
  });
  
  const createAssetBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('/api/custom-asset-brands', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      setNewBrandName('');
      setNewBrandDescription('');
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Brand added successfully' : 'تمت إضافة العلامة التجارية بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add brand' : 'فشل في إضافة العلامة التجارية',
        variant: 'destructive',
      });
    },
  });
  
  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/custom-asset-brands/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Brand deleted successfully' : 'تم حذف العلامة التجارية بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete brand' : 'فشل في حذف العلامة التجارية',
        variant: 'destructive',
      });
    },
  });
  
  const createAssetStatusMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => 
      apiRequest('/api/custom-asset-statuses', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      setNewStatusName('');
      setNewStatusDescription('');
      setNewStatusColor('#3B82F6');
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Status added successfully' : 'تمت إضافة الحالة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add status' : 'فشل في إضافة الحالة',
        variant: 'destructive',
      });
    },
  });
  
  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/custom-asset-statuses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Status deleted successfully' : 'تم حذف الحالة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete status' : 'فشل في حذف الحالة',
        variant: 'destructive',
      });
    },
  });
  
  const createServiceProviderMutation = useMutation({
    mutationFn: (data: { name: string; contactPerson?: string; phone?: string; email?: string }) => 
      apiRequest('/api/service-providers', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      setNewProviderName('');
      setNewProviderContact('');
      setNewProviderPhone('');
      setNewProviderEmail('');
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider added successfully' : 'تمت إضافة مزود الخدمة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add service provider' : 'فشل في إضافة مزود الخدمة',
        variant: 'destructive',
      });
    },
  });
  
  const deleteServiceProviderMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/service-providers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider deleted successfully' : 'تم حذف مزود الخدمة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete service provider' : 'فشل في حذف مزود الخدمة',
        variant: 'destructive',
      });
    },
  });
  
  // Update system configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (configData: any) => 
      apiRequest('/api/system-config', { method: 'PUT', data: configData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Configuration saved successfully' : 'تم حفظ الإعدادات بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to save configuration' : 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    },
  });
  
  // Handler functions
  const handleAddAssetType = () => {
    if (!newTypeName.trim()) return;
    
    createAssetTypeMutation.mutate({
      name: newTypeName.trim(),
      description: newTypeDescription.trim() || undefined
    });
  };
  
  const handleAddAssetBrand = () => {
    if (!newBrandName.trim()) return;
    
    createAssetBrandMutation.mutate({
      name: newBrandName.trim(),
      description: newBrandDescription.trim() || undefined
    });
  };
  
  const handleAddAssetStatus = () => {
    if (!newStatusName.trim()) return;
    
    createAssetStatusMutation.mutate({
      name: newStatusName.trim(),
      description: newStatusDescription.trim() || undefined,
      color: newStatusColor
    });
  };
  
  const handleAddServiceProvider = () => {
    if (!newProviderName.trim()) return;
    
    createServiceProviderMutation.mutate({
      name: newProviderName.trim(),
      contactPerson: newProviderContact.trim() || undefined,
      phone: newProviderPhone.trim() || undefined,
      email: newProviderEmail.trim() || undefined
    });
  };

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      assetIdPrefix,
      currency
    });
  };

  // Translations
  const translations = {
    title: language === 'English' ? 'System Configuration' : 'إعدادات النظام',
    pageDescription: language === 'English' 
      ? 'Configure system-wide settings and preferences' 
      : 'تكوين إعدادات النظام وتفضيلاته',
    generalSettings: language === 'English' ? 'General Settings' : 'الإعدادات العامة',
    language: language === 'English' ? 'Language' : 'اللغة',
    english: language === 'English' ? 'English' : 'الإنجليزية',
    arabic: language === 'English' ? 'Arabic' : 'العربية',
    assetIdPrefix: language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصول',
    assetIdPrefixDesc: language === 'English' 
      ? 'Prefix added to all asset IDs (e.g., BOLT-LT-0001)' 
      : 'البادئة المضافة إلى جميع معرفات الأصول (مثال: BOLT-LT-0001)',
    currency: language === 'English' ? 'Currency' : 'العملة',
    currencyDesc: language === 'English'
      ? 'Default currency used throughout the system'
      : 'العملة الافتراضية المستخدمة في جميع أنحاء النظام',
    currencySymbol: language === 'English' ? 'Currency Symbol' : 'رمز العملة',
    currencySymbolDesc: language === 'English'
      ? 'Symbol displayed for monetary values'
      : 'الرمز المعروض للقيم النقدية',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    saveSuccess: language === 'English' ? 'Configuration saved successfully' : 'تم حفظ الإعدادات بنجاح',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
    unauthorized: language === 'English' 
      ? 'You do not have permission to access this page' 
      : 'ليس لديك إذن للوصول إلى هذه الصفحة',
    assetCustomization: language === 'English' ? 'Asset Customization' : 'تخصيص الأصول',
    customAssetTypes: language === 'English' ? 'Custom Asset Types' : 'أنواع الأصول المخصصة',
    customAssetTypesDesc: language === 'English' 
      ? 'Create custom asset types in addition to default types' 
      : 'إنشاء أنواع أصول مخصصة بالإضافة إلى الأنواع الافتراضية',
    customAssetBrands: language === 'English' ? 'Custom Asset Brands' : 'علامات تجارية مخصصة للأصول',
    customAssetBrandsDesc: language === 'English' 
      ? 'Create custom brands for your organization' 
      : 'إنشاء علامات تجارية مخصصة لمؤسستك',
    customAssetStatuses: language === 'English' ? 'Custom Asset Statuses' : 'حالات مخصصة للأصول',
    customAssetStatusesDesc: language === 'English' 
      ? 'Create custom asset statuses with color coding' 
      : 'إنشاء حالات مخصصة للأصول مع ترميز الألوان',
    name: language === 'English' ? 'Name' : 'الاسم',
    description: language === 'English' ? 'Description' : 'الوصف',
    color: language === 'English' ? 'Color' : 'اللون',
    add: language === 'English' ? 'Add' : 'إضافة',
    delete: language === 'English' ? 'Delete' : 'حذف',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    confirm: language === 'English' ? 'Confirm' : 'تأكيد',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    serviceProviders: language === 'English' ? 'Service Providers' : 'مزودي الخدمة',
    serviceProvidersDesc: language === 'English' 
      ? 'Manage external service providers for maintenance and support' 
      : 'إدارة مزودي الخدمة الخارجيين للصيانة والدعم',
    ticketCustomization: language === 'English' ? 'Ticket Customization' : 'تخصيص التذاكر',
    ticketCategories: language === 'English' ? 'Ticket Categories' : 'فئات التذاكر',
    ticketCategoriesDesc: language === 'English' 
      ? 'Define custom categories for tickets' 
      : 'تحديد فئات مخصصة للتذاكر',
    ticketPriorities: language === 'English' ? 'Ticket Priorities' : 'أولويات التذاكر',
    ticketPrioritiesDesc: language === 'English' 
      ? 'Set custom priorities with color coding' 
      : 'تعيين أولويات مخصصة مع ترميز الألوان',
    action: language === 'English' ? 'Action' : 'إجراء',
    default: language === 'English' ? 'Default' : 'افتراضي',
    sample: language === 'English' ? 'Sample' : 'عينة',
    common: language === 'English' ? 'Common' : 'شائع',
    phone: language === 'English' ? 'Phone' : 'رقم الهاتف',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
    contactInfo: language === 'English' ? 'Contact Info' : 'معلومات الاتصال',
    contactPerson: language === 'English' ? 'Contact Person' : 'جهة الاتصال'
  };

  // Check if user has admin access
  if (!hasAccess(3)) {
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{translations.title}</h1>
          <p className="text-muted-foreground">{translations.pageDescription}</p>
        </div>
        <Settings className="h-10 w-10 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{translations.generalSettings}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label htmlFor="language">{translations.language}</Label>
              <Select 
                value={language} 
                onValueChange={(value) => toggleLanguage(value)}
              >
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder={translations.language} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      <span>{translations.english}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Arabic">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      <span>{translations.arabic}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset ID Prefix */}
            <div className="space-y-2">
              <Label htmlFor="assetIdPrefix">{translations.assetIdPrefix}</Label>
              <Input 
                id="assetIdPrefix" 
                value={assetIdPrefix} 
                onChange={(e) => setAssetIdPrefix(e.target.value)}
                placeholder="BOLT-"
              />
              <p className="text-sm text-muted-foreground">{translations.assetIdPrefixDesc}</p>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label htmlFor="currency">{translations.currency}</Label>
              <Select 
                value={currency} 
                onValueChange={(value) => setCurrency(value)}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue placeholder={translations.currency} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD (United States Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  <SelectItem value="JPY">JPY (Japanese Yen)</SelectItem>
                  <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                  <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                  <SelectItem value="CNY">CNY (Chinese Yuan)</SelectItem>
                  <SelectItem value="SAR">SAR (Saudi Riyal)</SelectItem>
                  <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{translations.currencyDesc}</p>
            </div>

            {/* Currency Symbol */}
            <div className="space-y-2">
              <Label htmlFor="currencySymbol">{translations.currencySymbol}</Label>
              <Select 
                value={currencySymbol} 
                onValueChange={(value) => setCurrencySymbol(value)}
              >
                <SelectTrigger id="currencySymbol" className="w-full">
                  <SelectValue placeholder={translations.currencySymbol} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ (Dollar)</SelectItem>
                  <SelectItem value="€">€ (Euro)</SelectItem>
                  <SelectItem value="£">£ (Pound)</SelectItem>
                  <SelectItem value="¥">¥ (Yen/Yuan)</SelectItem>
                  <SelectItem value="₹">₹ (Rupee)</SelectItem>
                  <SelectItem value="₽">₽ (Ruble)</SelectItem>
                  <SelectItem value="﷼">﷼ (Riyal)</SelectItem>
                  <SelectItem value="د.إ">د.إ (Dirham)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{translations.currencySymbolDesc}</p>
            </div>

            <Button className="mt-4" onClick={handleSaveConfig} disabled={updateConfigMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {translations.save}
            </Button>
          </CardContent>
        </Card>

        {/* Custom Asset Types */}
        <Card>
          <CardHeader>
            <CardTitle>{translations.customAssetTypes}</CardTitle>
            <CardDescription>{translations.customAssetTypesDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <Label htmlFor="newTypeName">{translations.name}</Label>
                  <Input 
                    id="newTypeName" 
                    value={newTypeName} 
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Example: Server Rack"
                  />
                </div>
                <div className="md:col-span-5">
                  <Label htmlFor="newTypeDescription">{translations.description}</Label>
                  <Input 
                    id="newTypeDescription" 
                    value={newTypeDescription} 
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    placeholder="Example: Network server rack equipment"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={handleAddAssetType}
                    disabled={createAssetTypeMutation.isPending || !newTypeName.trim()}
                  >
                    {translations.add}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">{translations.name}</th>
                      <th className="px-4 py-2 text-left">{translations.description}</th>
                      <th className="px-4 py-2 text-right">{translations.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-2">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ) : Array.isArray(customAssetTypes) && customAssetTypes.length > 0 ? (
                      customAssetTypes.map((type: any) => (
                        <tr key={type.id} className="border-b">
                          <td className="px-4 py-2">{type.name}</td>
                          <td className="px-4 py-2">{type.description}</td>
                          <td className="px-4 py-2 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteAssetTypeMutation.mutate(type.id)}
                              disabled={deleteAssetTypeMutation.isPending}
                            >
                              {translations.delete}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-center text-muted-foreground">
                          No custom asset types found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Asset Brands */}
        <Card>
          <CardHeader>
            <CardTitle>{translations.customAssetBrands}</CardTitle>
            <CardDescription>{translations.customAssetBrandsDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <Label htmlFor="newBrandName">{translations.name}</Label>
                  <Input 
                    id="newBrandName" 
                    value={newBrandName} 
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Example: TechMax"
                  />
                </div>
                <div className="md:col-span-5">
                  <Label htmlFor="newBrandDescription">{translations.description}</Label>
                  <Input 
                    id="newBrandDescription" 
                    value={newBrandDescription} 
                    onChange={(e) => setNewBrandDescription(e.target.value)}
                    placeholder="Example: Network equipment manufacturer"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={handleAddAssetBrand}
                    disabled={createAssetBrandMutation.isPending || !newBrandName.trim()}
                  >
                    {translations.add}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">{translations.name}</th>
                      <th className="px-4 py-2 text-left">{translations.description}</th>
                      <th className="px-4 py-2 text-right">{translations.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-2">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ) : Array.isArray(customAssetBrands) && customAssetBrands.length > 0 ? (
                      customAssetBrands.map((brand: any) => (
                        <tr key={brand.id} className="border-b">
                          <td className="px-4 py-2">{brand.name}</td>
                          <td className="px-4 py-2">{brand.description}</td>
                          <td className="px-4 py-2 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteAssetBrandMutation.mutate(brand.id)}
                              disabled={deleteAssetBrandMutation.isPending}
                            >
                              {translations.delete}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-center text-muted-foreground">
                          No custom asset brands found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Asset Statuses */}
        <Card>
          <CardHeader>
            <CardTitle>{translations.customAssetStatuses}</CardTitle>
            <CardDescription>{translations.customAssetStatusesDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                  <Label htmlFor="newStatusName">{translations.name}</Label>
                  <Input 
                    id="newStatusName" 
                    value={newStatusName} 
                    onChange={(e) => setNewStatusName(e.target.value)}
                    placeholder="Example: On Loan"
                  />
                </div>
                <div className="md:col-span-4">
                  <Label htmlFor="newStatusDescription">{translations.description}</Label>
                  <Input 
                    id="newStatusDescription" 
                    value={newStatusDescription} 
                    onChange={(e) => setNewStatusDescription(e.target.value)}
                    placeholder="Example: Temporarily assigned outside department"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="newStatusColor">{translations.color}</Label>
                  <Input 
                    id="newStatusColor" 
                    type="color"
                    value={newStatusColor} 
                    onChange={(e) => setNewStatusColor(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={handleAddAssetStatus}
                    disabled={createAssetStatusMutation.isPending || !newStatusName.trim()}
                  >
                    {translations.add}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">{translations.name}</th>
                      <th className="px-4 py-2 text-left">{translations.description}</th>
                      <th className="px-4 py-2 text-left">{translations.color}</th>
                      <th className="px-4 py-2 text-left">{translations.sample}</th>
                      <th className="px-4 py-2 text-right">{translations.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-2">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ) : Array.isArray(customAssetStatuses) && customAssetStatuses.length > 0 ? (
                      customAssetStatuses.map((status: any) => (
                        <tr key={status.id} className="border-b">
                          <td className="px-4 py-2">{status.name}</td>
                          <td className="px-4 py-2">{status.description}</td>
                          <td className="px-4 py-2">{status.color}</td>
                          <td className="px-4 py-2">
                            <div 
                              className="w-6 h-6 rounded-full" 
                              style={{ backgroundColor: status.color }}
                            ></div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteAssetStatusMutation.mutate(status.id)}
                              disabled={deleteAssetStatusMutation.isPending}
                            >
                              {translations.delete}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-center text-muted-foreground">
                          No custom asset statuses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Providers */}
        <Card>
          <CardHeader>
            <CardTitle>{translations.serviceProviders}</CardTitle>
            <CardDescription>{translations.serviceProvidersDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Label htmlFor="newProviderName">{translations.name}</Label>
                  <Input 
                    id="newProviderName" 
                    value={newProviderName} 
                    onChange={(e) => setNewProviderName(e.target.value)}
                    placeholder="Example: TechSupport Inc"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="newProviderContact">{translations.contactPerson}</Label>
                  <Input 
                    id="newProviderContact" 
                    value={newProviderContact} 
                    onChange={(e) => setNewProviderContact(e.target.value)}
                    placeholder="Example: John Smith"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="newProviderPhone">{translations.phone}</Label>
                  <Input 
                    id="newProviderPhone" 
                    value={newProviderPhone} 
                    onChange={(e) => setNewProviderPhone(e.target.value)}
                    placeholder="Example: +1 555-123-4567"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="newProviderEmail">{translations.email}</Label>
                  <Input 
                    id="newProviderEmail" 
                    value={newProviderEmail} 
                    onChange={(e) => setNewProviderEmail(e.target.value)}
                    placeholder="Example: contact@techsupport.com"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button 
                    className="w-full" 
                    onClick={handleAddServiceProvider}
                    disabled={createServiceProviderMutation.isPending || !newProviderName.trim()}
                  >
                    {translations.add}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">{translations.name}</th>
                      <th className="px-4 py-2 text-left">{translations.contactPerson}</th>
                      <th className="px-4 py-2 text-left">{translations.phone}</th>
                      <th className="px-4 py-2 text-left">{translations.email}</th>
                      <th className="px-4 py-2 text-right">{translations.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-2">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ) : Array.isArray(serviceProviders) && serviceProviders.length > 0 ? (
                      serviceProviders.map((provider: any) => (
                        <tr key={provider.id} className="border-b">
                          <td className="px-4 py-2">{provider.name}</td>
                          <td className="px-4 py-2">{provider.contactPerson || '-'}</td>
                          <td className="px-4 py-2">{provider.phone || '-'}</td>
                          <td className="px-4 py-2">{provider.email || '-'}</td>
                          <td className="px-4 py-2 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => deleteServiceProviderMutation.mutate(provider.id)}
                              disabled={deleteServiceProviderMutation.isPending}
                            >
                              {translations.delete}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-center text-muted-foreground">
                          No service providers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
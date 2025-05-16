import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch system configuration
  const { data: config } = useQuery({
    queryKey: ['/api/system-config'],
    onSuccess: (data) => {
      if (data?.assetIdPrefix) {
        setAssetIdPrefix(data.assetIdPrefix);
      }
      setIsLoading(false);
    },
  });

  // Update system configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      const res = await apiRequest('PUT', '/api/system-config', configData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: translations.saveSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      assetIdPrefix
    });
  };

  // State for custom fields
  const [customAssetTypes, setCustomAssetTypes] = useState<any[]>([]);
  const [customAssetBrands, setCustomAssetBrands] = useState<any[]>([]);
  const [customAssetStatuses, setCustomAssetStatuses] = useState<any[]>([]);
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  
  // New item form states
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDescription, setNewBrandDescription] = useState('');
  
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusDescription, setNewStatusDescription] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3B82F6'); // Default blue
  
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderContact, setNewProviderContact] = useState('');
  const [newProviderPhone, setNewProviderPhone] = useState('');
  const [newProviderEmail, setNewProviderEmail] = useState('');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
        <p className="text-gray-600">{translations.pageDescription}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            {translations.generalSettings}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              {/* Language Setting */}
              <div className="space-y-2">
                <Label htmlFor="language-select">{translations.language}</Label>
                <div className="flex items-center gap-4">
                  <Select
                    value={language}
                    onValueChange={(value) => {
                      if (value !== language) {
                        toggleLanguage(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Globe className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={translations.language} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">{translations.english}</SelectItem>
                      <SelectItem value="Arabic">{translations.arabic}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Asset ID Prefix */}
              <div className="space-y-2">
                <Label htmlFor="asset-prefix">{translations.assetIdPrefix}</Label>
                <Input
                  id="asset-prefix"
                  value={assetIdPrefix}
                  onChange={(e) => setAssetIdPrefix(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500">{translations.assetIdPrefixDesc}</p>
              </div>
              
              {/* Save Button */}
              <Button 
                onClick={handleSaveConfig} 
                disabled={updateConfigMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {translations.save}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Module-Based Customization Sections */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mt-8 mb-6 border-b pb-2">
          {language === 'English' ? 'Module Customization' : 'تخصيص الوحدات'}
        </h2>
        
        {/* Asset Module Customization */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center text-blue-700">
            {translations.assetCustomization}
          </h3>
          
          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Asset Types Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{translations.customAssetTypes}</CardTitle>
                <CardDescription className="text-xs">{translations.customAssetTypesDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new type form */}
                  <div className="grid gap-4 md:grid-cols-12 border-b pb-4">
                    <div className="md:col-span-5">
                      <Label htmlFor="new-type-name" className="text-xs">{translations.name}</Label>
                      <Input 
                        id="new-type-name" 
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder={language === 'English' ? 'Enter type name' : 'أدخل اسم النوع'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Label htmlFor="new-type-desc" className="text-xs">{translations.description}</Label>
                      <Input 
                        id="new-type-desc" 
                        value={newTypeDescription}
                        onChange={(e) => setNewTypeDescription(e.target.value)}
                        placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button 
                        className="w-full h-8 text-xs" 
                        size="sm"
                        disabled={!newTypeName.trim()}
                      >
                        {translations.add}
                      </Button>
                    </div>
                  </div>
                  
                  {/* List of custom types - Table Format */}
                  <div className="overflow-auto max-h-80 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.name}
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.description}
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Action' : 'إجراء'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Predefined Asset Types */}
                        {[
                          { id: 1, name: 'Laptop', description: 'Portable computers' },
                          { id: 2, name: 'Desktop', description: 'Stationary workstations' },
                          { id: 3, name: 'Mobile', description: 'Smartphones and tablets' },
                          { id: 4, name: 'Monitor', description: 'Display screens' },
                          { id: 5, name: 'Printer', description: 'Document printing devices' }
                        ].map((type) => (
                          <tr key={type.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{type.name}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {type.description}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-xs text-gray-400">
                                {language === 'English' ? 'Default' : 'افتراضي'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Custom Types - Empty State */}
                        {customAssetTypes.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-3 text-center text-gray-500 text-xs">
                              {language === 'English' ? 'No custom types added yet' : 'لم تتم إضافة أنواع مخصصة بعد'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Custom Asset Brands Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{translations.customAssetBrands}</CardTitle>
                <CardDescription className="text-xs">{translations.customAssetBrandsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new brand form */}
                  <div className="grid gap-4 md:grid-cols-12 border-b pb-4">
                    <div className="md:col-span-5">
                      <Label htmlFor="new-brand-name" className="text-xs">{translations.name}</Label>
                      <Input 
                        id="new-brand-name" 
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder={language === 'English' ? 'Enter brand name' : 'أدخل اسم العلامة التجارية'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Label htmlFor="new-brand-desc" className="text-xs">{translations.description}</Label>
                      <Input 
                        id="new-brand-desc" 
                        value={newBrandDescription}
                        onChange={(e) => setNewBrandDescription(e.target.value)}
                        placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button 
                        className="w-full h-8 text-xs"
                        size="sm" 
                        disabled={!newBrandName.trim()}
                      >
                        {translations.add}
                      </Button>
                    </div>
                  </div>
                  
                  {/* List of custom brands - Table Format */}
                  <div className="overflow-auto max-h-80 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.name}
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.description}
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Action' : 'إجراء'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Predefined Brands */}
                        {[
                          { id: 1, name: 'Dell', description: 'Dell Technologies' },
                          { id: 2, name: 'HP', description: 'Hewlett-Packard' },
                          { id: 3, name: 'Apple', description: 'Apple Inc.' },
                          { id: 4, name: 'Lenovo', description: 'Lenovo Group Ltd' },
                          { id: 5, name: 'Microsoft', description: 'Microsoft Corporation' }
                        ].map((brand) => (
                          <tr key={brand.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{brand.name}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {brand.description}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-xs text-gray-400">
                                {language === 'English' ? 'Common' : 'شائع'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Custom Brands - Empty State */}
                        {customAssetBrands.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-3 text-center text-gray-500 text-xs">
                              {language === 'English' ? 'No custom brands added yet' : 'لم تتم إضافة علامات تجارية مخصصة بعد'}
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
          
          {/* Second Row of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Custom Asset Statuses Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{translations.customAssetStatuses}</CardTitle>
                <CardDescription className="text-xs">{translations.customAssetStatusesDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new status form */}
                  <div className="grid gap-4 md:grid-cols-12 border-b pb-4">
                    <div className="md:col-span-4">
                      <Label htmlFor="new-status-name" className="text-xs">{translations.name}</Label>
                      <Input 
                        id="new-status-name" 
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        placeholder={language === 'English' ? 'Enter status name' : 'أدخل اسم الحالة'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label htmlFor="new-status-desc" className="text-xs">{translations.description}</Label>
                      <Input 
                        id="new-status-desc" 
                        value={newStatusDescription}
                        onChange={(e) => setNewStatusDescription(e.target.value)}
                        placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="new-status-color" className="text-xs">{translations.color}</Label>
                      <div className="flex h-8 items-center">
                        <Input 
                          id="new-status-color" 
                          type="color"
                          value={newStatusColor}
                          onChange={(e) => setNewStatusColor(e.target.value)}
                          className="h-8 p-1 w-full"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button 
                        className="w-full h-8 text-xs"
                        size="sm"
                        disabled={!newStatusName.trim()}
                      >
                        {translations.add}
                      </Button>
                    </div>
                  </div>
                  
                  {/* List of custom statuses - Table Format */}
                  <div className="overflow-auto max-h-80 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.name}
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.description}
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.color}
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Action' : 'إجراء'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Predefined Statuses */}
                        {[
                          { id: 1, name: 'Available', description: 'Asset ready for use', color: '#22c55e' },
                          { id: 2, name: 'In Use', description: 'Asset currently assigned', color: '#3b82f6' },
                          { id: 3, name: 'Maintenance', description: 'Under maintenance', color: '#f59e0b' },
                          { id: 4, name: 'Damaged', description: 'Asset is damaged', color: '#ef4444' },
                          { id: 5, name: 'Retired', description: 'No longer in service', color: '#6b7280' }
                        ].map((status) => (
                          <tr key={status.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{status.name}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {status.description}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div 
                                className="h-5 w-5 rounded-full mx-auto" 
                                style={{ backgroundColor: status.color }}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-xs text-gray-400">
                                {language === 'English' ? 'Default' : 'افتراضي'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Custom Statuses - Empty State */}
                        {customAssetStatuses.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-center text-gray-500 text-xs">
                              {language === 'English' ? 'No custom statuses added yet' : 'لم تتم إضافة حالات مخصصة بعد'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Service Providers Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{translations.serviceProviders}</CardTitle>
                <CardDescription className="text-xs">{translations.serviceProvidersDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new provider form */}
                  <div className="grid gap-4 md:grid-cols-12 border-b pb-4">
                    <div className="md:col-span-6">
                      <Label htmlFor="new-provider-name" className="text-xs">{translations.name}</Label>
                      <Input 
                        id="new-provider-name" 
                        value={newProviderName}
                        onChange={(e) => setNewProviderName(e.target.value)}
                        placeholder={language === 'English' ? 'Provider name' : 'اسم المزود'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label htmlFor="new-provider-contact" className="text-xs">
                        {language === 'English' ? 'Contact' : 'جهة الاتصال'}
                      </Label>
                      <Input 
                        id="new-provider-contact" 
                        value={newProviderContact}
                        onChange={(e) => setNewProviderContact(e.target.value)}
                        placeholder={language === 'English' ? 'Contact name' : 'اسم جهة الاتصال'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button 
                        className="w-full h-8 text-xs"
                        size="sm"
                        disabled={!newProviderName.trim()}
                      >
                        {translations.add}
                      </Button>
                    </div>
                    <div className="md:col-span-6">
                      <Label htmlFor="new-provider-phone" className="text-xs">
                        {language === 'English' ? 'Phone' : 'رقم الهاتف'}
                      </Label>
                      <Input 
                        id="new-provider-phone" 
                        value={newProviderPhone}
                        onChange={(e) => setNewProviderPhone(e.target.value)}
                        placeholder={language === 'English' ? 'Phone number' : 'رقم الهاتف'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-6">
                      <Label htmlFor="new-provider-email" className="text-xs">
                        {language === 'English' ? 'Email' : 'البريد الإلكتروني'}
                      </Label>
                      <Input 
                        id="new-provider-email" 
                        value={newProviderEmail}
                        onChange={(e) => setNewProviderEmail(e.target.value)}
                        placeholder={language === 'English' ? 'Email address' : 'البريد الإلكتروني'}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* List of service providers - Table Format */}
                  <div className="overflow-auto max-h-80 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.name}
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Contact Info' : 'معلومات الاتصال'}
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Action' : 'إجراء'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Sample Service Providers */}
                        {[
                          { id: 1, name: 'TechSupport Inc.', contact: 'John Smith', phone: '+1-555-123-4567', email: 'support@techsupport.com' },
                          { id: 2, name: 'IT Solutions Ltd', contact: 'Jane Doe', phone: '+1-555-987-6543', email: 'service@itsolutions.com' }
                        ].map((provider) => (
                          <tr key={provider.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{provider.name}</span>
                              <div className="text-xs text-gray-500">{provider.contact}</div>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500">
                              <div>{provider.phone}</div>
                              <div>{provider.email}</div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-xs text-gray-400">
                                {language === 'English' ? 'Sample' : 'عينة'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Custom Providers - Empty State */}
                        {serviceProviders.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-3 py-3 text-center text-gray-500 text-xs">
                              {language === 'English' ? 'No service providers added yet' : 'لم تتم إضافة مزودي خدمة بعد'}
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
        
        {/* Ticket Module Customization */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center text-purple-700">
            {language === 'English' ? 'Ticket Customization' : 'تخصيص التذاكر'}
          </h3>
          
          {/* Ticket Customization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ticket Categories Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {language === 'English' ? 'Ticket Categories' : 'فئات التذاكر'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'English' 
                    ? 'Define custom categories for support tickets' 
                    : 'تحديد فئات مخصصة لتذاكر الدعم'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new category form */}
                  <div className="grid gap-4 md:grid-cols-12 border-b pb-4">
                    <div className="md:col-span-5">
                      <Label htmlFor="new-category-name" className="text-xs">{translations.name}</Label>
                      <Input 
                        id="new-category-name"
                        placeholder={language === 'English' ? 'Enter category name' : 'أدخل اسم الفئة'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <Label htmlFor="new-category-desc" className="text-xs">{translations.description}</Label>
                      <Input 
                        id="new-category-desc"
                        placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button className="w-full h-8 text-xs" size="sm">
                        {translations.add}
                      </Button>
                    </div>
                  </div>
                  
                  {/* List of ticket categories - Table Format */}
                  <div className="overflow-auto max-h-80 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.name}
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.description}
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Action' : 'إجراء'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Default Ticket Categories */}
                        {[
                          { id: 1, name: 'Hardware', description: 'Hardware-related issues' },
                          { id: 2, name: 'Software', description: 'Software-related issues' },
                          { id: 3, name: 'Network', description: 'Network connectivity issues' },
                          { id: 4, name: 'Other', description: 'Other miscellaneous issues' }
                        ].map((category) => (
                          <tr key={category.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{category.name}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {category.description}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-xs text-gray-400">
                                {language === 'English' ? 'Default' : 'افتراضي'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Ticket Priorities Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {language === 'English' ? 'Ticket Priorities' : 'أولويات التذاكر'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'English' 
                    ? 'Define custom priorities for support tickets' 
                    : 'تحديد أولويات مخصصة لتذاكر الدعم'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new priority form */}
                  <div className="grid gap-4 md:grid-cols-12 border-b pb-4">
                    <div className="md:col-span-4">
                      <Label htmlFor="new-priority-name" className="text-xs">{translations.name}</Label>
                      <Input 
                        id="new-priority-name"
                        placeholder={language === 'English' ? 'Enter priority name' : 'أدخل اسم الأولوية'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label htmlFor="new-priority-desc" className="text-xs">{translations.description}</Label>
                      <Input 
                        id="new-priority-desc"
                        placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="new-priority-color" className="text-xs">{translations.color}</Label>
                      <div className="flex h-8 items-center">
                        <Input 
                          id="new-priority-color" 
                          type="color"
                          defaultValue="#ef4444"
                          className="h-8 p-1 w-full"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <Button className="w-full h-8 text-xs" size="sm">
                        {translations.add}
                      </Button>
                    </div>
                  </div>
                  
                  {/* List of ticket priorities - Table Format */}
                  <div className="overflow-auto max-h-80 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.name}
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.description}
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {translations.color}
                          </th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {language === 'English' ? 'Action' : 'إجراء'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Default Ticket Priorities */}
                        {[
                          { id: 1, name: 'Low', description: 'Non-urgent issues', color: '#22c55e' },
                          { id: 2, name: 'Medium', description: 'Standard priority', color: '#f59e0b' },
                          { id: 3, name: 'High', description: 'Urgent issues', color: '#ef4444' }
                        ].map((priority) => (
                          <tr key={priority.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className="font-medium">{priority.name}</span>
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {priority.description}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div 
                                className="h-5 w-5 rounded-full mx-auto" 
                                style={{ backgroundColor: priority.color }}
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className="text-xs text-gray-400">
                                {language === 'English' ? 'Default' : 'افتراضي'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

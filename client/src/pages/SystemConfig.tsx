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

      {/* Asset Customization Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">{translations.assetCustomization}</h2>

      {/* Custom Asset Types Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{translations.customAssetTypes}</CardTitle>
          <CardDescription>{translations.customAssetTypesDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new type form */}
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-5">
                <Label htmlFor="new-type-name">{translations.name}</Label>
                <Input 
                  id="new-type-name" 
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder={language === 'English' ? 'Enter type name' : 'أدخل اسم النوع'}
                />
              </div>
              <div className="md:col-span-5">
                <Label htmlFor="new-type-desc">{translations.description}</Label>
                <Input 
                  id="new-type-desc" 
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                  placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button 
                  className="w-full" 
                  disabled={!newTypeName.trim()}
                >
                  {translations.add}
                </Button>
              </div>
            </div>
            
            {/* List of custom types */}
            <div className="border rounded-md">
              <div className="p-6 text-center text-gray-500">
                {language === 'English' ? 'This feature is coming soon' : 'هذه الميزة قادمة قريبًا'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Asset Brands Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{translations.customAssetBrands}</CardTitle>
          <CardDescription>{translations.customAssetBrandsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new brand form */}
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-5">
                <Label htmlFor="new-brand-name">{translations.name}</Label>
                <Input 
                  id="new-brand-name" 
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder={language === 'English' ? 'Enter brand name' : 'أدخل اسم العلامة التجارية'}
                />
              </div>
              <div className="md:col-span-5">
                <Label htmlFor="new-brand-desc">{translations.description}</Label>
                <Input 
                  id="new-brand-desc" 
                  value={newBrandDescription}
                  onChange={(e) => setNewBrandDescription(e.target.value)}
                  placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button 
                  className="w-full" 
                  disabled={!newBrandName.trim()}
                >
                  {translations.add}
                </Button>
              </div>
            </div>
            
            {/* List of custom brands */}
            <div className="border rounded-md">
              <div className="p-6 text-center text-gray-500">
                {language === 'English' ? 'This feature is coming soon' : 'هذه الميزة قادمة قريبًا'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Custom Asset Statuses Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{translations.customAssetStatuses}</CardTitle>
          <CardDescription>{translations.customAssetStatusesDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new status form */}
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <Label htmlFor="new-status-name">{translations.name}</Label>
                <Input 
                  id="new-status-name" 
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder={language === 'English' ? 'Enter status name' : 'أدخل اسم الحالة'}
                />
              </div>
              <div className="md:col-span-4">
                <Label htmlFor="new-status-desc">{translations.description}</Label>
                <Input 
                  id="new-status-desc" 
                  value={newStatusDescription}
                  onChange={(e) => setNewStatusDescription(e.target.value)}
                  placeholder={language === 'English' ? 'Enter description' : 'أدخل الوصف'}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-status-color">{translations.color}</Label>
                <Input 
                  id="new-status-color" 
                  type="color"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="h-10 p-1"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button 
                  className="w-full" 
                  disabled={!newStatusName.trim()}
                >
                  {translations.add}
                </Button>
              </div>
            </div>
            
            {/* List of custom statuses */}
            <div className="border rounded-md">
              <div className="p-6 text-center text-gray-500">
                {language === 'English' ? 'This feature is coming soon' : 'هذه الميزة قادمة قريبًا'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Service Providers Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{translations.serviceProviders}</CardTitle>
          <CardDescription>{translations.serviceProvidersDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add new provider form */}
            <div className="grid gap-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Label htmlFor="new-provider-name">{translations.name}</Label>
                <Input 
                  id="new-provider-name" 
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder={language === 'English' ? 'Provider name' : 'اسم المزود'}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="new-provider-contact">
                  {language === 'English' ? 'Contact Person' : 'الشخص المسؤول'}
                </Label>
                <Input 
                  id="new-provider-contact" 
                  value={newProviderContact}
                  onChange={(e) => setNewProviderContact(e.target.value)}
                  placeholder={language === 'English' ? 'Contact name' : 'اسم جهة الاتصال'}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-provider-phone">
                  {language === 'English' ? 'Phone' : 'رقم الهاتف'}
                </Label>
                <Input 
                  id="new-provider-phone" 
                  value={newProviderPhone}
                  onChange={(e) => setNewProviderPhone(e.target.value)}
                  placeholder={language === 'English' ? 'Phone number' : 'رقم الهاتف'}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-provider-email">
                  {language === 'English' ? 'Email' : 'البريد الإلكتروني'}
                </Label>
                <Input 
                  id="new-provider-email" 
                  value={newProviderEmail}
                  onChange={(e) => setNewProviderEmail(e.target.value)}
                  placeholder={language === 'English' ? 'Email address' : 'البريد الإلكتروني'}
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button 
                  className="w-full" 
                  disabled={!newProviderName.trim()}
                >
                  {translations.add}
                </Button>
              </div>
            </div>
            
            {/* List of service providers */}
            <div className="border rounded-md">
              <div className="p-6 text-center text-gray-500">
                {language === 'English' ? 'This feature is coming soon' : 'هذه الميزة قادمة قريبًا'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

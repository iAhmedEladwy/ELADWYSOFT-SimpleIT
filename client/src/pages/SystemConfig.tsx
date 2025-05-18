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
import { Settings, Save, Globe, Loader2, Trash, Plus, Edit, Check, X } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemConfig() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [assetIdPrefix, setAssetIdPrefix] = useState('SIT-');
  const [empIdPrefix, setEmpIdPrefix] = useState('EMP-');
  const [ticketIdPrefix, setTicketIdPrefix] = useState('TKT-');
  const [currency, setCurrency] = useState('USD');
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
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
  const { data: customAssetTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-types'],
    enabled: hasAccess(3),
  });
  
  const { data: customAssetBrands = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-brands'],
    enabled: hasAccess(3),
  });
  
  const { data: customAssetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    enabled: hasAccess(3),
  });
  
  const { data: serviceProviders = [] } = useQuery<any[]>({
    queryKey: ['/api/service-providers'],
    enabled: hasAccess(3),
  });

  const { data: config } = useQuery<any>({
    queryKey: ['/api/system-config'],
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
      setIsLoading(false);
    }
  }, [config]);

  // Asset type state management
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editedTypeName, setEditedTypeName] = useState('');
  const [editedTypeDescription, setEditedTypeDescription] = useState('');

  // Create custom asset type mutation
  const createAssetTypeMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest('/api/custom-asset-types', {
        method: 'POST',
        data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type added successfully' : 'تمت إضافة نوع الأصل بنجاح',
      });
      setNewTypeName('');
      setNewTypeDescription('');
    }
  });

  // Delete custom asset type mutation
  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/custom-asset-types/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type deleted successfully' : 'تم حذف نوع الأصل بنجاح',
      });
    }
  });

  // Update asset brand mutation
  const updateAssetBrandMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description?: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/custom-asset-brands/${id}`, {
        method: 'PUT',
        data: updateData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث العلامة التجارية بنجاح',
      });
      setEditingBrandId(null);
      setEditedBrandName('');
      setEditedBrandDescription('');
    }
  });

  // Create custom asset brand mutation
  const createAssetBrandMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest('/api/custom-asset-brands', {
        method: 'POST',
        data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand added successfully' : 'تمت إضافة العلامة التجارية بنجاح',
      });
      setNewBrandName('');
      setNewBrandDescription('');
    }
  });

  // Delete custom asset brand mutation
  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/custom-asset-brands/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand deleted successfully' : 'تم حذف العلامة التجارية بنجاح',
      });
    }
  });

  // Status state management
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editedStatusName, setEditedStatusName] = useState('');
  const [editedStatusDescription, setEditedStatusDescription] = useState('');
  const [editedStatusColor, setEditedStatusColor] = useState('#3B82F6');

  // Update asset status mutation
  const updateAssetStatusMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description?: string; color?: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/custom-asset-statuses/${id}`, {
        method: 'PUT',
        data: updateData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصل بنجاح',
      });
      setEditingStatusId(null);
      setEditedStatusName('');
      setEditedStatusDescription('');
      setEditedStatusColor('#3B82F6');
    }
  });

  // Create custom asset status mutation
  const createAssetStatusMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      return await apiRequest('/api/custom-asset-statuses', {
        method: 'POST',
        data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status added successfully' : 'تمت إضافة حالة الأصل بنجاح',
      });
      setNewStatusName('');
      setNewStatusDescription('');
      setNewStatusColor('#3B82F6');
    }
  });

  // Delete custom asset status mutation
  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/custom-asset-statuses/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status deleted successfully' : 'تم حذف حالة الأصل بنجاح',
      });
    }
  });

  // Service provider state management
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [editedProviderName, setEditedProviderName] = useState('');
  const [editedProviderContact, setEditedProviderContact] = useState('');
  const [editedProviderPhone, setEditedProviderPhone] = useState('');
  const [editedProviderEmail, setEditedProviderEmail] = useState('');

  // Update service provider mutation
  const updateServiceProviderMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; contactPerson?: string; phone?: string; email?: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/service-providers/${id}`, {
        method: 'PUT',
        data: updateData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider updated successfully' : 'تم تحديث مزود الخدمة بنجاح',
      });
      setEditingProviderId(null);
      setEditedProviderName('');
      setEditedProviderContact('');
      setEditedProviderPhone('');
      setEditedProviderEmail('');
    }
  });

  // Create service provider mutation
  const createServiceProviderMutation = useMutation({
    mutationFn: async (data: { name: string; contactPerson?: string; phone?: string; email?: string }) => {
      return await apiRequest('/api/service-providers', {
        method: 'POST',
        data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider added successfully' : 'تمت إضافة مزود الخدمة بنجاح',
      });
      setNewProviderName('');
      setNewProviderContact('');
      setNewProviderPhone('');
      setNewProviderEmail('');
    }
  });

  // Delete service provider mutation
  const deleteServiceProviderMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/service-providers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider deleted successfully' : 'تم حذف مزود الخدمة بنجاح',
      });
    }
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/system-config', {
        method: 'PUT',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Settings updated successfully' : 'تم تحديث الإعدادات بنجاح',
      });
    }
  });

  // Remove demo data mutation
  const removeDemoDataMutation = useMutation({
    mutationFn: () => 
      apiRequest('/api/remove-demo-data', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Demo data removed successfully' : 'تمت إزالة بيانات العرض التوضيحي بنجاح',
      });
    }
  });

  // Handle save config
  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments
    });
  };

  // Brand state management
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editedBrandName, setEditedBrandName] = useState('');
  const [editedBrandDescription, setEditedBrandDescription] = useState('');

  // Update asset type mutation
  const updateAssetTypeMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description?: string }) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/custom-asset-types/${id}`, {
        method: 'PUT',
        data: updateData
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
      setEditingTypeId(null);
      setEditedTypeName('');
      setEditedTypeDescription('');
    }
  });

  // Handle add asset type
  const handleAddAssetType = () => {
    if (!newTypeName.trim()) return;
    
    createAssetTypeMutation.mutate({
      name: newTypeName,
      description: newTypeDescription
    });
  };

  // Handle edit asset type
  const handleEditAssetType = (type: any) => {
    setEditingTypeId(type.id);
    setEditedTypeName(type.name);
    setEditedTypeDescription(type.description || '');
  };

  // Handle save edited asset type
  const handleSaveEditedAssetType = () => {
    if (editingTypeId === null || !editedTypeName.trim()) return;
    
    updateAssetTypeMutation.mutate({
      id: editingTypeId,
      name: editedTypeName,
      description: editedTypeDescription || undefined
    });
  };

  // Handle add asset brand
  const handleAddAssetBrand = () => {
    if (!newBrandName.trim()) return;
    
    createAssetBrandMutation.mutate({
      name: newBrandName,
      description: newBrandDescription
    });
  };
  
  // Handle edit asset brand
  const handleEditAssetBrand = (brand: any) => {
    setEditingBrandId(brand.id);
    setEditedBrandName(brand.name);
    setEditedBrandDescription(brand.description || '');
  };

  // Handle save edited asset brand
  const handleSaveEditedAssetBrand = () => {
    if (editingBrandId === null || !editedBrandName.trim()) return;
    
    updateAssetBrandMutation.mutate({
      id: editingBrandId,
      name: editedBrandName,
      description: editedBrandDescription || undefined
    });
  };

  // Handle add asset status
  const handleAddAssetStatus = () => {
    if (!newStatusName.trim()) return;
    
    createAssetStatusMutation.mutate({
      name: newStatusName,
      description: newStatusDescription,
      color: newStatusColor
    });
  };
  
  // Handle edit asset status
  const handleEditAssetStatus = (status: any) => {
    setEditingStatusId(status.id);
    setEditedStatusName(status.name);
    setEditedStatusDescription(status.description || '');
    setEditedStatusColor(status.color || '#3B82F6');
  };

  // Handle save edited asset status
  const handleSaveEditedAssetStatus = () => {
    if (editingStatusId === null || !editedStatusName.trim()) return;
    
    updateAssetStatusMutation.mutate({
      id: editingStatusId,
      name: editedStatusName,
      description: editedStatusDescription || undefined,
      color: editedStatusColor
    });
  };

  // Handle add service provider
  const handleAddServiceProvider = () => {
    if (!newProviderName.trim()) return;
    
    createServiceProviderMutation.mutate({
      name: newProviderName,
      contactPerson: newProviderContact || undefined,
      phone: newProviderPhone || undefined,
      email: newProviderEmail || undefined
    });
  };
  
  // Handle edit service provider
  const handleEditServiceProvider = (provider: any) => {
    setEditingProviderId(provider.id);
    setEditedProviderName(provider.name);
    setEditedProviderContact(provider.contactPerson || '');
    setEditedProviderPhone(provider.phone || '');
    setEditedProviderEmail(provider.email || '');
  };

  // Handle save edited service provider
  const handleSaveEditedServiceProvider = () => {
    if (editingProviderId === null || !editedProviderName.trim()) return;
    
    updateServiceProviderMutation.mutate({
      id: editingProviderId,
      name: editedProviderName,
      contactPerson: editedProviderContact || undefined,
      phone: editedProviderPhone || undefined,
      email: editedProviderEmail || undefined
    });
  };

  // Department state management
  const [editingDepartmentIndex, setEditingDepartmentIndex] = useState<number | null>(null);
  const [editedDepartmentName, setEditedDepartmentName] = useState('');

  // Handle add department
  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    
    setDepartments([...departments, newDepartment]);
    setNewDepartment('');
  };

  // Handle edit department mode
  const handleEditDepartment = (index: number) => {
    setEditingDepartmentIndex(index);
    setEditedDepartmentName(departments[index]);
  };

  // Handle save edited department
  const handleSaveEditedDepartment = () => {
    if (editingDepartmentIndex === null || !editedDepartmentName.trim()) return;
    
    const newDepartments = [...departments];
    newDepartments[editingDepartmentIndex] = editedDepartmentName;
    setDepartments(newDepartments);
    setEditingDepartmentIndex(null);
    setEditedDepartmentName('');
  };

  // Handle delete department
  const handleDeleteDepartment = (index: number) => {
    const newDepartments = [...departments];
    newDepartments.splice(index, 1);
    setDepartments(newDepartments);
  };

  // Handle remove demo data
  const handleRemoveDemoData = () => {
    if (window.confirm(language === 'English' 
      ? 'Are you sure you want to remove all demo data? This cannot be undone.' 
      : 'هل أنت متأكد أنك تريد إزالة جميع بيانات العرض التوضيحي؟ لا يمكن التراجع عن هذا.')) {
      removeDemoDataMutation.mutate();
    }
  };

  // Translations
  const translations = {
    title: language === 'English' ? 'System Configuration' : 'إعدادات النظام',
    pageDescription: language === 'English' ? 'Manage system-wide settings and preferences' : 'إدارة إعدادات وتفضيلات النظام',
    generalSettings: language === 'English' ? 'General Settings' : 'الإعدادات العامة',
    language: language === 'English' ? 'Language' : 'اللغة',
    english: language === 'English' ? 'English' : 'الإنجليزية',
    arabic: language === 'English' ? 'Arabic' : 'العربية',
    currency: language === 'English' ? 'Currency' : 'العملة',
    currencyDesc: language === 'English' ? 'Currency used throughout the system' : 'العملة المستخدمة في جميع أنحاء النظام',
    assetIdPrefix: language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل',
    assetIdPrefixDesc: language === 'English' ? 'Prefix for auto-generated asset IDs' : 'بادئة لمعرفات الأصول المولدة تلقائيًا',
    empIdPrefix: language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف',
    empIdPrefixDesc: language === 'English' ? 'Prefix for auto-generated employee IDs' : 'بادئة لمعرفات الموظفين المولدة تلقائيًا',
    ticketIdPrefix: language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة',
    ticketIdPrefixDesc: language === 'English' ? 'Prefix for auto-generated ticket IDs' : 'بادئة لمعرفات التذاكر المولدة تلقائيًا',
    departments: language === 'English' ? 'Departments' : 'الأقسام',
    departmentsDesc: language === 'English' ? 'Manage departments in your organization' : 'إدارة الأقسام في مؤسستك',
    addDepartment: language === 'English' ? 'Add Department' : 'إضافة قسم',
    customAssetTypes: language === 'English' ? 'Custom Asset Types' : 'أنواع الأصول المخصصة',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    name: language === 'English' ? 'Name' : 'الاسم',
    description: language === 'English' ? 'Description' : 'الوصف',
    contactPerson: language === 'English' ? 'Contact Person' : 'الشخص المسؤول',
    phone: language === 'English' ? 'Phone' : 'الهاتف',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
  };

  if (!hasAccess(3)) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">
          {language === 'English' ? 'Access Denied' : 'تم رفض الوصول'}
        </h1>
        <p>
          {language === 'English' 
            ? 'You do not have permission to access system configuration settings.' 
            : 'ليس لديك إذن للوصول إلى إعدادات تكوين النظام.'}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" /> {translations.title}
          </h1>
          <p className="text-sm text-muted-foreground">{translations.pageDescription}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full mb-6">
        <TabsList className="w-full justify-start mb-4 flex flex-wrap">
          <TabsTrigger value="general" className="px-4 py-2">General Settings</TabsTrigger>
          <TabsTrigger value="id-config" className="px-4 py-2">ID Configuration</TabsTrigger>
          <TabsTrigger value="departments" className="px-4 py-2">Departments</TabsTrigger>
          <TabsTrigger value="assets" className="px-4 py-2">Asset Management</TabsTrigger>
          <TabsTrigger value="service-providers" className="px-4 py-2">Service Providers</TabsTrigger>
          <TabsTrigger value="danger" className="px-4 py-2 text-red-500">Danger Zone</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language" className="text-sm font-medium mb-1 block">{translations.language}</Label>
                  <Select value={language} onValueChange={(value) => toggleLanguage(value)}>
                    <SelectTrigger className="w-full">
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
                
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium mb-1 block">{translations.currency}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={translations.currency} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{translations.currencyDesc}</p>
                </div>
              </div>
              
              <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending} className="w-full sm:w-auto mt-4">
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

        {/* ID Configuration Tab */}
        <TabsContent value="id-config" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">ID Format Configuration</CardTitle>
              <CardDescription>Configure prefixes for system-generated IDs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="assetIdPrefix" className="text-sm font-medium mb-1 block">{translations.assetIdPrefix}</Label>
                  <Input
                    id="assetIdPrefix"
                    value={assetIdPrefix}
                    onChange={(e) => setAssetIdPrefix(e.target.value)}
                    maxLength={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{translations.assetIdPrefixDesc}</p>
                </div>
                
                <div>
                  <Label htmlFor="empIdPrefix" className="text-sm font-medium mb-1 block">{translations.empIdPrefix}</Label>
                  <Input
                    id="empIdPrefix"
                    value={empIdPrefix}
                    onChange={(e) => setEmpIdPrefix(e.target.value)}
                    maxLength={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{translations.empIdPrefixDesc}</p>
                </div>
                
                <div>
                  <Label htmlFor="ticketIdPrefix" className="text-sm font-medium mb-1 block">{translations.ticketIdPrefix}</Label>
                  <Input
                    id="ticketIdPrefix"
                    value={ticketIdPrefix}
                    onChange={(e) => setTicketIdPrefix(e.target.value)}
                    maxLength={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{translations.ticketIdPrefixDesc}</p>
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
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{translations.departments}</CardTitle>
              <CardDescription>{translations.departmentsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input
                  placeholder={translations.addDepartment}
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                  className="flex-grow"
                />
                <Button 
                  onClick={handleAddDepartment} 
                  disabled={!newDepartment.trim()} 
                  className="sm:w-auto w-full"
                >
                  {translations.addDepartment}
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                {departments.length > 0 ? (
                  <ul className="divide-y max-h-80 overflow-y-auto">
                    {departments.map((dept, idx) => (
                      <li key={idx} className="flex justify-between items-center p-3">
                        {editingDepartmentIndex === idx ? (
                          <div className="flex items-center gap-2 flex-grow">
                            <Input
                              value={editedDepartmentName}
                              onChange={(e) => setEditedDepartmentName(e.target.value)}
                              className="h-8"
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              onClick={handleSaveEditedDepartment}
                              className="px-2 h-8"
                            >
                              {language === 'English' ? 'Save' : 'حفظ'}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setEditingDepartmentIndex(null)}
                              className="px-2 h-8"
                            >
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span>{dept}</span>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditDepartment(idx)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteDepartment(idx)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {language === 'English' ? 'No departments added yet' : 'لم تتم إضافة أقسام بعد'}
                  </div>
                )}
              </div>
              
              <Button onClick={handleSaveConfig} disabled={updateConfigMutation.isPending} className="w-full sm:w-auto mt-4">
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
        
        {/* Asset Management Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Tabs defaultValue="types" className="w-full">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="types">Asset Types</TabsTrigger>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="statuses">Statuses</TabsTrigger>
            </TabsList>
            
            {/* Types Tab */}
            <TabsContent value="types">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{translations.customAssetTypes}</CardTitle>
                  <CardDescription>Create custom asset types in addition to default types</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Input
                      placeholder={language === 'English' ? 'Type name' : 'اسم النوع'}
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="flex-grow"
                    />
                    <Input
                      placeholder={language === 'English' ? 'Description (optional)' : 'الوصف (اختياري)'}
                      value={newTypeDescription}
                      onChange={(e) => setNewTypeDescription(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      onClick={handleAddAssetType} 
                      disabled={!newTypeName.trim() || createAssetTypeMutation.isPending}
                      className="sm:w-auto w-full"
                    >
                      {language === 'English' ? 'Add' : 'إضافة'}
                    </Button>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    {customAssetTypes && customAssetTypes.length > 0 ? (
                      <ul className="divide-y max-h-60 overflow-y-auto">
                        {customAssetTypes.map((type: any) => (
                          <li key={type.id} className="flex justify-between items-center p-3">
                            {editingTypeId === type.id ? (
                              <div className="flex flex-col gap-2 w-full">
                                <Input
                                  value={editedTypeName}
                                  onChange={(e) => setEditedTypeName(e.target.value)}
                                  placeholder="Type name"
                                  className="h-8"
                                  autoFocus
                                />
                                <Input
                                  value={editedTypeDescription}
                                  onChange={(e) => setEditedTypeDescription(e.target.value)}
                                  placeholder="Description (optional)"
                                  className="h-8"
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                  <Button 
                                    size="sm" 
                                    onClick={handleSaveEditedAssetType}
                                    disabled={!editedTypeName.trim() || updateAssetTypeMutation.isPending}
                                    className="h-8 px-2"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    {language === 'English' ? 'Save' : 'حفظ'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setEditingTypeId(null)}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    {language === 'English' ? 'Cancel' : 'إلغاء'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <div className="font-medium">{type.name}</div>
                                  {type.description && <div className="text-xs text-muted-foreground">{type.description}</div>}
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditAssetType(type)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => deleteAssetTypeMutation.mutate(type.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    disabled={deleteAssetTypeMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        {language === 'English' ? 'No custom types added yet' : 'لم تتم إضافة أنواع مخصصة بعد'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Brands Tab */}
            <TabsContent value="brands">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{language === 'English' ? 'Custom Asset Brands' : 'علامات تجارية مخصصة للأصول'}</CardTitle>
                  <CardDescription>
                    {language === 'English' 
                      ? 'Create custom asset brands in addition to regular inputs' 
                      : 'إنشاء علامات تجارية مخصصة للأصول بالإضافة إلى الإدخالات العادية'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Input
                      placeholder={language === 'English' ? 'Brand name' : 'اسم العلامة التجارية'}
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="flex-grow"
                    />
                    <Input
                      placeholder={language === 'English' ? 'Description (optional)' : 'الوصف (اختياري)'}
                      value={newBrandDescription}
                      onChange={(e) => setNewBrandDescription(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      onClick={handleAddAssetBrand} 
                      disabled={!newBrandName.trim() || createAssetBrandMutation.isPending}
                      className="sm:w-auto w-full"
                    >
                      {language === 'English' ? 'Add' : 'إضافة'}
                    </Button>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    {customAssetBrands && customAssetBrands.length > 0 ? (
                      <ul className="divide-y max-h-60 overflow-y-auto">
                        {customAssetBrands.map((brand: any) => (
                          <li key={brand.id} className="flex justify-between items-center p-3">
                            {editingBrandId === brand.id ? (
                              <div className="flex flex-col gap-2 w-full">
                                <Input
                                  value={editedBrandName}
                                  onChange={(e) => setEditedBrandName(e.target.value)}
                                  placeholder="Brand name"
                                  className="h-8"
                                  autoFocus
                                />
                                <Input
                                  value={editedBrandDescription}
                                  onChange={(e) => setEditedBrandDescription(e.target.value)}
                                  placeholder="Description (optional)"
                                  className="h-8"
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                  <Button 
                                    size="sm" 
                                    onClick={handleSaveEditedAssetBrand}
                                    disabled={!editedBrandName.trim() || updateAssetBrandMutation.isPending}
                                    className="h-8 px-2"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    {language === 'English' ? 'Save' : 'حفظ'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setEditingBrandId(null)}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    {language === 'English' ? 'Cancel' : 'إلغاء'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <div className="font-medium">{brand.name}</div>
                                  {brand.description && <div className="text-xs text-muted-foreground">{brand.description}</div>}
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditAssetBrand(brand)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => deleteAssetBrandMutation.mutate(brand.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    disabled={deleteAssetBrandMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        {language === 'English' ? 'No custom brands added yet' : 'لم تتم إضافة علامات تجارية مخصصة بعد'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Statuses Tab */}
            <TabsContent value="statuses">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{language === 'English' ? 'Custom Asset Statuses' : 'حالات مخصصة للأصول'}</CardTitle>
                  <CardDescription>
                    {language === 'English' 
                      ? 'Create custom statuses in addition to default statuses' 
                      : 'إنشاء حالات مخصصة بالإضافة إلى الحالات الافتراضية'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-col">
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === 'English' ? 'Status name' : 'اسم الحالة'}
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        className="flex-grow"
                      />
                      <div className="w-20">
                        <Input
                          type="color"
                          value={newStatusColor}
                          onChange={(e) => setNewStatusColor(e.target.value)}
                          className="h-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder={language === 'English' ? 'Description (optional)' : 'الوصف (اختياري)'}
                        value={newStatusDescription}
                        onChange={(e) => setNewStatusDescription(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        onClick={handleAddAssetStatus} 
                        disabled={!newStatusName.trim() || createAssetStatusMutation.isPending}
                        className="sm:w-auto w-full"
                      >
                        {language === 'English' ? 'Add' : 'إضافة'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    {customAssetStatuses && customAssetStatuses.length > 0 ? (
                      <ul className="divide-y max-h-60 overflow-y-auto">
                        {customAssetStatuses.map((status: any) => (
                          <li key={status.id} className="flex justify-between items-center p-3">
                            {editingStatusId === status.id ? (
                              <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={editedStatusName}
                                    onChange={(e) => setEditedStatusName(e.target.value)}
                                    placeholder="Status name"
                                    className="h-8 flex-grow"
                                    autoFocus
                                  />
                                  <div className="w-14">
                                    <Input
                                      type="color"
                                      value={editedStatusColor}
                                      onChange={(e) => setEditedStatusColor(e.target.value)}
                                      className="h-8 w-full"
                                    />
                                  </div>
                                </div>
                                <Input
                                  value={editedStatusDescription}
                                  onChange={(e) => setEditedStatusDescription(e.target.value)}
                                  placeholder="Description (optional)"
                                  className="h-8"
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                  <Button 
                                    size="sm" 
                                    onClick={handleSaveEditedAssetStatus}
                                    disabled={!editedStatusName.trim() || updateAssetStatusMutation.isPending}
                                    className="h-8 px-2"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    {language === 'English' ? 'Save' : 'حفظ'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setEditingStatusId(null)}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    {language === 'English' ? 'Cancel' : 'إلغاء'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded-full mr-2" 
                                    style={{ backgroundColor: status.color || '#3B82F6' }}
                                  />
                                  <div>
                                    <div className="font-medium">{status.name}</div>
                                    {status.description && <div className="text-xs text-muted-foreground">{status.description}</div>}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditAssetStatus(status)}
                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => deleteAssetStatusMutation.mutate(status.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    disabled={deleteAssetStatusMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        {language === 'English' ? 'No custom statuses added yet' : 'لم تتم إضافة حالات مخصصة بعد'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Service Providers Tab */}
        <TabsContent value="service-providers" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">{language === 'English' ? 'Service Providers' : 'مزودي الخدمة'}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage service providers for maintenance and support' 
                  : 'إدارة مزودي الخدمة للصيانة والدعم'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-col">
                <Input
                  placeholder={language === 'English' ? 'Provider name' : 'اسم المزود'}
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                />
                <Input
                  placeholder={language === 'English' ? 'Contact person' : 'الشخص المسؤول'}
                  value={newProviderContact}
                  onChange={(e) => setNewProviderContact(e.target.value)}
                />
                <div className="flex gap-2 flex-col sm:flex-row">
                  <Input
                    placeholder={language === 'English' ? 'Phone' : 'الهاتف'}
                    value={newProviderPhone}
                    onChange={(e) => setNewProviderPhone(e.target.value)}
                    className="flex-grow"
                  />
                  <Input
                    placeholder={language === 'English' ? 'Email' : 'البريد الإلكتروني'}
                    value={newProviderEmail}
                    onChange={(e) => setNewProviderEmail(e.target.value)}
                    type="email"
                    className="flex-grow"
                  />
                </div>
                <Button 
                  onClick={handleAddServiceProvider} 
                  disabled={!newProviderName.trim() || createServiceProviderMutation.isPending}
                  className="self-end sm:w-auto w-full"
                >
                  {language === 'English' ? 'Add Provider' : 'إضافة مزود'}
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                {serviceProviders && serviceProviders.length > 0 ? (
                  <ul className="divide-y max-h-80 overflow-y-auto">
                    {serviceProviders.map((provider: any) => (
                      <li key={provider.id} className="flex justify-between items-center p-3">
                        {editingProviderId === provider.id ? (
                          <div className="flex flex-col gap-2 w-full">
                            <Input
                              value={editedProviderName}
                              onChange={(e) => setEditedProviderName(e.target.value)}
                              placeholder="Provider name"
                              className="h-8"
                              autoFocus
                            />
                            <Input
                              value={editedProviderContact}
                              onChange={(e) => setEditedProviderContact(e.target.value)}
                              placeholder="Contact person (optional)"
                              className="h-8"
                            />
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <Input
                                value={editedProviderPhone}
                                onChange={(e) => setEditedProviderPhone(e.target.value)}
                                placeholder="Phone (optional)"
                                className="h-8 flex-grow"
                              />
                              <Input
                                value={editedProviderEmail}
                                onChange={(e) => setEditedProviderEmail(e.target.value)}
                                placeholder="Email (optional)"
                                type="email"
                                className="h-8 flex-grow"
                              />
                            </div>
                            <div className="flex justify-end gap-2 mt-1">
                              <Button 
                                size="sm" 
                                onClick={handleSaveEditedServiceProvider}
                                disabled={!editedProviderName.trim() || updateServiceProviderMutation.isPending}
                                className="h-8 px-2"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                {language === 'English' ? 'Save' : 'حفظ'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setEditingProviderId(null)}
                                className="h-8 px-2"
                              >
                                <X className="h-4 w-4 mr-1" />
                                {language === 'English' ? 'Cancel' : 'إلغاء'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              {provider.contactPerson && (
                                <div className="text-sm">{provider.contactPerson}</div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {provider.phone && <span className="mr-2">{provider.phone}</span>}
                                {provider.email && <span>{provider.email}</span>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditServiceProvider(provider)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteServiceProviderMutation.mutate(provider.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                disabled={deleteServiceProviderMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    {language === 'English' ? 'No service providers added yet' : 'لم تتم إضافة مزودي خدمة بعد'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-600">
                {language === 'English' ? 'Danger Zone' : 'منطقة الخطر'}
              </CardTitle>
              <CardDescription className="text-red-600/70">
                {language === 'English' 
                  ? 'Actions that cannot be undone' 
                  : 'إجراءات لا يمكن التراجع عنها'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-md border border-red-300">
                <div>
                  <div className="font-medium">
                    {language === 'English' ? 'Remove Demo Data' : 'إزالة بيانات العرض التوضيحي'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === 'English' 
                      ? 'This will remove all demo data from the system.' 
                      : 'سيؤدي هذا إلى إزالة جميع بيانات العرض التوضيحي من النظام.'}
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleRemoveDemoData}
                  disabled={removeDemoDataMutation.isPending}
                  className="sm:w-auto w-full"
                >
                  {removeDemoDataMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Removing...' : 'جارٍ الإزالة...'}
                    </>
                  ) : (
                    language === 'English' ? 'Remove All Demo Data' : 'إزالة كل بيانات العرض'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Settings, Save, Globe, Loader2, Trash, Plus, Edit, Check, X, Mail, Download, Upload, Search } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default function SystemConfigEnhanced() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  // Basic configuration states
  const [assetIdPrefix, setAssetIdPrefix] = useState('SIT-');
  const [empIdPrefix, setEmpIdPrefix] = useState('EMP-');
  const [ticketIdPrefix, setTicketIdPrefix] = useState('TKT-');
  const [currency, setCurrency] = useState('USD');
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Email configuration states
  const [emailHost, setEmailHost] = useState('');
  const [emailPort, setEmailPort] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailSecure, setEmailSecure] = useState(true);
  
  // Export/Import states
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<'employees' | 'assets' | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  
  // Asset Management pagination and search
  const [assetTypeSearch, setAssetTypeSearch] = useState('');
  const [assetBrandSearch, setAssetBrandSearch] = useState('');
  const [assetStatusSearch, setAssetStatusSearch] = useState('');
  const [serviceProviderSearch, setServiceProviderSearch] = useState('');
  const [requestTypeSearch, setRequestTypeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState({
    types: 1,
    brands: 1,
    statuses: 1,
    providers: 1,
    requestTypes: 1
  });
  const itemsPerPage = 10;

  // Form states for new items
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
  const [newRequestTypeName, setNewRequestTypeName] = useState('');
  const [newRequestTypeDescription, setNewRequestTypeDescription] = useState('');

  // Edit states
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [editingRequestTypeId, setEditingRequestTypeId] = useState<number | null>(null);
  
  // Edit form states
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandDescription, setEditBrandDescription] = useState('');
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusDescription, setEditStatusDescription] = useState('');
  const [editStatusColor, setEditStatusColor] = useState('#3B82F6');
  const [editProviderName, setEditProviderName] = useState('');
  const [editProviderContact, setEditProviderContact] = useState('');
  const [editProviderPhone, setEditProviderPhone] = useState('');
  const [editProviderEmail, setEditProviderEmail] = useState('');
  const [editRequestTypeName, setEditRequestTypeName] = useState('');
  const [editRequestTypeDescription, setEditRequestTypeDescription] = useState('');

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
      
      // Load email configuration
      setEmailHost(config.emailHost || '');
      setEmailPort(config.emailPort || '');
      setEmailUser(config.emailUser || '');
      setEmailPassword(config.emailPassword || '');
      setEmailFromAddress(config.emailFromAddress || '');
      setEmailFromName(config.emailFromName || '');
      setEmailSecure(config.emailSecure !== false);
      setIsLoading(false);
    }
  }, [config]);

  // Export functions
  const handleExport = (type: 'employees' | 'assets' | 'tickets') => {
    window.open(`/api/export/${type}`, '_blank');
  };

  // CSV parsing function
  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    return { headers, data };
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'employees' | 'assets') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const { headers, data } = parseCSV(csvText);
      setCsvHeaders(headers);
      setCsvData(data);
      setImportType(type);
      setImporting(true);
    };
    reader.readAsText(file);
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (data: { type: string; data: any[]; mapping: Record<string, string> }) =>
      apiRequest('POST', `/api/import/${data.type}`, { data: data.data, mapping: data.mapping }),
    onSuccess: (result) => {
      queryClient.invalidateQueries();
      setImporting(false);
      setImportType(null);
      setCsvData([]);
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' 
          ? `Successfully imported ${result.imported} records` 
          : `تم استيراد ${result.imported} سجل بنجاح`,
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to import data' : 'فشل استيراد البيانات',
        variant: 'destructive'
      });
    }
  });

  // Handle import with field mapping
  const handleImport = () => {
    if (!importType || !csvData.length) return;
    
    importMutation.mutate({
      type: importType,
      data: csvData,
      mapping: fieldMapping
    });
  };

  // Asset Type Mutations
  const createAssetTypeMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('POST', '/api/custom-asset-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type added successfully' : 'تم إضافة نوع الأصل بنجاح',
      });
      setNewTypeName('');
      setNewTypeDescription('');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset type' : 'فشل إضافة نوع الأصل',
        variant: 'destructive'
      });
    }
  });

  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-asset-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type deleted successfully' : 'تم حذف نوع الأصل بنجاح',
      });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete asset type' : 'فشل حذف نوع الأصل',
        variant: 'destructive'
      });
    }
  });

  const updateAssetTypeMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description?: string }) => 
      apiRequest('PUT', `/api/custom-asset-types/${data.id}`, { name: data.name, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
      setEditingTypeId(null);
      setEditTypeName('');
      setEditTypeDescription('');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update asset type' : 'فشل تحديث نوع الأصل',
        variant: 'destructive'
      });
    }
  });

  // Asset Brand Mutations
  const createAssetBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('POST', '/api/custom-asset-brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand added successfully' : 'تم إضافة علامة الأصل التجارية بنجاح',
      });
      setNewBrandName('');
      setNewBrandDescription('');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset brand' : 'فشل إضافة علامة الأصل التجارية',
        variant: 'destructive'
      });
    }
  });

  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-asset-brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand deleted successfully' : 'تم حذف علامة الأصل التجارية بنجاح',
      });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete asset brand' : 'فشل حذف علامة الأصل التجارية',
        variant: 'destructive'
      });
    }
  });

  const updateAssetBrandMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description?: string }) => 
      apiRequest('PUT', `/api/custom-asset-brands/${data.id}`, { name: data.name, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث علامة الأصل التجارية بنجاح',
      });
      setEditingBrandId(null);
      setEditBrandName('');
      setEditBrandDescription('');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update asset brand' : 'فشل تحديث علامة الأصل التجارية',
        variant: 'destructive'
      });
    }
  });

  // Asset Status Mutations
  const createAssetStatusMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => 
      apiRequest('POST', '/api/custom-asset-statuses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status added successfully' : 'تم إضافة حالة الأصل بنجاح',
      });
      setNewStatusName('');
      setNewStatusDescription('');
      setNewStatusColor('#3B82F6');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset status' : 'فشل إضافة حالة الأصل',
        variant: 'destructive'
      });
    }
  });

  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-asset-statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status deleted successfully' : 'تم حذف حالة الأصل بنجاح',
      });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete asset status' : 'فشل حذف حالة الأصل',
        variant: 'destructive'
      });
    }
  });

  const updateAssetStatusMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description?: string; color?: string }) => 
      apiRequest('PUT', `/api/custom-asset-statuses/${data.id}`, { name: data.name, description: data.description, color: data.color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصل بنجاح',
      });
      setEditingStatusId(null);
      setEditStatusName('');
      setEditStatusDescription('');
      setEditStatusColor('#3B82F6');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update asset status' : 'فشل تحديث حالة الأصل',
        variant: 'destructive'
      });
    }
  });

  // Service Provider Mutations
  const createServiceProviderMutation = useMutation({
    mutationFn: (data: { name: string; contactPerson?: string; phone?: string; email?: string }) => 
      apiRequest('POST', '/api/service-providers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider added successfully' : 'تم إضافة مقدم الخدمة بنجاح',
      });
      setNewProviderName('');
      setNewProviderContact('');
      setNewProviderPhone('');
      setNewProviderEmail('');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add service provider' : 'فشل إضافة مقدم الخدمة',
        variant: 'destructive'
      });
    }
  });

  const deleteServiceProviderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/service-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider deleted successfully' : 'تم حذف مقدم الخدمة بنجاح',
      });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete service provider' : 'فشل حذف مقدم الخدمة',
        variant: 'destructive'
      });
    }
  });

  const updateServiceProviderMutation = useMutation({
    mutationFn: (data: { id: number; name: string; contactPerson?: string; phone?: string; email?: string }) => 
      apiRequest('PUT', `/api/service-providers/${data.id}`, { name: data.name, contactPerson: data.contactPerson, phone: data.phone, email: data.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider updated successfully' : 'تم تحديث مقدم الخدمة بنجاح',
      });
      setEditingProviderId(null);
      setEditProviderName('');
      setEditProviderContact('');
      setEditProviderPhone('');
      setEditProviderEmail('');
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update service provider' : 'فشل تحديث مقدم الخدمة',
        variant: 'destructive'
      });
    }
  });

  // Handler functions
  const handleAddAssetType = () => {
    if (!newTypeName.trim()) return;
    createAssetTypeMutation.mutate({
      name: newTypeName.trim(),
      description: newTypeDescription.trim() || undefined
    });
  };

  const handleDeleteAssetType = (id: number) => {
    deleteAssetTypeMutation.mutate(id);
  };

  const handleUpdateAssetType = () => {
    if (!editTypeName.trim() || !editingTypeId) return;
    updateAssetTypeMutation.mutate({
      id: editingTypeId,
      name: editTypeName.trim(),
      description: editTypeDescription.trim() || undefined
    });
  };

  const handleAddAssetBrand = () => {
    if (!newBrandName.trim()) return;
    createAssetBrandMutation.mutate({
      name: newBrandName.trim(),
      description: newBrandDescription.trim() || undefined
    });
  };

  const handleDeleteAssetBrand = (id: number) => {
    deleteAssetBrandMutation.mutate(id);
  };

  const handleUpdateAssetBrand = () => {
    if (!editBrandName.trim() || !editingBrandId) return;
    updateAssetBrandMutation.mutate({
      id: editingBrandId,
      name: editBrandName.trim(),
      description: editBrandDescription.trim() || undefined
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

  const handleDeleteAssetStatus = (id: number) => {
    deleteAssetStatusMutation.mutate(id);
  };

  const handleUpdateAssetStatus = () => {
    if (!editStatusName.trim() || !editingStatusId) return;
    updateAssetStatusMutation.mutate({
      id: editingStatusId,
      name: editStatusName.trim(),
      description: editStatusDescription.trim() || undefined,
      color: editStatusColor
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

  const handleDeleteServiceProvider = (id: number) => {
    deleteServiceProviderMutation.mutate(id);
  };

  const handleUpdateServiceProvider = () => {
    if (!editProviderName.trim() || !editingProviderId) return;
    updateServiceProviderMutation.mutate({
      id: editingProviderId,
      name: editProviderName.trim(),
      contactPerson: editProviderContact.trim() || undefined,
      phone: editProviderPhone.trim() || undefined,
      email: editProviderEmail.trim() || undefined
    });
  };

  // Pagination helpers
  const getPaginatedItems = (items: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (itemsLength: number) => {
    return Math.ceil(itemsLength / itemsPerPage);
  };

  // Filtered items
  const filteredAssetTypes = customAssetTypes.filter(type => 
    type.name.toLowerCase().includes(assetTypeSearch.toLowerCase())
  );
  const filteredAssetBrands = customAssetBrands.filter(brand => 
    brand.name.toLowerCase().includes(assetBrandSearch.toLowerCase())
  );
  const filteredAssetStatuses = customAssetStatuses.filter(status => 
    status.name.toLowerCase().includes(assetStatusSearch.toLowerCase())
  );
  const filteredServiceProviders = serviceProviders.filter(provider => 
    provider.name.toLowerCase().includes(serviceProviderSearch.toLowerCase())
  );

  const translations = {
    systemConfiguration: language === 'English' ? 'System Configuration' : 'تكوين النظام',
    generalSettings: language === 'English' ? 'General Settings' : 'الإعدادات العامة',
    assetManagement: language === 'English' ? 'Asset Management' : 'إدارة الأصول',
    exportImport: language === 'English' ? 'Export/Import' : 'تصدير/استيراد',
    emailSettings: language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني',
    language: language === 'English' ? 'Language' : 'اللغة',
    currency: language === 'English' ? 'Currency' : 'العملة',
    save: language === 'English' ? 'Save' : 'حفظ',
    english: language === 'English' ? 'English' : 'الإنجليزية',
    arabic: language === 'English' ? 'Arabic' : 'العربية',
    noData: language === 'English' ? 'No data available' : 'لا توجد بيانات متاحة'
  };

  if (!hasAccess(3)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'English' ? 'Access Denied' : 'تم رفض الوصول'}
              </h3>
              <p className="text-gray-500">
                {language === 'English' 
                  ? 'You do not have permission to access system configuration.' 
                  : 'ليس لديك صلاحية للوصول إلى تكوين النظام.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{translations.systemConfiguration}</h1>
          <p className="text-gray-600 mt-2">
            {language === 'English' 
              ? 'Configure system settings, manage data, and customize your organization preferences.' 
              : 'تكوين إعدادات النظام وإدارة البيانات وتخصيص تفضيلات المؤسسة.'}
          </p>
        </div>
        <Settings className="h-8 w-8 text-gray-400" />
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{translations.generalSettings}</TabsTrigger>
          <TabsTrigger value="export-import">{translations.exportImport}</TabsTrigger>
          <TabsTrigger value="assets">{translations.assetManagement}</TabsTrigger>
          <TabsTrigger value="email">{translations.emailSettings}</TabsTrigger>
        </TabsList>

        {/* Export/Import Tab */}
        <TabsContent value="export-import">
          <div className="space-y-6">
            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  {language === 'English' ? 'Export Data' : 'تصدير البيانات'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Export your data to CSV files for backup or analysis' 
                    : 'تصدير البيانات إلى ملفات CSV للنسخ الاحتياطي أو التحليل'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => handleExport('employees')}
                    variant="outline" 
                    className="flex items-center justify-center p-6"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {language === 'English' ? 'Export Employees' : 'تصدير الموظفين'}
                  </Button>
                  <Button 
                    onClick={() => handleExport('assets')}
                    variant="outline" 
                    className="flex items-center justify-center p-6"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {language === 'English' ? 'Export Assets' : 'تصدير الأصول'}
                  </Button>
                  <Button 
                    onClick={() => handleExport('tickets')}
                    variant="outline" 
                    className="flex items-center justify-center p-6"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {language === 'English' ? 'Export Tickets' : 'تصدير التذاكر'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  {language === 'English' ? 'Import Data' : 'استيراد البيانات'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Import data from CSV files with field mapping' 
                    : 'استيراد البيانات من ملفات CSV مع تعيين الحقول'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee-upload">
                      {language === 'English' ? 'Import Employees' : 'استيراد الموظفين'}
                    </Label>
                    <Input
                      id="employee-upload"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, 'employees')}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="asset-upload">
                      {language === 'English' ? 'Import Assets' : 'استيراد الأصول'}
                    </Label>
                    <Input
                      id="asset-upload"
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, 'assets')}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Management Tab with Tabbed Layout */}
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                {translations.assetManagement}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure custom asset types, brands, statuses, and service providers for your organization.' 
                  : 'تكوين أنواع الأصول المخصصة والعلامات التجارية والحالات ومقدمي الخدمات لمؤسستك.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="types" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="types">
                    {language === 'English' ? 'Types' : 'الأنواع'}
                  </TabsTrigger>
                  <TabsTrigger value="brands">
                    {language === 'English' ? 'Brands' : 'العلامات التجارية'}
                  </TabsTrigger>
                  <TabsTrigger value="statuses">
                    {language === 'English' ? 'Statuses' : 'الحالات'}
                  </TabsTrigger>
                  <TabsTrigger value="providers">
                    {language === 'English' ? 'Service Providers' : 'مقدمو الخدمات'}
                  </TabsTrigger>
                </TabsList>

                {/* Asset Types Tab */}
                <TabsContent value="types">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'English' ? 'Search asset types...' : 'البحث في أنواع الأصول...'}
                          value={assetTypeSearch}
                          onChange={(e) => setAssetTypeSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add Type' : 'إضافة نوع'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'English' ? 'Add Asset Type' : 'إضافة نوع أصل'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="type-name">
                                {language === 'English' ? 'Name' : 'الاسم'}
                              </Label>
                              <Input
                                id="type-name"
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                placeholder={language === 'English' ? 'Enter type name' : 'أدخل اسم النوع'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="type-description">
                                {language === 'English' ? 'Description' : 'الوصف'}
                              </Label>
                              <Input
                                id="type-description"
                                value={newTypeDescription}
                                onChange={(e) => setNewTypeDescription(e.target.value)}
                                placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline">
                                  {language === 'English' ? 'Cancel' : 'إلغاء'}
                                </Button>
                              </DialogClose>
                              <Button onClick={handleAddAssetType} disabled={!newTypeName.trim()}>
                                {language === 'English' ? 'Add' : 'إضافة'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h4 className="font-medium">
                          {language === 'English' ? 'Asset Types' : 'أنواع الأصول'}
                        </h4>
                      </div>
                      {filteredAssetTypes.length > 0 ? (
                        <div className="divide-y">
                          {getPaginatedItems(filteredAssetTypes, currentPage.types).map((type) => (
                            <div key={type.id} className="p-4 flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{type.name}</h5>
                                {type.description && (
                                  <p className="text-sm text-muted-foreground">{type.description}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => {
                                    setEditingTypeId(type.id);
                                    setEditTypeName(type.name);
                                    setEditTypeDescription(type.description || '');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteAssetType(type.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          {translations.noData}
                        </div>
                      )}
                    </div>

                    {/* Pagination for Types */}
                    {getTotalPages(filteredAssetTypes.length) > 1 && (
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage.types === 1}
                          onClick={() => setCurrentPage(prev => ({ ...prev, types: prev.types - 1 }))}
                        >
                          {language === 'English' ? 'Previous' : 'السابق'}
                        </Button>
                        <span className="px-4 py-2 text-sm">
                          {currentPage.types} / {getTotalPages(filteredAssetTypes.length)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage.types === getTotalPages(filteredAssetTypes.length)}
                          onClick={() => setCurrentPage(prev => ({ ...prev, types: prev.types + 1 }))}
                        >
                          {language === 'English' ? 'Next' : 'التالي'}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Similar structure for Brands, Statuses, and Providers tabs */}
                <TabsContent value="brands">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'English' ? 'Search brands...' : 'البحث في العلامات التجارية...'}
                          value={assetBrandSearch}
                          onChange={(e) => setAssetBrandSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add Brand' : 'إضافة علامة تجارية'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'English' ? 'Add Asset Brand' : 'إضافة علامة تجارية للأصل'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="brand-name">
                                {language === 'English' ? 'Name' : 'الاسم'}
                              </Label>
                              <Input
                                id="brand-name"
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                placeholder={language === 'English' ? 'Enter brand name' : 'أدخل اسم العلامة التجارية'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="brand-description">
                                {language === 'English' ? 'Description' : 'الوصف'}
                              </Label>
                              <Input
                                id="brand-description"
                                value={newBrandDescription}
                                onChange={(e) => setNewBrandDescription(e.target.value)}
                                placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline">
                                  {language === 'English' ? 'Cancel' : 'إلغاء'}
                                </Button>
                              </DialogClose>
                              <Button onClick={handleAddAssetBrand} disabled={!newBrandName.trim()}>
                                {language === 'English' ? 'Add' : 'إضافة'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h4 className="font-medium">
                          {language === 'English' ? 'Asset Brands' : 'العلامات التجارية للأصول'}
                        </h4>
                      </div>
                      {filteredAssetBrands.length > 0 ? (
                        <div className="divide-y">
                          {getPaginatedItems(filteredAssetBrands, currentPage.brands).map((brand) => (
                            <div key={brand.id} className="p-4 flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{brand.name}</h5>
                                {brand.description && (
                                  <p className="text-sm text-muted-foreground">{brand.description}</p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => {
                                    setEditingBrandId(brand.id);
                                    setEditBrandName(brand.name);
                                    setEditBrandDescription(brand.description || '');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteAssetBrand(brand.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          {translations.noData}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="statuses">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'English' ? 'Search statuses...' : 'البحث في الحالات...'}
                          value={assetStatusSearch}
                          onChange={(e) => setAssetStatusSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add Status' : 'إضافة حالة'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'English' ? 'Add Asset Status' : 'إضافة حالة أصل'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="status-name">
                                {language === 'English' ? 'Name' : 'الاسم'}
                              </Label>
                              <Input
                                id="status-name"
                                value={newStatusName}
                                onChange={(e) => setNewStatusName(e.target.value)}
                                placeholder={language === 'English' ? 'Enter status name' : 'أدخل اسم الحالة'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="status-description">
                                {language === 'English' ? 'Description' : 'الوصف'}
                              </Label>
                              <Input
                                id="status-description"
                                value={newStatusDescription}
                                onChange={(e) => setNewStatusDescription(e.target.value)}
                                placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="status-color">
                                {language === 'English' ? 'Color' : 'اللون'}
                              </Label>
                              <Input
                                id="status-color"
                                type="color"
                                value={newStatusColor}
                                onChange={(e) => setNewStatusColor(e.target.value)}
                                placeholder={language === 'English' ? 'Choose color' : 'اختر اللون'}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline">
                                  {language === 'English' ? 'Cancel' : 'إلغاء'}
                                </Button>
                              </DialogClose>
                              <Button onClick={handleAddAssetStatus} disabled={!newStatusName.trim()}>
                                {language === 'English' ? 'Add' : 'إضافة'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h4 className="font-medium">
                          {language === 'English' ? 'Asset Statuses' : 'حالات الأصول'}
                        </h4>
                      </div>
                      {filteredAssetStatuses.length > 0 ? (
                        <div className="divide-y">
                          {getPaginatedItems(filteredAssetStatuses, currentPage.statuses).map((status) => (
                            <div key={status.id} className="p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: status.color || '#3B82F6' }}
                                />
                                <div>
                                  <h5 className="font-medium">{status.name}</h5>
                                  {status.description && (
                                    <p className="text-sm text-muted-foreground">{status.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => {
                                    setEditingStatusId(status.id);
                                    setEditStatusName(status.name);
                                    setEditStatusDescription(status.description || '');
                                    setEditStatusColor(status.color || '#3B82F6');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteAssetStatus(status.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          {translations.noData}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="providers">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={language === 'English' ? 'Search service providers...' : 'البحث في مقدمي الخدمات...'}
                          value={serviceProviderSearch}
                          onChange={(e) => setServiceProviderSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {language === 'English' ? 'Add Provider' : 'إضافة مقدم خدمة'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'English' ? 'Add Service Provider' : 'إضافة مقدم خدمة'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="provider-name">
                                {language === 'English' ? 'Name' : 'الاسم'}
                              </Label>
                              <Input
                                id="provider-name"
                                value={newProviderName}
                                onChange={(e) => setNewProviderName(e.target.value)}
                                placeholder={language === 'English' ? 'Enter provider name' : 'أدخل اسم مقدم الخدمة'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="provider-contact">
                                {language === 'English' ? 'Contact Person' : 'الشخص المسؤول'}
                              </Label>
                              <Input
                                id="provider-contact"
                                value={newProviderContact}
                                onChange={(e) => setNewProviderContact(e.target.value)}
                                placeholder={language === 'English' ? 'Enter contact person (optional)' : 'أدخل الشخص المسؤول (اختياري)'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="provider-phone">
                                {language === 'English' ? 'Phone' : 'الهاتف'}
                              </Label>
                              <Input
                                id="provider-phone"
                                value={newProviderPhone}
                                onChange={(e) => setNewProviderPhone(e.target.value)}
                                placeholder={language === 'English' ? 'Enter phone number (optional)' : 'أدخل رقم الهاتف (اختياري)'}
                              />
                            </div>
                            <div>
                              <Label htmlFor="provider-email">
                                {language === 'English' ? 'Email' : 'البريد الإلكتروني'}
                              </Label>
                              <Input
                                id="provider-email"
                                type="email"
                                value={newProviderEmail}
                                onChange={(e) => setNewProviderEmail(e.target.value)}
                                placeholder={language === 'English' ? 'Enter email address (optional)' : 'أدخل البريد الإلكتروني (اختياري)'}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline">
                                  {language === 'English' ? 'Cancel' : 'إلغاء'}
                                </Button>
                              </DialogClose>
                              <Button onClick={handleAddServiceProvider} disabled={!newProviderName.trim()}>
                                {language === 'English' ? 'Add' : 'إضافة'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="border rounded-lg">
                      <div className="p-4 border-b bg-muted/50">
                        <h4 className="font-medium">
                          {language === 'English' ? 'Service Providers' : 'مقدمو الخدمات'}
                        </h4>
                      </div>
                      {filteredServiceProviders.length > 0 ? (
                        <div className="divide-y">
                          {getPaginatedItems(filteredServiceProviders, currentPage.providers).map((provider) => (
                            <div key={provider.id} className="p-4 flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{provider.name}</h5>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {provider.contactPerson && <p>Contact: {provider.contactPerson}</p>}
                                  {provider.phone && <p>Phone: {provider.phone}</p>}
                                  {provider.email && <p>Email: {provider.email}</p>}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => {
                                    setEditingProviderId(provider.id);
                                    setEditProviderName(provider.name);
                                    setEditProviderContact(provider.contactPerson || '');
                                    setEditProviderPhone(provider.phone || '');
                                    setEditProviderEmail(provider.email || '');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteServiceProvider(provider.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          {translations.noData}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>{translations.generalSettings}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure language and currency preferences for your organization.' 
                  : 'تكوين تفضيلات اللغة والعملة لمؤسستك.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label>{translations.language}</Label>
                  <Select value={language} onValueChange={toggleLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.language} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">{translations.english}</SelectItem>
                      <SelectItem value="Arabic">{translations.arabic}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>{translations.currency}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={translations.currency} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                {translations.emailSettings}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure SMTP settings for system email notifications' 
                  : 'تكوين إعدادات SMTP لإشعارات النظام عبر البريد الإلكتروني'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailHost">
                      {language === 'English' ? 'SMTP Host' : 'خادم SMTP'}
                    </Label>
                    <Input
                      id="emailHost"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailPort">
                      {language === 'English' ? 'SMTP Port' : 'منفذ SMTP'}
                    </Label>
                    <Input
                      id="emailPort"
                      type="number"
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailUser">
                      {language === 'English' ? 'SMTP Username' : 'اسم مستخدم SMTP'}
                    </Label>
                    <Input
                      id="emailUser"
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="your-email@domain.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailPassword">
                      {language === 'English' ? 'SMTP Password' : 'كلمة مرور SMTP'}
                    </Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={importing} onOpenChange={setImporting}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Import Data' : 'استيراد البيانات'}
            </DialogTitle>
            <DialogDescription>
              {language === 'English' 
                ? 'Map CSV columns to system fields' 
                : 'تعيين أعمدة CSV إلى حقول النظام'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {csvHeaders.map((header) => (
              <div key={header} className="grid grid-cols-2 gap-4 items-center">
                <Label>{header}</Label>
                <Select 
                  value={fieldMapping[header] || ''} 
                  onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [header]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {importType === 'employees' ? (
                      <>
                        <SelectItem value="empId">Employee ID</SelectItem>
                        <SelectItem value="englishName">English Name</SelectItem>
                        <SelectItem value="arabicName">Arabic Name</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="position">Position</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="assetId">Asset ID</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                        <SelectItem value="brand">Brand</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="serialNumber">Serial Number</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImporting(false)}>
              {language === 'English' ? 'Cancel' : 'إلغاء'}
            </Button>
            <Button onClick={handleImport} disabled={importMutation.isPending}>
              {importMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {language === 'English' ? 'Import' : 'استيراد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Type Dialog */}
      <Dialog open={editingTypeId !== null} onOpenChange={() => setEditingTypeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Edit Asset Type' : 'تعديل نوع الأصل'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type-name">
                {language === 'English' ? 'Name' : 'الاسم'}
              </Label>
              <Input
                id="edit-type-name"
                value={editTypeName}
                onChange={(e) => setEditTypeName(e.target.value)}
                placeholder={language === 'English' ? 'Enter type name' : 'أدخل اسم النوع'}
              />
            </div>
            <div>
              <Label htmlFor="edit-type-description">
                {language === 'English' ? 'Description' : 'الوصف'}
              </Label>
              <Input
                id="edit-type-description"
                value={editTypeDescription}
                onChange={(e) => setEditTypeDescription(e.target.value)}
                placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingTypeId(null)}>
                {language === 'English' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleUpdateAssetType} disabled={!editTypeName.trim()}>
                {language === 'English' ? 'Update' : 'تحديث'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Brand Dialog */}
      <Dialog open={editingBrandId !== null} onOpenChange={() => setEditingBrandId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Edit Asset Brand' : 'تعديل العلامة التجارية للأصل'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-brand-name">
                {language === 'English' ? 'Name' : 'الاسم'}
              </Label>
              <Input
                id="edit-brand-name"
                value={editBrandName}
                onChange={(e) => setEditBrandName(e.target.value)}
                placeholder={language === 'English' ? 'Enter brand name' : 'أدخل اسم العلامة التجارية'}
              />
            </div>
            <div>
              <Label htmlFor="edit-brand-description">
                {language === 'English' ? 'Description' : 'الوصف'}
              </Label>
              <Input
                id="edit-brand-description"
                value={editBrandDescription}
                onChange={(e) => setEditBrandDescription(e.target.value)}
                placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingBrandId(null)}>
                {language === 'English' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleUpdateAssetBrand} disabled={!editBrandName.trim()}>
                {language === 'English' ? 'Update' : 'تحديث'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Status Dialog */}
      <Dialog open={editingStatusId !== null} onOpenChange={() => setEditingStatusId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Edit Asset Status' : 'تعديل حالة الأصل'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-status-name">
                {language === 'English' ? 'Name' : 'الاسم'}
              </Label>
              <Input
                id="edit-status-name"
                value={editStatusName}
                onChange={(e) => setEditStatusName(e.target.value)}
                placeholder={language === 'English' ? 'Enter status name' : 'أدخل اسم الحالة'}
              />
            </div>
            <div>
              <Label htmlFor="edit-status-description">
                {language === 'English' ? 'Description' : 'الوصف'}
              </Label>
              <Input
                id="edit-status-description"
                value={editStatusDescription}
                onChange={(e) => setEditStatusDescription(e.target.value)}
                placeholder={language === 'English' ? 'Enter description (optional)' : 'أدخل الوصف (اختياري)'}
              />
            </div>
            <div>
              <Label htmlFor="edit-status-color">
                {language === 'English' ? 'Color' : 'اللون'}
              </Label>
              <Input
                id="edit-status-color"
                type="color"
                value={editStatusColor}
                onChange={(e) => setEditStatusColor(e.target.value)}
                placeholder={language === 'English' ? 'Choose color' : 'اختر اللون'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingStatusId(null)}>
                {language === 'English' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleUpdateAssetStatus} disabled={!editStatusName.trim()}>
                {language === 'English' ? 'Update' : 'تحديث'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Provider Dialog */}
      <Dialog open={editingProviderId !== null} onOpenChange={() => setEditingProviderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'English' ? 'Edit Service Provider' : 'تعديل مقدم الخدمة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-provider-name">
                {language === 'English' ? 'Name' : 'الاسم'}
              </Label>
              <Input
                id="edit-provider-name"
                value={editProviderName}
                onChange={(e) => setEditProviderName(e.target.value)}
                placeholder={language === 'English' ? 'Enter provider name' : 'أدخل اسم مقدم الخدمة'}
              />
            </div>
            <div>
              <Label htmlFor="edit-provider-contact">
                {language === 'English' ? 'Contact Person' : 'شخص الاتصال'}
              </Label>
              <Input
                id="edit-provider-contact"
                value={editProviderContact}
                onChange={(e) => setEditProviderContact(e.target.value)}
                placeholder={language === 'English' ? 'Enter contact person (optional)' : 'أدخل شخص الاتصال (اختياري)'}
              />
            </div>
            <div>
              <Label htmlFor="edit-provider-phone">
                {language === 'English' ? 'Phone' : 'الهاتف'}
              </Label>
              <Input
                id="edit-provider-phone"
                value={editProviderPhone}
                onChange={(e) => setEditProviderPhone(e.target.value)}
                placeholder={language === 'English' ? 'Enter phone (optional)' : 'أدخل الهاتف (اختياري)'}
              />
            </div>
            <div>
              <Label htmlFor="edit-provider-email">
                {language === 'English' ? 'Email' : 'البريد الإلكتروني'}
              </Label>
              <Input
                id="edit-provider-email"
                type="email"
                value={editProviderEmail}
                onChange={(e) => setEditProviderEmail(e.target.value)}
                placeholder={language === 'English' ? 'Enter email (optional)' : 'أدخل البريد الإلكتروني (اختياري)'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingProviderId(null)}>
                {language === 'English' ? 'Cancel' : 'إلغاء'}
              </Button>
              <Button onClick={handleUpdateServiceProvider} disabled={!editProviderName.trim()}>
                {language === 'English' ? 'Update' : 'تحديث'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
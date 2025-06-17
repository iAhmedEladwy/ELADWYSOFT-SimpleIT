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
  
  // Email configuration states
  const [emailHost, setEmailHost] = useState('');
  const [emailPort, setEmailPort] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailSecure, setEmailSecure] = useState(true);
  
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
  const [currentPage, setCurrentPage] = useState({
    types: 1,
    brands: 1,
    statuses: 1,
    providers: 1
  });
  const itemsPerPage = 10;
  
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
      setEmailPort(config.emailPort?.toString() || '');
      setEmailUser(config.emailUser || '');
      setEmailPassword(config.emailPassword || '');
      setEmailFromAddress(config.emailFromAddress || '');
      setEmailFromName(config.emailFromName || '');
      setEmailSecure(config.emailSecure !== false);
      
      setIsLoading(false);
    }
  }, [config]);

  // Asset type state management
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editedTypeName, setEditedTypeName] = useState('');
  const [editedTypeDescription, setEditedTypeDescription] = useState('');

  // Create custom asset type mutation
  const createAssetTypeMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('POST', '/api/custom-asset-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type added successfully' : 'تمت إضافة نوع الأصل بنجاح',
      });
      setNewTypeName('');
      setNewTypeDescription('');
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset type' : 'فشل إضافة نوع الأصل',
        variant: 'destructive'
      });
      console.error('Failed to add asset type:', error);
    }
  });

  // Delete custom asset type mutation
  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/custom-asset-types/${id}`),
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
        description: language === 'English' ? 'Failed to delete asset type' : 'فشل حذف نوع الأصل',
        variant: 'destructive'
      });
      console.error('Failed to delete asset type:', error);
    }
  });

  // Update asset type mutation
  const updateAssetTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { name: string; description?: string } }) => 
      apiRequest('PUT', `/api/custom-asset-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
      setEditingTypeId(null);
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update asset type' : 'فشل تحديث نوع الأصل',
        variant: 'destructive'
      });
      console.error('Failed to update asset type:', error);
    }
  });

  // Brand state management
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editedBrandName, setEditedBrandName] = useState('');
  const [editedBrandDescription, setEditedBrandDescription] = useState('');

  // Create custom asset brand mutation
  const createAssetBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('POST', '/api/custom-asset-brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand added successfully' : 'تمت إضافة علامة الأصل التجارية بنجاح',
      });
      setNewBrandName('');
      setNewBrandDescription('');
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset brand' : 'فشل إضافة علامة الأصل التجارية',
        variant: 'destructive'
      });
      console.error('Failed to add asset brand:', error);
    }
  });

  // Delete custom asset brand mutation
  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/custom-asset-brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand deleted successfully' : 'تم حذف علامة الأصل التجارية بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete asset brand' : 'فشل حذف علامة الأصل التجارية',
        variant: 'destructive'
      });
      console.error('Failed to delete asset brand:', error);
    }
  });

  // Update asset brand mutation
  const updateAssetBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { name: string; description?: string } }) => 
      apiRequest('PUT', `/api/custom-asset-brands/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث علامة الأصل التجارية بنجاح',
      });
      setEditingBrandId(null);
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update asset brand' : 'فشل تحديث علامة الأصل التجارية',
        variant: 'destructive'
      });
      console.error('Failed to update asset brand:', error);
    }
  });

  // Status state management
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editedStatusName, setEditedStatusName] = useState('');
  const [editedStatusDescription, setEditedStatusDescription] = useState('');
  const [editedStatusColor, setEditedStatusColor] = useState('');

  // Create custom asset status mutation
  const createAssetStatusMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) => 
      apiRequest('POST', '/api/custom-asset-statuses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status added successfully' : 'تمت إضافة حالة الأصل بنجاح',
      });
      setNewStatusName('');
      setNewStatusDescription('');
      setNewStatusColor('#3B82F6');
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset status' : 'فشل إضافة حالة الأصل',
        variant: 'destructive'
      });
      console.error('Failed to add asset status:', error);
    }
  });

  // Delete custom asset status mutation
  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/custom-asset-statuses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status deleted successfully' : 'تم حذف حالة الأصل بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete asset status' : 'فشل حذف حالة الأصل',
        variant: 'destructive'
      });
      console.error('Failed to delete asset status:', error);
    }
  });

  // Update asset status mutation
  const updateAssetStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { name: string; description?: string; color?: string } }) => 
      apiRequest('PUT', `/api/custom-asset-statuses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصل بنجاح',
      });
      setEditingStatusId(null);
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update asset status' : 'فشل تحديث حالة الأصل',
        variant: 'destructive'
      });
      console.error('Failed to update asset status:', error);
    }
  });

  // Service provider state management
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [editedProviderName, setEditedProviderName] = useState('');
  const [editedProviderContact, setEditedProviderContact] = useState('');
  const [editedProviderPhone, setEditedProviderPhone] = useState('');
  const [editedProviderEmail, setEditedProviderEmail] = useState('');

  // Create service provider mutation
  const createServiceProviderMutation = useMutation({
    mutationFn: (data: { name: string; contactPerson?: string; phone?: string; email?: string }) => 
      apiRequest('POST', '/api/service-providers', data),
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
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add service provider' : 'فشل إضافة مزود الخدمة',
        variant: 'destructive'
      });
      console.error('Failed to add service provider:', error);
    }
  });

  // Delete service provider mutation
  const deleteServiceProviderMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/service-providers/${id}`),
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
        description: language === 'English' ? 'Failed to delete service provider' : 'فشل حذف مزود الخدمة',
        variant: 'destructive'
      });
      console.error('Failed to delete service provider:', error);
    }
  });

  // Update service provider mutation
  const updateServiceProviderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { name: string; contactPerson?: string; phone?: string; email?: string } }) => 
      apiRequest('PUT', `/api/service-providers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider updated successfully' : 'تم تحديث مزود الخدمة بنجاح',
      });
      setEditingProviderId(null);
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update service provider' : 'فشل تحديث مزود الخدمة',
        variant: 'destructive'
      });
      console.error('Failed to update service provider:', error);
    }
  });

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

  // Remove demo data mutation
  const removeDemoDataMutation = useMutation({
    mutationFn: () => 
      apiRequest('DELETE', '/api/demo-data'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Demo data removed successfully' : 'تمت إزالة البيانات التجريبية بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to remove demo data' : 'فشل إزالة البيانات التجريبية',
        variant: 'destructive'
      });
      console.error('Failed to remove demo data:', error);
    }
  });

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
  
  // Department state management
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editedDeptName, setEditedDeptName] = useState('');
  
  // Handle adding new department
  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    
    const updatedDepartments = [...departments, newDepartment.trim()];
    setDepartments(updatedDepartments);
    setNewDepartment('');
    
    // Save immediately
    updateConfigMutation.mutate({
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments: updatedDepartments
    });
  };
  
  // Handle delete department
  const handleDeleteDepartment = (index: number) => {
    const updatedDepartments = [...departments];
    updatedDepartments.splice(index, 1);
    setDepartments(updatedDepartments);
    
    // Save immediately
    updateConfigMutation.mutate({
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments: updatedDepartments
    });
  };
  
  // Handle edit department
  const handleEditDepartment = (index: number) => {
    setEditingDeptIndex(index);
    setEditedDeptName(departments[index]);
  };
  
  // Handle save edited department
  const handleSaveDepartment = (index: number) => {
    if (!editedDeptName.trim()) return;
    
    const updatedDepartments = [...departments];
    updatedDepartments[index] = editedDeptName.trim();
    setDepartments(updatedDepartments);
    setEditingDeptIndex(null);
    
    // Save immediately
    updateConfigMutation.mutate({
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments: updatedDepartments
    });
  };
  
  // Handle cancel editing department
  const handleCancelEditDepartment = () => {
    setEditingDeptIndex(null);
  };
  
  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments,
      // Email configuration
      emailHost,
      emailPort: emailPort ? parseInt(emailPort) : undefined,
      emailUser,
      emailPassword,
      emailFromAddress,
      emailFromName,
      emailSecure
    });
  };

  // Handle adding new custom asset type
  const handleAddAssetType = () => {
    if (!newTypeName.trim()) return;
    
    createAssetTypeMutation.mutate({
      name: newTypeName.trim(),
      description: newTypeDescription.trim() || undefined
    });
  };

  // Handle editing custom asset type
  const handleEditAssetType = (type: any) => {
    setEditingTypeId(type.id);
    setEditedTypeName(type.name);
    setEditedTypeDescription(type.description || '');
  };

  // Handle saving edited custom asset type
  const handleSaveAssetType = () => {
    if (!editedTypeName.trim() || editingTypeId === null) return;
    
    updateAssetTypeMutation.mutate({
      id: editingTypeId,
      data: {
        name: editedTypeName.trim(),
        description: editedTypeDescription.trim() || undefined
      }
    });
  };

  // Handle canceling edit of custom asset type
  const handleCancelEditAssetType = () => {
    setEditingTypeId(null);
  };

  // Handle deleting custom asset type
  const handleDeleteAssetType = (id: number) => {
    deleteAssetTypeMutation.mutate(id);
  };

  // Handle adding new custom asset brand
  const handleAddAssetBrand = () => {
    if (!newBrandName.trim()) return;
    
    createAssetBrandMutation.mutate({
      name: newBrandName.trim(),
      description: newBrandDescription.trim() || undefined
    });
  };

  // Handle editing custom asset brand
  const handleEditAssetBrand = (brand: any) => {
    setEditingBrandId(brand.id);
    setEditedBrandName(brand.name);
    setEditedBrandDescription(brand.description || '');
  };

  // Handle saving edited custom asset brand
  const handleSaveAssetBrand = () => {
    if (!editedBrandName.trim() || editingBrandId === null) return;
    
    updateAssetBrandMutation.mutate({
      id: editingBrandId,
      data: {
        name: editedBrandName.trim(),
        description: editedBrandDescription.trim() || undefined
      }
    });
  };

  // Handle canceling edit of custom asset brand
  const handleCancelEditAssetBrand = () => {
    setEditingBrandId(null);
  };

  // Handle deleting custom asset brand
  const handleDeleteAssetBrand = (id: number) => {
    deleteAssetBrandMutation.mutate(id);
  };

  // Handle adding new custom asset status
  const handleAddAssetStatus = () => {
    if (!newStatusName.trim()) return;
    
    createAssetStatusMutation.mutate({
      name: newStatusName.trim(),
      description: newStatusDescription.trim() || undefined,
      color: newStatusColor
    });
  };

  // Handle editing custom asset status
  const handleEditAssetStatus = (status: any) => {
    setEditingStatusId(status.id);
    setEditedStatusName(status.name);
    setEditedStatusDescription(status.description || '');
    setEditedStatusColor(status.color || '#3B82F6');
  };

  // Handle saving edited custom asset status
  const handleSaveAssetStatus = () => {
    if (!editedStatusName.trim() || editingStatusId === null) return;
    
    updateAssetStatusMutation.mutate({
      id: editingStatusId,
      data: {
        name: editedStatusName.trim(),
        description: editedStatusDescription.trim() || undefined,
        color: editedStatusColor
      }
    });
  };

  // Handle canceling edit of custom asset status
  const handleCancelEditAssetStatus = () => {
    setEditingStatusId(null);
  };

  // Handle deleting custom asset status
  const handleDeleteAssetStatus = (id: number) => {
    deleteAssetStatusMutation.mutate(id);
  };

  // Handle adding new service provider
  const handleAddServiceProvider = () => {
    if (!newProviderName.trim()) return;
    
    createServiceProviderMutation.mutate({
      name: newProviderName.trim(),
      contactPerson: newProviderContact.trim() || undefined,
      phone: newProviderPhone.trim() || undefined,
      email: newProviderEmail.trim() || undefined
    });
  };

  // Handle editing service provider
  const handleEditServiceProvider = (provider: any) => {
    setEditingProviderId(provider.id);
    setEditedProviderName(provider.name);
    setEditedProviderContact(provider.contactPerson || '');
    setEditedProviderPhone(provider.phone || '');
    setEditedProviderEmail(provider.email || '');
  };

  // Handle saving edited service provider
  const handleSaveServiceProvider = () => {
    if (!editedProviderName.trim() || editingProviderId === null) return;
    
    updateServiceProviderMutation.mutate({
      id: editingProviderId,
      data: {
        name: editedProviderName.trim(),
        contactPerson: editedProviderContact.trim() || undefined,
        phone: editedProviderPhone.trim() || undefined,
        email: editedProviderEmail.trim() || undefined
      }
    });
  };

  // Handle canceling edit of service provider
  const handleCancelEditServiceProvider = () => {
    setEditingProviderId(null);
  };

  // Handle deleting service provider
  const handleDeleteServiceProvider = (id: number) => {
    deleteServiceProviderMutation.mutate(id);
  };

  const translations = {
    systemConfig: language === 'English' ? 'System Configuration' : 'إعدادات النظام',
    generalSettings: language === 'English' ? 'General Settings' : 'الإعدادات العامة',
    language: language === 'English' ? 'Language' : 'اللغة',
    english: language === 'English' ? 'English' : 'الإنجليزية',
    arabic: language === 'English' ? 'Arabic' : 'العربية',
    currency: language === 'English' ? 'Currency' : 'العملة',
    currencyDesc: language === 'English' ? 'Currency used for asset values and financial reporting.' : 'العملة المستخدمة لقيم الأصول والتقارير المالية.',
    departments: language === 'English' ? 'Departments' : 'الأقسام',
    addDepartment: language === 'English' ? 'Add Department' : 'إضافة قسم',
    idConfiguration: language === 'English' ? 'ID Configuration' : 'تكوين المعرف',
    assetIdPrefix: language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل',
    empIdPrefix: language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف',
    ticketIdPrefix: language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة',
    idPrefixDesc: language === 'English' ? 'Prefix for automatically generated IDs.' : 'بادئة للمعرفات التي يتم إنشاؤها تلقائيًا.',
    // Email configuration translations
    emailSettings: language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني',
    emailSettingsDesc: language === 'English' ? 'Configure email server settings for system notifications and password recovery.' : 'تكوين إعدادات خادم البريد الإلكتروني للإشعارات النظامية واستعادة كلمة المرور.',
    emailHost: language === 'English' ? 'Email Server/Host' : 'خادم البريد الإلكتروني',
    emailPort: language === 'English' ? 'Port' : 'المنفذ',
    emailUser: language === 'English' ? 'Username' : 'اسم المستخدم',
    emailPassword: language === 'English' ? 'Password' : 'كلمة المرور',
    emailFromAddress: language === 'English' ? 'From Email Address' : 'عنوان البريد الإلكتروني المرسل',
    emailFromName: language === 'English' ? 'From Name' : 'اسم المرسل',
    emailSecure: language === 'English' ? 'Use Secure Connection (SSL/TLS)' : 'استخدام اتصال آمن (SSL/TLS)',
    emailServerDesc: language === 'English' ? 'SMTP server settings for sending emails' : 'إعدادات خادم SMTP لإرسال رسائل البريد الإلكتروني',
    assetTypes: language === 'English' ? 'Asset Types' : 'أنواع الأصول',
    assetBrands: language === 'English' ? 'Asset Brands' : 'علامات الأصول التجارية',
    assetStatuses: language === 'English' ? 'Asset Statuses' : 'حالات الأصول',
    serviceProviders: language === 'English' ? 'Service Providers' : 'مزودي الخدمة',
    name: language === 'English' ? 'Name' : 'الاسم',
    description: language === 'English' ? 'Description' : 'الوصف',
    color: language === 'English' ? 'Color' : 'اللون',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    add: language === 'English' ? 'Add' : 'إضافة',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    delete: language === 'English' ? 'Delete' : 'حذف',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    remove: language === 'English' ? 'Remove Demo Data' : 'إزالة البيانات التجريبية',
    removeConfirm: language === 'English' ? 'Are you sure you want to remove all demo data? This will delete all assets, employees, tickets, and other data except for your admin user.' : 'هل أنت متأكد من أنك تريد إزالة جميع البيانات التجريبية؟ سيؤدي هذا إلى حذف جميع الأصول والموظفين والتذاكر والبيانات الأخرى باستثناء مستخدم المسؤول الخاص بك.',
    contactPerson: language === 'English' ? 'Contact Person' : 'جهة الاتصال',
    phone: language === 'English' ? 'Phone' : 'الهاتف',
    email: language === 'English' ? 'Email' : 'البريد الإلكتروني',
    assetManagement: language === 'English' ? 'Asset Management' : 'إدارة الأصول',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    noData: language === 'English' ? 'No items found' : 'لم يتم العثور على عناصر'
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">{translations.systemConfig}</h1>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-5 lg:max-w-4xl mb-4">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            {translations.generalSettings}
          </TabsTrigger>
          <TabsTrigger value="tickets">
            {language === 'English' ? 'Tickets' : 'التذاكر'}
          </TabsTrigger>
          <TabsTrigger value="asset">{translations.assetManagement}</TabsTrigger>
          <TabsTrigger value="employees">
            {language === 'English' ? 'Employees' : 'الموظفين'}
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            {translations.emailSettings}
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>{translations.emailSettings}</CardTitle>
              <CardDescription>
                {translations.emailSettingsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{language === 'English' ? 'SMTP Server Settings' : 'إعدادات خادم SMTP'}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailHost">{translations.emailHost}</Label>
                    <Input
                      id="emailHost"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.example.com"
                    />
                    <p className="text-sm text-gray-500">
                      {language === 'English' ? 'SMTP server hostname' : 'اسم مضيف خادم SMTP'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailPort">{translations.emailPort}</Label>
                    <Input
                      id="emailPort"
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      placeholder="587"
                      type="number"
                      className="max-w-[120px]"
                    />
                    <p className="text-sm text-gray-500">
                      {language === 'English' ? 'Typical ports: 25, 465, 587, 2525' : 'المنافذ النموذجية: 25، 465، 587، 2525'}
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailUser">{translations.emailUser}</Label>
                    <Input
                      id="emailUser"
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="username@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailPassword">{translations.emailPassword}</Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <p className="text-sm text-gray-500">
                      {language === 'English' ? 'Password will be stored securely' : 'سيتم تخزين كلمة المرور بشكل آمن'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <div className="form-control">
                    <label className="label cursor-pointer flex items-center">
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={emailSecure}
                        onChange={(e) => setEmailSecure(e.target.checked)}
                      />
                      <span className="label-text ml-2">{translations.emailSecure}</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 mt-8 border-t pt-6">
                <h3 className="text-lg font-medium">
                  {language === 'English' ? 'Sender Information' : 'معلومات المرسل'}
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailFromAddress">{translations.emailFromAddress}</Label>
                    <Input
                      id="emailFromAddress"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailFromName">{translations.emailFromName}</Label>
                    <Input
                      id="emailFromName"
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      placeholder="ELADWYSOFT SimpleIT"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  {language === 'English' 
                    ? 'These settings will be used for password recovery and system notifications.' 
                    : 'سيتم استخدام هذه الإعدادات لاستعادة كلمة المرور وإشعارات النظام.'}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveConfig} 
                disabled={updateConfigMutation.isPending}
                className="mr-2"
              >
                {updateConfigMutation.isPending ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'English' ? 'Saving...' : 'جاري الحفظ...'}
                  </div>
                ) : (
                  translations.save
                )}
              </Button>
            </CardFooter>
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
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'English' 
                        ? 'The primary language used throughout the system.' 
                        : 'اللغة الأساسية المستخدمة في جميع أنحاء النظام.'}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>{translations.currency}</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={translations.currency} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                        <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                        <SelectItem value="EGP">ج.م EGP - Egyptian Pound</SelectItem>
                        <SelectItem value="CNY">¥ CNY - Chinese Yuan</SelectItem>
                        <SelectItem value="JPY">¥ JPY - Japanese Yen</SelectItem>
                        <SelectItem value="SAR">ر.س SAR - Saudi Riyal</SelectItem>
                        <SelectItem value="AED">د.إ AED - UAE Dirham</SelectItem>
                        <SelectItem value="INR">₹ INR - Indian Rupee</SelectItem>
                        <SelectItem value="CAD">$ CAD - Canadian Dollar</SelectItem>
                        <SelectItem value="AUD">$ AUD - Australian Dollar</SelectItem>
                        <SelectItem value="KWD">د.ك KWD - Kuwaiti Dinar</SelectItem>
                        <SelectItem value="QAR">ر.ق QAR - Qatari Riyal</SelectItem>
                        <SelectItem value="JOD">د.ا JOD - Jordanian Dinar</SelectItem>
                        <SelectItem value="BHD">د.ب BHD - Bahraini Dinar</SelectItem>
                        <SelectItem value="OMR">ر.ع OMR - Omani Rial</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">{translations.currencyDesc}</p>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Configuration Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'English' ? 'Ticket Configuration' : 'إعدادات التذاكر'}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure ticket settings and automation' 
                  : 'تكوين إعدادات التذاكر والأتمتة'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label>{language === 'English' ? 'Ticket ID Format' : 'تنسيق معرف التذكرة'}</Label>
                    <Input 
                      value="TKT-####"
                      disabled={true}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'English' 
                        ? 'Ticket IDs are auto-generated with TKT- prefix and sequential numbering.' 
                        : 'يتم إنشاء معرفات التذاكر تلقائيًا ببادئة TKT- وترقيم متسلسل.'}
                    </p>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>{translations.departments}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage departments for your organization.' 
                  : 'إدارة الأقسام لمؤسستك.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        placeholder={language === 'English' ? "Add new department" : "إضافة قسم جديد"}
                        className="flex-grow"
                      />
                      <Button 
                        onClick={handleAddDepartment} 
                        variant="secondary" 
                        size="sm" 
                        className="whitespace-nowrap"
                        disabled={!newDepartment.trim()}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.add}
                      </Button>
                    </div>
                    
                    {departments.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-2 text-left">{translations.name}</th>
                              <th className="px-4 py-2 text-right">{translations.actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {departments.map((dept, index) => (
                              <tr key={index} className="hover:bg-muted/25">
                                <td className="px-4 py-2">
                                  {editingDeptIndex === index ? (
                                    <Input
                                      value={editedDeptName}
                                      onChange={(e) => setEditedDeptName(e.target.value)}
                                      className="w-full"
                                    />
                                  ) : (
                                    dept
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right space-x-1">
                                  {editingDeptIndex === index ? (
                                    <>
                                      <Button
                                        onClick={() => handleSaveDepartment(index)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        onClick={handleCancelEditDepartment}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        onClick={() => handleEditDepartment(index)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <Edit className="h-4 w-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteDepartment(index)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <Trash className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 border rounded-md bg-muted/10">
                        {translations.noData}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asset Management Tab */}
        <TabsContent value="asset">
          {/* Asset ID Prefix Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{language === 'English' ? 'Asset ID Configuration' : 'إعدادات معرف الأصل'}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure prefix for all asset IDs' 
                  : 'تكوين بادئة لجميع معرفات الأصول'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label>{language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل'}</Label>
                    <Input 
                      value={assetIdPrefix} 
                      onChange={(e) => setAssetIdPrefix(e.target.value)}
                      placeholder="SIT-" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'English' 
                        ? 'The prefix used for all asset IDs throughout the system (e.g., SIT-LT-0001).' 
                        : 'البادئة المستخدمة لجميع معرفات الأصول في جميع أنحاء النظام (مثال: SIT-LT-0001).'}
                    </p>
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
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Types */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetTypes}</CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Manage asset types for categorization.' 
                    : 'إدارة أنواع الأصول للتصنيف.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder={language === 'English' ? "Type name" : "اسم النوع"}
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleAddAssetType}
                        disabled={!newTypeName.trim()}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.add}
                      </Button>
                    </div>
                    <Input
                      placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                      value={newTypeDescription}
                      onChange={(e) => setNewTypeDescription(e.target.value)}
                    />
                  </div>
                  
                  {customAssetTypes.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{translations.description}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {customAssetTypes.map((type: any) => (
                            <tr key={type.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeName}
                                    onChange={(e) => setEditedTypeName(e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  type.name
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeDescription}
                                    onChange={(e) => setEditedTypeDescription(e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  type.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right space-x-1">
                                {editingTypeId === type.id ? (
                                  <>
                                    <Button
                                      onClick={handleSaveAssetType}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditAssetType}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => handleEditAssetType(type)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteAssetType(type.id)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Trash className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-muted/10">
                      {translations.noData}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Brands */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetBrands}</CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Manage asset brands for your inventory.' 
                    : 'إدارة العلامات التجارية للأصول في المخزون.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder={language === 'English' ? "Brand name" : "اسم العلامة التجارية"}
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleAddAssetBrand}
                        disabled={!newBrandName.trim()}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.add}
                      </Button>
                    </div>
                    <Input
                      placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                      value={newBrandDescription}
                      onChange={(e) => setNewBrandDescription(e.target.value)}
                    />
                  </div>
                  
                  {customAssetBrands.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{translations.description}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {customAssetBrands.map((brand: any) => (
                            <tr key={brand.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandName}
                                    onChange={(e) => setEditedBrandName(e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  brand.name
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandDescription}
                                    onChange={(e) => setEditedBrandDescription(e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  brand.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right space-x-1">
                                {editingBrandId === brand.id ? (
                                  <>
                                    <Button
                                      onClick={handleSaveAssetBrand}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditAssetBrand}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => handleEditAssetBrand(brand)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteAssetBrand(brand.id)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Trash className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-muted/10">
                      {translations.noData}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Statuses */}
            <Card>
              <CardHeader>
                <CardTitle>{translations.assetStatuses}</CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Customize statuses for tracking assets.' 
                    : 'تخصيص حالات لتتبع الأصول.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder={language === 'English' ? "Status name" : "اسم الحالة"}
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        className="flex-grow"
                      />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleAddAssetStatus}
                        disabled={!newStatusName.trim()}
                        className="whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.add}
                      </Button>
                    </div>
                    <Input
                      placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                      value={newStatusDescription}
                      onChange={(e) => setNewStatusDescription(e.target.value)}
                    />
                    <div className="flex items-center space-x-2">
                      <Label>{translations.color}</Label>
                      <Input
                        type="color"
                        value={newStatusColor}
                        onChange={(e) => setNewStatusColor(e.target.value)}
                        className="w-16 h-8"
                      />
                    </div>
                  </div>
                  
                  {customAssetStatuses.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{translations.description}</th>
                            <th className="px-4 py-2 text-left">{translations.color}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {customAssetStatuses.map((status: any) => (
                            <tr key={status.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2">
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusName}
                                    onChange={(e) => setEditedStatusName(e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  status.name
                                )}
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusDescription}
                                    onChange={(e) => setEditedStatusDescription(e.target.value)}
                                    className="w-full"
                                  />
                                ) : (
                                  status.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {editingStatusId === status.id ? (
                                  <Input
                                    type="color"
                                    value={editedStatusColor}
                                    onChange={(e) => setEditedStatusColor(e.target.value)}
                                    className="w-16 h-8"
                                  />
                                ) : (
                                  <div 
                                    className="w-6 h-6 rounded-full" 
                                    style={{ backgroundColor: status.color || '#3B82F6' }}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-2 text-right space-x-1">
                                {editingStatusId === status.id ? (
                                  <>
                                    <Button
                                      onClick={handleSaveAssetStatus}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      onClick={handleCancelEditAssetStatus}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      onClick={() => handleEditAssetStatus(status)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteAssetStatus(status.id)}
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <Trash className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md bg-muted/10">
                      {translations.noData}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Service Providers Tab */}
        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>{translations.serviceProviders}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage service providers for asset maintenance and support.' 
                  : 'إدارة مزودي الخدمة لصيانة ودعم الأصول.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder={language === 'English' ? "Provider name" : "اسم مزود الخدمة"}
                      value={newProviderName}
                      onChange={(e) => setNewProviderName(e.target.value)}
                      className="flex-grow"
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleAddServiceProvider}
                      disabled={!newProviderName.trim()}
                      className="whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {translations.add}
                    </Button>
                  </div>
                  <Input
                    placeholder={language === 'English' ? "Contact person (optional)" : "جهة الاتصال (اختياري)"}
                    value={newProviderContact}
                    onChange={(e) => setNewProviderContact(e.target.value)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder={language === 'English' ? "Phone (optional)" : "الهاتف (اختياري)"}
                      value={newProviderPhone}
                      onChange={(e) => setNewProviderPhone(e.target.value)}
                    />
                    <Input
                      placeholder={language === 'English' ? "Email (optional)" : "البريد الإلكتروني (اختياري)"}
                      value={newProviderEmail}
                      onChange={(e) => setNewProviderEmail(e.target.value)}
                      type="email"
                    />
                  </div>
                </div>
                
                {serviceProviders.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-2 text-left">{translations.name}</th>
                          <th className="px-4 py-2 text-left">{translations.contactPerson}</th>
                          <th className="px-4 py-2 text-left">{translations.phone}</th>
                          <th className="px-4 py-2 text-left">{translations.email}</th>
                          <th className="px-4 py-2 text-right">{translations.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {serviceProviders.map((provider: any) => (
                          <tr key={provider.id} className="hover:bg-muted/25">
                            <td className="px-4 py-2">
                              {editingProviderId === provider.id ? (
                                <Input
                                  value={editedProviderName}
                                  onChange={(e) => setEditedProviderName(e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                provider.name
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              {editingProviderId === provider.id ? (
                                <Input
                                  value={editedProviderContact}
                                  onChange={(e) => setEditedProviderContact(e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                provider.contactPerson || '-'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              {editingProviderId === provider.id ? (
                                <Input
                                  value={editedProviderPhone}
                                  onChange={(e) => setEditedProviderPhone(e.target.value)}
                                  className="w-full"
                                />
                              ) : (
                                provider.phone || '-'
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              {editingProviderId === provider.id ? (
                                <Input
                                  value={editedProviderEmail}
                                  onChange={(e) => setEditedProviderEmail(e.target.value)}
                                  className="w-full"
                                  type="email"
                                />
                              ) : (
                                provider.email || '-'
                              )}
                            </td>
                            <td className="px-4 py-2 text-right space-x-1">
                              {editingProviderId === provider.id ? (
                                <>
                                  <Button
                                    onClick={handleSaveServiceProvider}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    onClick={handleCancelEditServiceProvider}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => handleEditServiceProvider(provider)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteServiceProvider(provider.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Trash className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 border rounded-md bg-muted/10">
                    {translations.noData}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
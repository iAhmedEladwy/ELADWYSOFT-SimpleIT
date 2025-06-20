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
import { Settings, Save, Globe, Loader2, Trash, Trash2, Plus, Edit, Check, X, Mail, Download, Upload, Search, Users, Ticket, Package, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


function SystemConfig() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  // Basic configuration states
  const [assetIdPrefix, setAssetIdPrefix] = useState('AST-');
  const [empIdPrefix, setEmpIdPrefix] = useState('EMP-');
  const [ticketIdPrefix, setTicketIdPrefix] = useState('TKT-');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(true);
  
  // Department management states
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editedDeptName, setEditedDeptName] = useState('');
  
  // Request type management states
  const [newRequestTypeName, setNewRequestTypeName] = useState('');
  const [newRequestTypeDescription, setNewRequestTypeDescription] = useState('');
  const [isRequestTypeDialogOpen, setIsRequestTypeDialogOpen] = useState(false);
  
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

  // Asset Management form states
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

  // Asset Management dialog states
  const [isAssetTypeDialogOpen, setIsAssetTypeDialogOpen] = useState(false);
  const [isAssetBrandDialogOpen, setIsAssetBrandDialogOpen] = useState(false);
  const [isAssetStatusDialogOpen, setIsAssetStatusDialogOpen] = useState(false);
  const [isServiceProviderDialogOpen, setIsServiceProviderDialogOpen] = useState(false);

  // Asset Management search states
  const [assetTypeSearch, setAssetTypeSearch] = useState('');
  const [assetBrandSearch, setAssetBrandSearch] = useState('');
  const [assetStatusSearch, setAssetStatusSearch] = useState('');
  const [serviceProviderSearch, setServiceProviderSearch] = useState('');

  // Editing states for asset management
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editedTypeName, setEditedTypeName] = useState('');
  const [editedTypeDescription, setEditedTypeDescription] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<number | null>(null);
  const [editedBrandName, setEditedBrandName] = useState('');
  const [editedBrandDescription, setEditedBrandDescription] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editedStatusName, setEditedStatusName] = useState('');
  const [editedStatusDescription, setEditedStatusDescription] = useState('');
  const [editedStatusColor, setEditedStatusColor] = useState('#3B82F6');
  const [editingProviderId, setEditingProviderId] = useState<number | null>(null);
  const [editedProviderName, setEditedProviderName] = useState('');
  const [editedProviderContact, setEditedProviderContact] = useState('');
  const [editedProviderPhone, setEditedProviderPhone] = useState('');
  const [editedProviderEmail, setEditedProviderEmail] = useState('');
  const [editingRequestTypeId, setEditingRequestTypeId] = useState<number | null>(null);
  const [editedRequestTypeName, setEditedRequestTypeName] = useState('');
  const [editedRequestTypeDescription, setEditedRequestTypeDescription] = useState('');
  
  // Clear audit logs states
  const [clearLogsDialogOpen, setClearLogsDialogOpen] = useState(false);
  const [clearLogsTimeframe, setClearLogsTimeframe] = useState('month');
  
  // User management states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editedUserUsername, setEditedUserUsername] = useState('');
  const [editedUserEmail, setEditedUserEmail] = useState('');
  const [editedUserRole, setEditedUserRole] = useState('');

  // Queries
  const { data: config } = useQuery<any>({
    queryKey: ['/api/system-config'],
    enabled: hasAccess(3),
  });

  const { data: customRequestTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-request-types'],
    enabled: hasAccess(3),
  });

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

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: hasAccess(3),
  });

  // Filtered arrays for search functionality
  const filteredAssetTypes = customAssetTypes.filter((type: any) =>
    type.name.toLowerCase().includes(assetTypeSearch.toLowerCase())
  );

  const filteredAssetBrands = customAssetBrands.filter((brand: any) =>
    brand.name.toLowerCase().includes(assetBrandSearch.toLowerCase())
  );

  const filteredAssetStatuses = customAssetStatuses.filter((status: any) =>
    status.name.toLowerCase().includes(assetStatusSearch.toLowerCase())
  );

  const filteredServiceProviders = serviceProviders.filter((provider: any) =>
    provider.name.toLowerCase().includes(serviceProviderSearch.toLowerCase())
  );

  // Update local state when config data is loaded
  useEffect(() => {
    if (config) {
      setAssetIdPrefix(config.assetIdPrefix || 'AST-');
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

  // Configuration update mutation
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

  // Create custom request type mutation
  const createRequestTypeMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('POST', '/api/custom-request-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-request-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Request type added successfully' : 'تمت إضافة نوع الطلب بنجاح',
      });
      setNewRequestTypeName('');
      setNewRequestTypeDescription('');
      setIsRequestTypeDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add request type' : 'فشل إضافة نوع الطلب',
        variant: 'destructive'
      });
      console.error('Failed to create request type:', error);
    }
  });

  // Update custom request type mutation
  const updateRequestTypeMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) => 
      apiRequest('PUT', `/api/custom-request-types/${id}`, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-request-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Request type updated successfully' : 'تم تحديث نوع الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update request type' : 'فشل تحديث نوع الطلب',
        variant: 'destructive'
      });
      console.error('Failed to update request type:', error);
    }
  });

  // Delete custom request type mutation
  const deleteRequestTypeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/custom-request-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-request-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Request type deleted successfully' : 'تم حذف نوع الطلب بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to delete request type' : 'فشل حذف نوع الطلب',
        variant: 'destructive'
      });
      console.error('Failed to delete request type:', error);
    }
  });

  // Asset management mutations
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
      setIsAssetTypeDialogOpen(false);
    },
  });

  const updateAssetTypeMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) => 
      apiRequest('PUT', `/api/custom-asset-types/${id}`, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
    },
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
  });



  const createAssetBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('POST', '/api/custom-asset-brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand added successfully' : 'تمت إضافة علامة الأصل بنجاح',
      });
      setNewBrandName('');
      setNewBrandDescription('');
      setIsAssetBrandDialogOpen(false);
    },
  });

  const updateAssetBrandMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) => 
      apiRequest('PUT', `/api/custom-asset-brands/${id}`, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث علامة الأصل بنجاح',
      });
    },
  });

  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-asset-brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand deleted successfully' : 'تم حذف علامة الأصل بنجاح',
      });
    },
  });

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
      setIsAssetStatusDialogOpen(false);
    },
  });

  const updateAssetStatusMutation = useMutation({
    mutationFn: ({ id, name, description, color }: { id: number; name: string; description?: string; color?: string }) => 
      apiRequest('PUT', `/api/custom-asset-statuses/${id}`, { name, description, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصل بنجاح',
      });
    },
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
  });



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
      setIsServiceProviderDialogOpen(false);
    },
  });

  const updateServiceProviderMutation = useMutation({
    mutationFn: ({ id, name, contactPerson, phone, email }: { id: number; name: string; contactPerson?: string; phone?: string; email?: string }) => 
      apiRequest('PUT', `/api/service-providers/${id}`, { name, contactPerson, phone, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider updated successfully' : 'تم تحديث مزود الخدمة بنجاح',
      });
    },
  });

  const deleteServiceProviderMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/service-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider deleted successfully' : 'تم حذف مزود الخدمة بنجاح',
      });
    },
  });

  // Clear audit logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async (options: any) => {
      const response = await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(options),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear logs');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: data.message || `Successfully cleared ${data.deletedCount} audit log entries`,
      });
      setClearLogsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || 'Failed to clear logs',
        variant: 'destructive'
      });
    }
  });





  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest('POST', '/api/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsUserDialogOpen(false);
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserRole('employee');
      setNewUserPassword('');
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'User created successfully' : 'تم إنشاء المستخدم بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to create user' : 'فشل في إنشاء المستخدم'),
        variant: 'destructive'
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) => 
      apiRequest('PUT', `/api/users/${id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingUserId(null);
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'User updated successfully' : 'تم تحديث المستخدم بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update user' : 'فشل في تحديث المستخدم'),
        variant: 'destructive'
      });
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (data: { type: string; data: any[]; mapping: Record<string, string> }) =>
      apiRequest('POST', `/api/import/${data.type}`, { data: data.data, mapping: data.mapping }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries();
      setImporting(false);
      setImportType(null);
      setCsvData([]);
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' 
          ? `Successfully imported ${result.imported || 0} records` 
          : `تم استيراد ${result.imported || 0} سجل بنجاح`,
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

  // Remove demo data mutation
  const removeDemoDataMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/remove-demo-data'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Demo data removed successfully' : 'تم حذف البيانات التجريبية بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to remove demo data' : 'فشل في حذف البيانات التجريبية'),
        variant: 'destructive'
      });
    }
  });

  // Configuration handlers
  const handleSaveConfig = () => {
    const configData = {
      language: language === 'English' ? 'en' : 'ar',
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments,
      emailHost: emailHost || null,
      emailPort: emailPort ? parseInt(emailPort) : null,
      emailUser: emailUser || null,
      emailPassword: emailPassword || null,
      emailFromAddress: emailFromAddress || null,
      emailFromName: emailFromName || null,
      emailSecure
    };
    
    updateConfigMutation.mutate(configData);
  };

  // Department handlers
  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    
    const updatedDepartments = [...departments, newDepartment.trim()];
    setDepartments(updatedDepartments);
    setNewDepartment('');
    
    // Save to backend with all current config data
    const configData = {
      language: config?.language || 'en',
      assetIdPrefix: config?.assetIdPrefix || 'AST-',
      empIdPrefix: config?.empIdPrefix || 'EMP-',
      ticketIdPrefix: config?.ticketIdPrefix || 'TKT-',
      currency: config?.currency || 'USD',
      departments: updatedDepartments,
      emailHost: config?.emailHost || null,
      emailPort: config?.emailPort || null,
      emailUser: config?.emailUser || null,
      emailPassword: config?.emailPassword || null,
      emailFromAddress: config?.emailFromAddress || null,
      emailFromName: config?.emailFromName || null,
      emailSecure: config?.emailSecure !== false
    };
    
    updateConfigMutation.mutate(configData);
  };

  const handleEditDepartment = (index: number) => {
    setEditingDeptIndex(index);
    setEditedDeptName(departments[index]);
  };

  const handleSaveDepartment = (index: number) => {
    if (!editedDeptName.trim()) return;
    
    const updatedDepartments = [...departments];
    updatedDepartments[index] = editedDeptName.trim();
    setDepartments(updatedDepartments);
    setEditingDeptIndex(null);
    setEditedDeptName('');
    
    // Save to backend with all current config data
    const configData = {
      language: config?.language || 'en',
      assetIdPrefix: config?.assetIdPrefix || 'AST-',
      empIdPrefix: config?.empIdPrefix || 'EMP-',
      ticketIdPrefix: config?.ticketIdPrefix || 'TKT-',
      currency: config?.currency || 'USD',
      departments: updatedDepartments,
      emailHost: config?.emailHost || null,
      emailPort: config?.emailPort || null,
      emailUser: config?.emailUser || null,
      emailPassword: config?.emailPassword || null,
      emailFromAddress: config?.emailFromAddress || null,
      emailFromName: config?.emailFromName || null,
      emailSecure: config?.emailSecure !== false
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
    
    // Save to backend with all current config data
    const configData = {
      language: config?.language || 'en',
      assetIdPrefix: config?.assetIdPrefix || 'AST-',
      empIdPrefix: config?.empIdPrefix || 'EMP-',
      ticketIdPrefix: config?.ticketIdPrefix || 'TKT-',
      currency: config?.currency || 'USD',
      departments: updatedDepartments,
      emailHost: config?.emailHost || null,
      emailPort: config?.emailPort || null,
      emailUser: config?.emailUser || null,
      emailPassword: config?.emailPassword || null,
      emailFromAddress: config?.emailFromAddress || null,
      emailFromName: config?.emailFromName || null,
      emailSecure: config?.emailSecure !== false
    };
    
    updateConfigMutation.mutate(configData);
  };

  // Email settings handler
  const handleSaveEmailSettings = () => {
    const configData = {
      language: config?.language || 'en',
      assetIdPrefix: config?.assetIdPrefix || 'AST-',
      empIdPrefix: config?.empIdPrefix || 'EMP-',
      ticketIdPrefix: config?.ticketIdPrefix || 'TKT-',
      currency: config?.currency || 'USD',
      departments: config?.departments || [],
      emailHost: emailHost || null,
      emailPort: emailPort ? parseInt(emailPort) : null,
      emailUser: emailUser || null,
      emailPassword: emailPassword || null,
      emailFromAddress: emailFromAddress || null,
      emailFromName: emailFromName || null,
      emailSecure
    };
    
    updateConfigMutation.mutate(configData);
  };

  // Request type handlers
  const handleAddRequestType = () => {
    if (!newRequestTypeName.trim()) return;
    
    createRequestTypeMutation.mutate({
      name: newRequestTypeName.trim(),
      description: newRequestTypeDescription.trim() || undefined
    });
  };

  const handleDeleteRequestType = (id: number) => {
    deleteRequestTypeMutation.mutate(id);
  };

  const handleClearAuditLogs = () => {
    const options: any = {};
    
    if (clearLogsTimeframe !== 'all') {
      let date = new Date();
      if (clearLogsTimeframe === 'week') {
        date.setDate(date.getDate() - 7);
      } else if (clearLogsTimeframe === 'month') {
        date.setMonth(date.getMonth() - 1);
      } else if (clearLogsTimeframe === 'year') {
        date.setFullYear(date.getFullYear() - 1);
      }
      options.olderThan = date.toISOString();
    }
    
    clearLogsMutation.mutate(options);
  };

  // User management handlers
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest('POST', '/api/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'User created successfully' : 'تم إنشاء المستخدم بنجاح',
      });
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserRole('employee');
      setNewUserPassword('');
      setIsUserDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
    }
  });

  const handleAddUser = () => {
    if (!newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    
    createUserMutation.mutate({
      username: newUserUsername.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      password: newUserPassword,
      isActive: true
    });
  };

  const handleToggleUserStatus = (userId: number, isActive: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      userData: { isActive }
    });
  };

  const handleRemoveDemoData = () => {
    removeDemoDataMutation.mutate();
  };

  // Asset management handlers
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

  // CSV Import handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'employees' | 'assets') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: language === 'English' ? 'Error' : 'خطأ',
          description: language === 'English' ? 'CSV file must have at least a header and one data row' : 'يجب أن يحتوي ملف CSV على رأس واحد على الأقل وصف بيانات واحد',
          variant: 'destructive'
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setCsvHeaders(headers);
      setCsvData(data);
      setImportType(type);
      setImporting(true);
    };
    reader.readAsText(file);
  };

  const handleExport = (type: 'employees' | 'assets') => {
    window.open(`/api/${type}/export`, '_blank');
  };

  const handleImport = () => {
    if (!importType || csvData.length === 0) return;
    
    importMutation.mutate({
      type: importType,
      data: csvData,
      mapping: fieldMapping
    });
  };

  const translations = {
    systemConfig: language === 'English' ? 'System Configuration' : 'إعدادات النظام',
    general: language === 'English' ? 'System Defaults' : 'الافتراضيات النظام',
    email: language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني',
    assets: language === 'English' ? 'Asset Management' : 'إدارة الأصول',
    requests: language === 'English' ? 'Request Types' : 'أنواع الطلبات',
    generalSettings: language === 'English' ? 'System Defaults' : 'الافتراضيات النظام',
    ticketSettings: language === 'English' ? 'Ticket Settings' : 'إعدادات التذاكر',
    employeeSettings: language === 'English' ? 'Employee Settings' : 'إعدادات الموظفين',
    assetManagement: language === 'English' ? 'Asset Management' : 'إدارة الأصول',
    emailSettings: language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني',
    language: language === 'English' ? 'Language' : 'اللغة',
    english: language === 'English' ? 'English' : 'الإنجليزية',
    arabic: language === 'English' ? 'Arabic' : 'العربية',
    currency: language === 'English' ? 'Currency' : 'العملة',
    departments: language === 'English' ? 'Departments' : 'الأقسام',
    requestTypes: language === 'English' ? 'Request Types' : 'أنواع الطلبات',
    assetTypes: language === 'English' ? 'Asset Types' : 'أنواع الأصول',
    assetBrands: language === 'English' ? 'Asset Brands' : 'علامات الأصول التجارية',
    assetStatuses: language === 'English' ? 'Asset Statuses' : 'حالات الأصول',
    serviceProviders: language === 'English' ? 'Service Providers' : 'مزودي الخدمة',
    name: language === 'English' ? 'Name' : 'الاسم',
    description: language === 'English' ? 'Description' : 'الوصف',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    add: language === 'English' ? 'Add' : 'إضافة',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    exportImport: language === 'English' ? 'Export/Import' : 'تصدير/استيراد',
    noData: language === 'English' ? 'No items found' : 'لم يتم العثور على عناصر',
    addRequestType: language === 'English' ? 'Add Request Type' : 'إضافة نوع طلب',
    clearAuditLogs: language === 'English' ? 'Clear Audit Logs' : 'مسح سجلات المراجعة',
    clearLogsDescription: language === 'English' 
      ? 'Clear old audit logs to free up storage space. This action cannot be undone.' 
      : 'مسح سجلات المراجعة القديمة لتوفير مساحة التخزين. لا يمكن التراجع عن هذا الإجراء.',
    clear: language === 'English' ? 'Clear' : 'مسح',
    maintenanceSettings: language === 'English' ? 'Maintenance Settings' : 'إعدادات الصيانة'
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
        <TabsList className="grid grid-cols-6 lg:max-w-5xl mb-4">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            {translations.general}
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            {translations.email}
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Package className="h-4 w-4 mr-2" />
            {translations.assets}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <FileText className="h-4 w-4 mr-2" />
            {translations.requests}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {language === 'English' ? 'Users & Roles' : 'المستخدمين والأدوار'}
          </TabsTrigger>
          <TabsTrigger value="exportImport">
            <Download className="h-4 w-4 mr-2" />
            {translations.exportImport}
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          {/* Basic Configuration */}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === 'English' 
                        ? 'Currency used for asset values and financial reporting.' 
                        : 'العملة المستخدمة لقيم الأصول والتقارير المالية.'}
                    </p>
                  </div>

                  {/* ID Configuration Section */}
                  <div className="space-y-4 mt-6 border-t pt-6">
                    <h3 className="text-lg font-medium">
                      {language === 'English' ? 'ID Configuration' : 'تكوين المعرف'}
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>{language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل'}</Label>
                        <Input 
                          value={assetIdPrefix} 
                          onChange={(e) => setAssetIdPrefix(e.target.value)}
                          placeholder="AST-" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' 
                            ? 'Prefix for asset IDs (e.g., AST-0001)' 
                            : 'بادئة معرفات الأصول (مثال: AST-0001)'}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>{language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف'}</Label>
                        <Input 
                          value={empIdPrefix} 
                          onChange={(e) => setEmpIdPrefix(e.target.value)}
                          placeholder="EMP-" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' 
                            ? 'Prefix for employee IDs (e.g., EMP-0001)' 
                            : 'بادئة معرفات الموظفين (مثال: EMP-0001)'}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>{language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة'}</Label>
                        <Input 
                          value={ticketIdPrefix} 
                          onChange={(e) => setTicketIdPrefix(e.target.value)}
                          placeholder="TKT-" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' 
                            ? 'Prefix for ticket IDs (e.g., TKT-0001)' 
                            : 'بادئة معرفات التذاكر (مثال: TKT-0001)'}
                        </p>
                      </div>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export/Import Section */}
          <Card>
            <CardHeader>
              <CardTitle>{translations.exportImport}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Export and import data for employees and assets.' 
                  : 'تصدير واستيراد البيانات للموظفين والأصول.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{language === 'English' ? 'Export Data' : 'تصدير البيانات'}</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleExport('employees')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Export Employees' : 'تصدير الموظفين'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleExport('assets')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Export Assets' : 'تصدير الأصول'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{language === 'English' ? 'Import Data' : 'استيراد البيانات'}</h3>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="employee-upload" className="cursor-pointer">
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {language === 'English' ? 'Import Employees' : 'استيراد الموظفين'}
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="employee-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'employees')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="asset-upload" className="cursor-pointer">
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <span>
                            <Upload className="mr-2 h-4 w-4" />
                            {language === 'English' ? 'Import Assets' : 'استيراد الأصول'}
                          </span>
                        </Button>
                      </Label>
                      <input
                        id="asset-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'assets')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {importing && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">
                    {language === 'English' ? 'Configure Import Mapping' : 'تكوين خريطة الاستيراد'}
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {csvHeaders.map((header, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Label className="w-1/3 text-sm">{header}</Label>
                        <Select
                          value={fieldMapping[header] || ''}
                          onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [header]: value }))}
                        >
                          <SelectTrigger className="w-2/3">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {importType === 'employees' ? (
                              <>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                <SelectItem value="department">Department</SelectItem>
                                <SelectItem value="position">Position</SelectItem>
                                <SelectItem value="employeeId">Employee ID</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="assetId">Asset ID</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                                <SelectItem value="brand">Brand</SelectItem>
                                <SelectItem value="modelName">Model Name</SelectItem>
                                <SelectItem value="serialNumber">Serial Number</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setImporting(false)}>
                      {language === 'English' ? 'Cancel' : 'إلغاء'}
                    </Button>
                    <Button onClick={handleImport} disabled={importMutation.isPending}>
                      {importMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {language === 'English' ? 'Import' : 'استيراد'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticket Settings Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>{translations.ticketSettings}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure ticket types and automation settings' 
                  : 'تكوين أنواع التذاكر وإعدادات الأتمتة'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{translations.requestTypes}</h3>
                  <Dialog open={isRequestTypeDialogOpen} onOpenChange={setIsRequestTypeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        {translations.addRequestType}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{translations.addRequestType}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label>{translations.name}</Label>
                          <Input
                            value={newRequestTypeName}
                            onChange={(e) => setNewRequestTypeName(e.target.value)}
                            placeholder={language === 'English' ? "Request type name" : "اسم نوع الطلب"}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>{translations.description}</Label>
                          <Input
                            value={newRequestTypeDescription}
                            onChange={(e) => setNewRequestTypeDescription(e.target.value)}
                            placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsRequestTypeDialogOpen(false)}>
                            {language === 'English' ? 'Cancel' : 'إلغاء'}
                          </Button>
                          <Button onClick={handleAddRequestType} disabled={!newRequestTypeName.trim()}>
                            {translations.add}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {customRequestTypes.length > 0 ? (
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
                        {customRequestTypes.map((requestType: any) => (
                          <tr key={requestType.id} className="hover:bg-muted/25">
                            <td className="px-4 py-2 font-medium">
                              {editingRequestTypeId === requestType.id ? (
                                <Input
                                  value={editedRequestTypeName}
                                  onChange={(e) => setEditedRequestTypeName(e.target.value)}
                                  className="w-full"
                                  onBlur={() => {
                                    if (editedRequestTypeName.trim() && editedRequestTypeName !== requestType.name) {
                                      updateRequestTypeMutation.mutate({
                                        id: requestType.id,
                                        name: editedRequestTypeName,
                                        description: editedRequestTypeDescription
                                      });
                                    }
                                    setEditingRequestTypeId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                requestType.name
                              )}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {editingRequestTypeId === requestType.id ? (
                                <Input
                                  value={editedRequestTypeDescription}
                                  onChange={(e) => setEditedRequestTypeDescription(e.target.value)}
                                  className="w-full"
                                  placeholder={language === 'English' ? "Description" : "الوصف"}
                                />
                              ) : (
                                requestType.description || '-'
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  onClick={() => {
                                    setEditingRequestTypeId(requestType.id);
                                    setEditedRequestTypeName(requestType.name);
                                    setEditedRequestTypeDescription(requestType.description || '');
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  onClick={() => deleteRequestTypeMutation.mutate(requestType.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Trash className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
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

        {/* Employee Settings Tab */}
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
        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>{translations.assetManagement}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage asset types, brands, statuses, and service providers for your organization.' 
                  : 'إدارة أنواع الأصول والعلامات التجارية والحالات ومقدمي الخدمة لمؤسستك.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="types" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="types">{translations.assetTypes}</TabsTrigger>
                  <TabsTrigger value="brands">{translations.assetBrands}</TabsTrigger>
                  <TabsTrigger value="statuses">{translations.assetStatuses}</TabsTrigger>
                  <TabsTrigger value="providers">{translations.serviceProviders}</TabsTrigger>
                </TabsList>

                {/* Asset Types Sub-tab */}
                <TabsContent value="types" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder={language === 'English' ? "Search asset types..." : "البحث في أنواع الأصول..."}
                      value={assetTypeSearch}
                      onChange={(e) => setAssetTypeSearch(e.target.value)}
                      className="max-w-sm"
                    />
                    <Dialog open={isAssetTypeDialogOpen} onOpenChange={setIsAssetTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Add Asset Type' : 'إضافة نوع أصل'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Asset Type' : 'إضافة نوع أصل'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>{translations.name}</Label>
                            <Input
                              value={newTypeName}
                              onChange={(e) => setNewTypeName(e.target.value)}
                              placeholder={language === 'English' ? "Asset type name" : "اسم نوع الأصل"}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{translations.description}</Label>
                            <Input
                              value={newTypeDescription}
                              onChange={(e) => setNewTypeDescription(e.target.value)}
                              placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAssetTypeDialogOpen(false)}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button onClick={handleAddAssetType} disabled={!newTypeName.trim()}>
                              {translations.add}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {filteredAssetTypes.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 sticky top-0">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{language === 'English' ? 'Description' : 'الوصف'}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredAssetTypes.map((type: any) => (
                            <tr key={type.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2 font-medium">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeName}
                                    onChange={(e) => setEditedTypeName(e.target.value)}
                                    className="w-full"
                                    onBlur={() => {
                                      if (editedTypeName.trim() && editedTypeName !== type.name) {
                                        updateAssetTypeMutation.mutate({
                                          id: type.id,
                                          name: editedTypeName,
                                          description: editedTypeDescription
                                        });
                                      }
                                      setEditingTypeId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  type.name
                                )}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeDescription}
                                    onChange={(e) => setEditedTypeDescription(e.target.value)}
                                    className="w-full"
                                    placeholder={language === 'English' ? "Description" : "الوصف"}
                                  />
                                ) : (
                                  type.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    onClick={() => {
                                      setEditingTypeId(type.id);
                                      setEditedTypeName(type.name);
                                      setEditedTypeDescription(type.description || '');
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteAssetTypeMutation.mutate(type.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Trash className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'English' ? 'No asset types found' : 'لم يتم العثور على أنواع أصول'}
                    </div>
                  )}
                </TabsContent>

                {/* Asset Brands Sub-tab */}
                <TabsContent value="brands" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder={language === 'English' ? "Search asset brands..." : "البحث في العلامات التجارية..."}
                      value={assetBrandSearch}
                      onChange={(e) => setAssetBrandSearch(e.target.value)}
                      className="max-w-sm"
                    />
                    <Dialog open={isAssetBrandDialogOpen} onOpenChange={setIsAssetBrandDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Add Asset Brand' : 'إضافة علامة تجارية'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Asset Brand' : 'إضافة علامة تجارية'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>{translations.name}</Label>
                            <Input
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              placeholder={language === 'English' ? "Brand name" : "اسم العلامة التجارية"}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{translations.description}</Label>
                            <Input
                              value={newBrandDescription}
                              onChange={(e) => setNewBrandDescription(e.target.value)}
                              placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAssetBrandDialogOpen(false)}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button onClick={handleAddAssetBrand} disabled={!newBrandName.trim()}>
                              {translations.add}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {filteredAssetBrands.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 sticky top-0">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{language === 'English' ? 'Description' : 'الوصف'}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredAssetBrands.map((brand: any) => (
                            <tr key={brand.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2 font-medium">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandName}
                                    onChange={(e) => setEditedBrandName(e.target.value)}
                                    className="w-full"
                                    onBlur={() => {
                                      if (editedBrandName.trim() && editedBrandName !== brand.name) {
                                        updateAssetBrandMutation.mutate({
                                          id: brand.id,
                                          name: editedBrandName,
                                          description: editedBrandDescription
                                        });
                                      }
                                      setEditingBrandId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  brand.name
                                )}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandDescription}
                                    onChange={(e) => setEditedBrandDescription(e.target.value)}
                                    className="w-full"
                                    placeholder={language === 'English' ? "Description" : "الوصف"}
                                  />
                                ) : (
                                  brand.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    onClick={() => {
                                      setEditingBrandId(brand.id);
                                      setEditedBrandName(brand.name);
                                      setEditedBrandDescription(brand.description || '');
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteAssetBrandMutation.mutate(brand.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Trash className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'English' ? 'No asset brands found' : 'لم يتم العثور على علامات تجارية'}
                    </div>
                  )}
                </TabsContent>

                {/* Asset Statuses Sub-tab */}
                <TabsContent value="statuses" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder={language === 'English' ? "Search asset statuses..." : "البحث في حالات الأصول..."}
                      value={assetStatusSearch}
                      onChange={(e) => setAssetStatusSearch(e.target.value)}
                      className="max-w-sm"
                    />
                    <Dialog open={isAssetStatusDialogOpen} onOpenChange={setIsAssetStatusDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Add Asset Status' : 'إضافة حالة أصل'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Asset Status' : 'إضافة حالة أصل'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>{translations.name}</Label>
                            <Input
                              value={newStatusName}
                              onChange={(e) => setNewStatusName(e.target.value)}
                              placeholder={language === 'English' ? "Status name" : "اسم الحالة"}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{language === 'English' ? 'Color' : 'اللون'}</Label>
                            <input
                              type="color"
                              value={newStatusColor}
                              onChange={(e) => setNewStatusColor(e.target.value)}
                              className="w-16 h-10 border rounded cursor-pointer"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{translations.description}</Label>
                            <Input
                              value={newStatusDescription}
                              onChange={(e) => setNewStatusDescription(e.target.value)}
                              placeholder={language === 'English' ? "Description (optional)" : "الوصف (اختياري)"}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAssetStatusDialogOpen(false)}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button onClick={handleAddAssetStatus} disabled={!newStatusName.trim()}>
                              {translations.add}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {filteredAssetStatuses.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 sticky top-0">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{language === 'English' ? 'Description' : 'الوصف'}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredAssetStatuses.map((status: any) => (
                            <tr key={status.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2 flex items-center">
                                <div 
                                  className="w-4 h-4 rounded mr-2" 
                                  style={{ backgroundColor: editingStatusId === status.id ? editedStatusColor : status.color }}
                                />
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusName}
                                    onChange={(e) => setEditedStatusName(e.target.value)}
                                    className="w-full"
                                    onBlur={() => {
                                      if (editedStatusName.trim() && editedStatusName !== status.name) {
                                        updateAssetStatusMutation.mutate({
                                          id: status.id,
                                          name: editedStatusName,
                                          description: editedStatusDescription,
                                          color: editedStatusColor
                                        });
                                      }
                                      setEditingStatusId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <span className="font-medium">{status.name}</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground">
                                {editingStatusId === status.id ? (
                                  <div className="flex gap-2 items-center">
                                    <Input
                                      value={editedStatusDescription}
                                      onChange={(e) => setEditedStatusDescription(e.target.value)}
                                      className="flex-1"
                                      placeholder={language === 'English' ? "Description" : "الوصف"}
                                    />
                                    <input
                                      type="color"
                                      value={editedStatusColor}
                                      onChange={(e) => setEditedStatusColor(e.target.value)}
                                      className="w-8 h-8 border rounded cursor-pointer"
                                    />
                                  </div>
                                ) : (
                                  status.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    onClick={() => {
                                      setEditingStatusId(status.id);
                                      setEditedStatusName(status.name);
                                      setEditedStatusDescription(status.description || '');
                                      setEditedStatusColor(status.color || '#3B82F6');
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteAssetStatusMutation.mutate(status.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Trash className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'English' ? 'No asset statuses found' : 'لم يتم العثور على حالات أصول'}
                    </div>
                  )}
                </TabsContent>

                {/* Service Providers Sub-tab */}
                <TabsContent value="providers" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Input
                      placeholder={language === 'English' ? "Search service providers..." : "البحث في مقدمي الخدمة..."}
                      value={serviceProviderSearch}
                      onChange={(e) => setServiceProviderSearch(e.target.value)}
                      className="max-w-sm"
                    />
                    <Dialog open={isServiceProviderDialogOpen} onOpenChange={setIsServiceProviderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          {language === 'English' ? 'Add Service Provider' : 'إضافة مقدم خدمة'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Service Provider' : 'إضافة مقدم خدمة'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label>{translations.name}</Label>
                            <Input
                              value={newProviderName}
                              onChange={(e) => setNewProviderName(e.target.value)}
                              placeholder={language === 'English' ? "Provider name" : "اسم المزود"}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{language === 'English' ? 'Contact Person' : 'جهة الاتصال'}</Label>
                            <Input
                              value={newProviderContact}
                              onChange={(e) => setNewProviderContact(e.target.value)}
                              placeholder={language === 'English' ? "Contact person" : "جهة الاتصال"}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                              <Label>{language === 'English' ? 'Phone' : 'الهاتف'}</Label>
                              <Input
                                value={newProviderPhone}
                                onChange={(e) => setNewProviderPhone(e.target.value)}
                                placeholder={language === 'English' ? "Phone" : "الهاتف"}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</Label>
                              <Input
                                value={newProviderEmail}
                                onChange={(e) => setNewProviderEmail(e.target.value)}
                                placeholder={language === 'English' ? "Email" : "البريد الإلكتروني"}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsServiceProviderDialogOpen(false)}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button onClick={handleAddServiceProvider} disabled={!newProviderName.trim()}>
                              {translations.add}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {filteredServiceProviders.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50 sticky top-0">
                            <th className="px-4 py-2 text-left">{translations.name}</th>
                            <th className="px-4 py-2 text-left">{language === 'English' ? 'Contact' : 'جهة الاتصال'}</th>
                            <th className="px-4 py-2 text-left">{language === 'English' ? 'Phone' : 'الهاتف'}</th>
                            <th className="px-4 py-2 text-right">{translations.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredServiceProviders.map((provider: any) => (
                            <tr key={provider.id} className="hover:bg-muted/25">
                              <td className="px-4 py-2 font-medium">
                                {editingProviderId === provider.id ? (
                                  <Input
                                    value={editedProviderName}
                                    onChange={(e) => setEditedProviderName(e.target.value)}
                                    className="w-full"
                                    onBlur={() => {
                                      if (editedProviderName.trim() && editedProviderName !== provider.name) {
                                        updateServiceProviderMutation.mutate({
                                          id: provider.id,
                                          name: editedProviderName,
                                          contactPerson: editedProviderContact,
                                          phone: editedProviderPhone,
                                          email: editedProviderEmail
                                        });
                                      }
                                      setEditingProviderId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  provider.name
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {editingProviderId === provider.id ? (
                                  <Input
                                    value={editedProviderContact}
                                    onChange={(e) => setEditedProviderContact(e.target.value)}
                                    className="w-full"
                                    placeholder={language === 'English' ? "Contact person" : "جهة الاتصال"}
                                  />
                                ) : (
                                  provider.contactPerson || '-'
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {editingProviderId === provider.id ? (
                                  <Input
                                    value={editedProviderPhone}
                                    onChange={(e) => setEditedProviderPhone(e.target.value)}
                                    className="w-full"
                                    placeholder={language === 'English' ? "Phone" : "الهاتف"}
                                  />
                                ) : (
                                  provider.phone || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    onClick={() => {
                                      setEditingProviderId(provider.id);
                                      setEditedProviderName(provider.name);
                                      setEditedProviderContact(provider.contactPerson || '');
                                      setEditedProviderPhone(provider.phone || '');
                                      setEditedProviderEmail(provider.email || '');
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteServiceProviderMutation.mutate(provider.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Trash className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {language === 'English' ? 'No service providers found' : 'لم يتم العثور على مقدمي خدمة'}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>


        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>{translations.emailSettings}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure email server settings for system notifications and password recovery.' 
                  : 'تكوين إعدادات خادم البريد الإلكتروني للإشعارات النظامية واستعادة كلمة المرور.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{language === 'English' ? 'SMTP Server Settings' : 'إعدادات خادم SMTP'}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailHost">{language === 'English' ? 'Email Server/Host' : 'خادم البريد الإلكتروني'}</Label>
                    <Input
                      id="emailHost"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailPort">{language === 'English' ? 'Port' : 'المنفذ'}</Label>
                    <Input
                      id="emailPort"
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      placeholder="587"
                      type="number"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailUser">{language === 'English' ? 'Username' : 'اسم المستخدم'}</Label>
                    <Input
                      id="emailUser"
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="username@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailPassword">{language === 'English' ? 'Password' : 'كلمة المرور'}</Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="emailFromAddress">{language === 'English' ? 'From Email Address' : 'عنوان البريد الإلكتروني المرسل'}</Label>
                    <Input
                      id="emailFromAddress"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                      placeholder="noreply@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emailFromName">{language === 'English' ? 'From Name' : 'اسم المرسل'}</Label>
                    <Input
                      id="emailFromName"
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      placeholder="SimpleIT System"
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveEmailSettings} disabled={updateConfigMutation.isPending} className="w-full sm:w-auto">
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

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'English' ? 'Users & Roles Management' : 'إدارة المستخدمين والأدوار'}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage system users and their roles.' 
                  : 'إدارة مستخدمي النظام وأدوارهم.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{language === 'English' ? 'User Management' : 'إدارة المستخدمين'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'English' 
                        ? 'Manage system users and their roles.' 
                        : 'إدارة مستخدمي النظام وأدوارهم.'}
                    </p>
                  </div>
                  <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {language === 'English' ? 'Add User' : 'إضافة مستخدم'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{language === 'English' ? 'Add New User' : 'إضافة مستخدم جديد'}</DialogTitle>
                        <DialogDescription>
                          {language === 'English' ? 'Create a new system user with specific role and permissions.' : 'إنشاء مستخدم نظام جديد بدور وصلاحيات محددة.'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Username' : 'اسم المستخدم'}</Label>
                          <Input 
                            value={newUserUsername} 
                            onChange={(e) => setNewUserUsername(e.target.value)}
                            placeholder={language === 'English' ? 'Enter username' : 'أدخل اسم المستخدم'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</Label>
                          <Input 
                            type="email"
                            value={newUserEmail} 
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder={language === 'English' ? 'Enter email' : 'أدخل البريد الإلكتروني'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Role' : 'الدور'}</Label>
                          <Select value={newUserRole} onValueChange={setNewUserRole}>
                            <SelectTrigger>
                              <SelectValue placeholder={language === 'English' ? 'Select role' : 'اختر الدور'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">{language === 'English' ? 'Employee' : 'موظف'}</SelectItem>
                              <SelectItem value="agent">{language === 'English' ? 'Agent' : 'وكيل'}</SelectItem>
                              <SelectItem value="manager">{language === 'English' ? 'Manager' : 'مدير'}</SelectItem>
                              <SelectItem value="admin">{language === 'English' ? 'Admin' : 'مشرف'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Password' : 'كلمة المرور'}</Label>
                          <Input 
                            type="password"
                            value={newUserPassword} 
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder={language === 'English' ? 'Enter password' : 'أدخل كلمة المرور'}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                            {language === 'English' ? 'Cancel' : 'إلغاء'}
                          </Button>
                          <Button 
                            onClick={handleAddUser}
                            disabled={createUserMutation.isPending}
                          >
                            {createUserMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {language === 'English' ? 'Adding...' : 'جارٍ الإضافة...'}
                              </>
                            ) : (
                              translations.add
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'English' ? 'Username' : 'اسم المستخدم'}</TableHead>
                        <TableHead>{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</TableHead>
                        <TableHead>{language === 'English' ? 'Role' : 'الدور'}</TableHead>
                        <TableHead>{language === 'English' ? 'Status' : 'الحالة'}</TableHead>
                        <TableHead>{translations.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {language === 'English' ? user.role : (
                                user.role === 'admin' ? 'مشرف' :
                                user.role === 'manager' ? 'مدير' :
                                user.role === 'agent' ? 'وكيل' : 'موظف'
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? 
                                (language === 'English' ? 'Active' : 'نشط') : 
                                (language === 'English' ? 'Inactive' : 'غير نشط')
                              }
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id, !user.isActive)}
                              >
                                {user.isActive ? 
                                  (language === 'English' ? 'Deactivate' : 'إلغاء تفعيل') : 
                                  (language === 'English' ? 'Activate' : 'تفعيل')
                                }
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setEditedUserUsername(user.username);
                                  setEditedUserEmail(user.email);
                                  setEditedUserRole(user.role);
                                }}
                              >
                                <Edit className="h-4 w-4" />
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

        <TabsContent value="exportImport">
          <Card>
            <CardHeader>
              <CardTitle>{translations.exportImport}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Export and import data for employees and assets.' 
                  : 'تصدير واستيراد البيانات للموظفين والأصول.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{language === 'English' ? 'Export Data' : 'تصدير البيانات'}</h3>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleExport('employees')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Export Employees' : 'تصدير الموظفين'}
                    </Button>
                    <Button 
                      onClick={() => handleExport('assets')} 
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Export Assets' : 'تصدير الأصول'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{language === 'English' ? 'Import Data' : 'استيراد البيانات'}</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === 'English' ? 'Import Employees' : 'استيراد الموظفين'}
                      </label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'employees')}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === 'English' ? 'Import Assets' : 'استيراد الأصول'}
                      </label>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileUpload(e, 'assets')}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleRemoveDemoData} variant="destructive" disabled={removeDemoDataMutation.isPending}>
                    {removeDemoDataMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'English' ? 'Removing...' : 'جارٍ الإزالة...'}
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {language === 'English' ? 'Remove Demo Data' : 'إزالة البيانات التجريبية'}
                      </>
                    )}
                  </Button>
                  
                  <Dialog open={clearLogsDialogOpen} onOpenChange={setClearLogsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {translations.clearAuditLogs}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{translations.clearAuditLogs}</DialogTitle>
                        <DialogDescription>
                          {translations.clearLogsDescription}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Clear logs older than' : 'مسح السجلات الأقدم من'}</Label>
                          <Select value={clearLogsTimeframe} onValueChange={setClearLogsTimeframe}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">{language === 'English' ? '1 Week' : 'أسبوع واحد'}</SelectItem>
                              <SelectItem value="month">{language === 'English' ? '1 Month' : 'شهر واحد'}</SelectItem>
                              <SelectItem value="year">{language === 'English' ? '1 Year' : 'سنة واحدة'}</SelectItem>
                              <SelectItem value="all">{language === 'English' ? 'All Logs' : 'جميع السجلات'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setClearLogsDialogOpen(false)}>
                            {language === 'English' ? 'Cancel' : 'إلغاء'}
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleClearAuditLogs}
                            disabled={clearLogsMutation.isPending}
                          >
                            {clearLogsMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {language === 'English' ? 'Clearing...' : 'جارٍ المسح...'}
                              </>
                            ) : (
                              translations.clear
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SystemConfig;
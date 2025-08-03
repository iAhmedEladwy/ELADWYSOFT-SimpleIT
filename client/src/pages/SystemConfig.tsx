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
import { Settings, Save, Globe, Loader2, Trash, Trash2, Plus, Edit, Check, X, Mail, Search, Users, Ticket, Package, Download, Upload, FileDown, FileUp, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';


function SystemConfig() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  // Tab state management with localStorage persistence
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('systemConfigActiveTab') || 'general';
    } catch {
      return 'general';
    }
  });
  const [preservedTab, setPreservedTab] = useState<string | null>(null);

  // Handle tab changes with persistence
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try {
      localStorage.setItem('systemConfigActiveTab', value);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Restore preserved tab after mutations
  useEffect(() => {
    if (preservedTab) {
      setActiveTab(preservedTab);
      try {
        localStorage.setItem('systemConfigActiveTab', preservedTab);
      } catch {
        // Ignore localStorage errors
      }
      setPreservedTab(null);
    }
  }, [preservedTab]);
  
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
  const [requestTypeSearch, setRequestTypeSearch] = useState('');

  // Import/Export states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeImportTab, setActiveImportTab] = useState('employees');

  // Import/Export Handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
      setImportResults(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setImportError(null);
      setImportResults(null);
    } else {
      setImportError(language === 'English' ? 'Please select a valid CSV file.' : 'يرجى اختيار ملف CSV صالح.');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleExport = async (entityType: 'employees' | 'assets' | 'tickets') => {
    try {
      const response = await fetch(`/api/export/${entityType}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: language === 'English' ? 'Export Successful' : 'تم التصدير بنجاح',
        description: language === 'English' 
          ? `${entityType} data exported successfully.` 
          : `تم تصدير بيانات ${entityType} بنجاح.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: language === 'English' ? 'Export Failed' : 'فشل التصدير',
        description: language === 'English' 
          ? 'Failed to export data. Please try again.' 
          : 'فشل في تصدير البيانات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadTemplate = async (entityType: 'employees' | 'assets' | 'tickets') => {
    try {
      const response = await fetch(`/api/${entityType}/template`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Template download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${entityType}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: language === 'English' ? 'Template Downloaded' : 'تم تنزيل القالب',
        description: language === 'English' 
          ? `${entityType} template downloaded successfully.` 
          : `تم تنزيل قالب ${entityType} بنجاح.`,
      });
    } catch (error) {
      console.error('Template download error:', error);
      toast({
        title: language === 'English' ? 'Download Failed' : 'فشل التنزيل',
        description: language === 'English' 
          ? 'Failed to download template. Please try again.' 
          : 'فشل في تنزيل القالب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(10);
    setImportError(null);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setImportProgress(30);

      const response = await fetch(`/api/${activeImportTab}/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      setImportProgress(70);

      const result = await response.json();

      setImportProgress(100);

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      setImportResults(result);
      setSelectedFile(null);

      // Clear file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast({
        title: language === 'English' ? 'Import Successful' : 'تم الاستيراد بنجاح',
        description: language === 'English' 
          ? `Imported ${result.imported} records successfully.` 
          : `تم استيراد ${result.imported} سجل بنجاح.`,
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });

    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed');
      toast({
        title: language === 'English' ? 'Import Failed' : 'فشل الاستيراد',
        description: language === 'English' 
          ? 'Failed to import data. Please check the file format and try again.' 
          : 'فشل في استيراد البيانات. يرجى التحقق من تنسيق الملف والمحاولة مرة أخرى.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

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
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState('1');
  const [newUserEmployeeId, setNewUserEmployeeId] = useState<number | null>(null);
  const [newUserManagerId, setNewUserManagerId] = useState<number | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsActive, setNewUserIsActive] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editedUserUsername, setEditedUserUsername] = useState('');
  const [editedUserEmail, setEditedUserEmail] = useState('');
  const [editedUserFirstName, setEditedUserFirstName] = useState('');
  const [editedUserLastName, setEditedUserLastName] = useState('');
  const [editedUserRole, setEditedUserRole] = useState('');
  const [editedUserAccessLevel, setEditedUserAccessLevel] = useState('1');
  const [editedUserEmployeeId, setEditedUserEmployeeId] = useState<number | null>(null);
  const [editedUserManagerId, setEditedUserManagerId] = useState<number | null>(null);
  const [editedUserPassword, setEditedUserPassword] = useState('');
  const [editedUserIsActive, setEditedUserIsActive] = useState(true);

  // Queries
  const { data: config } = useQuery<any>({
    queryKey: ['/api/system-config'],
    enabled: hasAccess(3),
  });

  const { data: customRequestTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-request-types'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: customAssetTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-types'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: customAssetBrands = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-brands'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: customAssetStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/custom-asset-statuses'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: serviceProviders = [] } = useQuery<any[]>({
    queryKey: ['/api/service-providers'],
    enabled: hasAccess(4), // Admin only
  });

  const { data: allUsers = [], refetch: refetchUsers } = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: hasAccess(4), // Admin only
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (v5 syntax)
    refetchOnWindowFocus: true, // Refetch when window gets focus
    select: (data) => {
      console.log('Raw users data from API:', data);
      return data;
    }
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

  const filteredRequestTypes = customRequestTypes.filter((requestType: any) =>
    requestType.name.toLowerCase().includes(requestTypeSearch.toLowerCase())
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
      apiRequest('/api/system-config', 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Settings updated successfully' : 'تم تحديث الإعدادات بنجاح',
      });
      // Restore preserved tab after department operations
      if (preservedTab) {
        setActiveTab(preservedTab);
        setPreservedTab(null);
      }
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
      apiRequest('/api/custom-request-types', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-request-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Request type added successfully' : 'تمت إضافة نوع الطلب بنجاح',
      });
      setNewRequestTypeName('');
      setNewRequestTypeDescription('');
      setIsRequestTypeDialogOpen(false);
      // Stay on current tab
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
      apiRequest(`/api/custom-request-types/${id}`, 'PUT', { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-request-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Request type updated successfully' : 'تم تحديث نوع الطلب بنجاح',
      });
      // Stay on current tab
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
      apiRequest(`/api/custom-request-types/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-request-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Request type deleted successfully' : 'تم حذف نوع الطلب بنجاح',
      });
      // Stay on current tab (tickets)
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
      apiRequest('/api/custom-asset-types', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type added successfully' : 'تمت إضافة نوع الأصل بنجاح',
      });
      setNewTypeName('');
      setNewTypeDescription('');
      setIsAssetTypeDialogOpen(false);
      // Stay on current tab
    },
  });

  const updateAssetTypeMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description?: string }) => 
      apiRequest(`/api/custom-asset-types/${id}`, 'PUT', { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
      // Stay on current tab
    },
  });

  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-types/${id}`, 'DELETE'),
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
      apiRequest('/api/custom-asset-brands', 'POST', data),
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
      apiRequest(`/api/custom-asset-brands/${id}`, 'PUT', { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث علامة الأصل بنجاح',
      });
    },
  });

  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-brands/${id}`, 'DELETE'),
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
      apiRequest('/api/custom-asset-statuses', 'POST', data),
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
      apiRequest(`/api/custom-asset-statuses/${id}`, 'PUT', { name, description, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status updated successfully' : 'تم تحديث حالة الأصل بنجاح',
      });
    },
  });

  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-statuses/${id}`, 'DELETE'),
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
      apiRequest('/api/service-providers', 'POST', data),
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
      apiRequest(`/api/service-providers/${id}`, 'PUT', { name, contactPerson, phone, email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Service provider updated successfully' : 'تم تحديث مزود الخدمة بنجاح',
      });
    },
  });

  const deleteServiceProviderMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/service-providers/${id}`, 'DELETE'),
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
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/users', 'POST', userData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsUserDialogOpen(false);
      setNewUserUsername('');
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserRole('employee');
      setNewUserAccessLevel('employee');
      setNewUserEmployeeId(null);
      setNewUserManagerId(null);
      setNewUserPassword('');
      setNewUserIsActive(true);
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
    mutationFn: async ({ id, userData }: { id: number; userData: any }) => {
      console.log(`Updating user ${id} with data:`, userData);
      const response = await apiRequest(`/api/users/${id}`, 'PUT', userData);
      console.log(`Update response for user ${id}:`, response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log(`Successfully updated user ${variables.id}:`, data);
      
      // Immediately update the cache with the new user data
      queryClient.setQueryData(['/api/users'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        const updatedData = oldData.map(user => 
          user.id === variables.id ? { ...user, ...data } : user
        );
        return updatedData;
      });
      
      // Only close dialog if it's an edit form update, not a status toggle
      if (editingUserId === variables.id) {
        setIsEditUserDialogOpen(false);
        setEditingUserId(null);
      }
      
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'User updated successfully' : 'تم تحديث المستخدم بنجاح',
      });
    },
    onError: (error: any) => {
      console.error('User update error:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update user' : 'فشل في تحديث المستخدم'),
        variant: 'destructive'
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/users/${userId}`, 'DELETE');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'User deleted successfully' : 'تم حذف المستخدم بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete user' : 'فشل في حذف المستخدم'),
        variant: 'destructive'
      });
    },
  });

  

  // Remove demo data mutation
  const removeDemoDataMutation = useMutation({
    mutationFn: () => apiRequest('/api/remove-demo-data', 'POST'),
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

  // Create demo data mutation
  const createDemoDataMutation = useMutation({
    mutationFn: (size: 'small' | 'medium' | 'large') => apiRequest('/api/create-demo-data', 'POST', { size }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries();
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: data.message || (language === 'English' ? 'Demo data created successfully' : 'تم إنشاء البيانات التجريبية بنجاح'),
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to create demo data' : 'فشل في إنشاء البيانات التجريبية'),
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
    
    // Preserve current tab for restoration after mutation
    setPreservedTab(activeTab);
    
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
    
    // Preserve current tab for restoration after mutation
    setPreservedTab(activeTab);
    
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
    
    // Preserve current tab for restoration after mutation
    setPreservedTab(activeTab);
    
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

  const handleAddUser = () => {
    if (!newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    
    const userData = {
      username: newUserUsername.trim(),
      email: newUserEmail.trim(),
      firstName: newUserFirstName.trim() || null,
      lastName: newUserLastName.trim() || null,
      role: newUserRole,
      employeeId: newUserEmployeeId,
      managerId: newUserManagerId,
      password: newUserPassword.trim(),
      isActive: newUserIsActive
    };
    
    createUserMutation.mutate(userData);
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditedUserUsername(user.username);
    setEditedUserEmail(user.email || '');
    setEditedUserFirstName(user.firstName || '');
    setEditedUserLastName(user.lastName || '');
    setEditedUserRole(user.role || 'employee');
    setEditedUserEmployeeId(user.employeeId);
    setEditedUserManagerId(user.managerId);
    setEditedUserPassword('');
    setEditedUserIsActive(user.isActive !== false); // Default to true if undefined
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUserId || !editedUserUsername.trim() || !editedUserEmail.trim()) return;
    
    const userData = {
      username: editedUserUsername.trim(),
      email: editedUserEmail.trim(),
      firstName: editedUserFirstName.trim() || null,
      lastName: editedUserLastName.trim() || null,
      role: editedUserRole,
      employeeId: editedUserEmployeeId,
      managerId: editedUserManagerId,
      isActive: editedUserIsActive,
      ...(editedUserPassword.trim() && { password: editedUserPassword.trim() })
    };
    
    updateUserMutation.mutate({ id: editingUserId, userData });
  };

  const handleToggleUserStatus = (userId: number, isActive: boolean) => {
    console.log(`Toggling user ${userId} status to:`, isActive);
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

  

  const translations = {
    systemConfig: language === 'English' ? 'System Configuration' : 'إعدادات النظام',
    general: language === 'English' ? 'System Defaults' : 'الافتراضيات النظام',
    email: language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني',
    assets: language === 'English' ? 'Asset Management' : 'إدارة الأصول',
    requests: language === 'English' ? 'Request Types' : 'أنواع الطلبات',
    generalSettings: language === 'English' ? 'System Defaults' : 'الافتراضيات النظام',
    ticketSettings: language === 'English' ? 'Ticket Settings' : 'إعدادات التذاكر',
    employeeSettings: language === 'English' ? 'Employees' : 'الموظفين',
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">{translations.systemConfig}</h1>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-7 lg:max-w-7xl mb-4">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            {translations.general}
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            {translations.employeeSettings}
          </TabsTrigger>
          <TabsTrigger value="assets">
            <Package className="h-4 w-4 mr-2" />
            {translations.assets}
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            {language === 'English' ? 'Tickets' : 'التذاكر'}
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            {translations.email}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {language === 'English' ? 'Users & Roles' : 'المستخدمين والأدوار'}
          </TabsTrigger>
          <TabsTrigger value="import-export">
            <Package className="h-4 w-4 mr-2" />
            {language === 'English' ? 'Import/Export' : 'استيراد/تصدير'}
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
                <div className="space-y-6">
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
                  
                  <div className="mt-6 p-6 border rounded-lg bg-muted/20 border-muted">
                    <h3 className="text-lg font-semibold mb-2">
                      {language === 'English' ? 'Demo Data Management' : 'إدارة البيانات التجريبية'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === 'English' 
                        ? 'Create sample data for testing or remove all demo data from the system.' 
                        : 'إنشاء بيانات تجريبية للاختبار أو إزالة جميع البيانات التجريبية من النظام.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        onClick={() => createDemoDataMutation.mutate('small')} 
                        variant="outline" 
                        disabled={createDemoDataMutation.isPending}
                      >
                        {createDemoDataMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {language === 'English' ? 'Create Demo Data (Small)' : 'إنشاء بيانات تجريبية (صغيرة)'}
                      </Button>
                      <Button 
                        onClick={() => createDemoDataMutation.mutate('medium')} 
                        variant="outline" 
                        disabled={createDemoDataMutation.isPending}
                      >
                        {createDemoDataMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {language === 'English' ? 'Create Demo Data (Medium)' : 'إنشاء بيانات تجريبية (متوسطة)'}
                      </Button>
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
                    </div>
                  </div>

                  
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        {/* Tickets Settings Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'English' ? 'Ticket Configuration' : 'تكوين التذاكر'}</CardTitle>
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
                    <DialogContent aria-describedby="request-type-dialog-description">
                      <DialogHeader>
                        <DialogTitle>{translations.addRequestType}</DialogTitle>
                        <DialogDescription id="request-type-dialog-description">
                          {language === 'English' 
                            ? 'Create a new request type for ticket categorization and workflow management'
                            : 'إنشاء نوع طلب جديد لتصنيف التذاكر وإدارة سير العمل'}
                        </DialogDescription>
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

                {/* Request Types Table - Always rendered */}
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
                        {filteredRequestTypes.map((requestType: any) => (
                          <tr key={requestType.id} className="hover:bg-muted/25">
                            <td className="px-4 py-2">
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
                                <span className="font-medium">{requestType.name}</span>
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
                  <div className="text-center py-8 text-muted-foreground space-y-2">
                    <p>{translations.noData}</p>
                    <p className="text-sm">
                      {language === 'English' 
                        ? 'Click "Add Request Type" above to create your first request type for ticket categorization.'
                        : 'انقر على "إضافة نوع طلب" أعلاه لإنشاء نوع الطلب الأول لتصنيف التذاكر.'}
                    </p>
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedTypeName.trim() && (editedTypeName !== type.name || editedTypeDescription !== (type.description || ''))) {
                                          updateAssetTypeMutation.mutate({
                                            id: type.id,
                                            name: editedTypeName,
                                            description: editedTypeDescription
                                          });
                                        }
                                        setEditingTypeId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingTypeId(null);
                                        setEditedTypeName(type.name);
                                        setEditedTypeDescription(type.description || '');
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedTypeName.trim() && (editedTypeName !== type.name || editedTypeDescription !== (type.description || ''))) {
                                          updateAssetTypeMutation.mutate({
                                            id: type.id,
                                            name: editedTypeName,
                                            description: editedTypeDescription
                                          });
                                        }
                                        setEditingTypeId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingTypeId(null);
                                        setEditedTypeName(type.name);
                                        setEditedTypeDescription(type.description || '');
                                      }
                                    }}
                                  />
                                ) : (
                                  type.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  {editingTypeId === type.id ? (
                                    <>
                                      <Button
                                        onClick={() => {
                                          if (editedTypeName.trim() && (editedTypeName !== type.name || editedTypeDescription !== (type.description || ''))) {
                                            updateAssetTypeMutation.mutate({
                                              id: type.id,
                                              name: editedTypeName,
                                              description: editedTypeDescription
                                            });
                                          }
                                          setEditingTypeId(null);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!editedTypeName.trim()}
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setEditingTypeId(null);
                                          setEditedTypeName(type.name);
                                          setEditedTypeDescription(type.description || '');
                                        }}
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
                                    </>
                                  )}
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedBrandName.trim() && (editedBrandName !== brand.name || editedBrandDescription !== (brand.description || ''))) {
                                          updateAssetBrandMutation.mutate({
                                            id: brand.id,
                                            name: editedBrandName,
                                            description: editedBrandDescription
                                          });
                                        }
                                        setEditingBrandId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingBrandId(null);
                                        setEditedBrandName(brand.name);
                                        setEditedBrandDescription(brand.description || '');
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedBrandName.trim() && (editedBrandName !== brand.name || editedBrandDescription !== (brand.description || ''))) {
                                          updateAssetBrandMutation.mutate({
                                            id: brand.id,
                                            name: editedBrandName,
                                            description: editedBrandDescription
                                          });
                                        }
                                        setEditingBrandId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingBrandId(null);
                                        setEditedBrandName(brand.name);
                                        setEditedBrandDescription(brand.description || '');
                                      }
                                    }}
                                  />
                                ) : (
                                  brand.description || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  {editingBrandId === brand.id ? (
                                    <>
                                      <Button
                                        onClick={() => {
                                          if (editedBrandName.trim() && (editedBrandName !== brand.name || editedBrandDescription !== (brand.description || ''))) {
                                            updateAssetBrandMutation.mutate({
                                              id: brand.id,
                                              name: editedBrandName,
                                              description: editedBrandDescription
                                            });
                                          }
                                          setEditingBrandId(null);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!editedBrandName.trim()}
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setEditingBrandId(null);
                                          setEditedBrandName(brand.name);
                                          setEditedBrandDescription(brand.description || '');
                                        }}
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
                                    </>
                                  )}
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedStatusName.trim() && (editedStatusName !== status.name || editedStatusDescription !== (status.description || '') || editedStatusColor !== status.color)) {
                                          updateAssetStatusMutation.mutate({
                                            id: status.id,
                                            name: editedStatusName,
                                            description: editedStatusDescription,
                                            color: editedStatusColor
                                          });
                                        }
                                        setEditingStatusId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingStatusId(null);
                                        setEditedStatusName(status.name);
                                        setEditedStatusDescription(status.description || '');
                                        setEditedStatusColor(status.color || '#3B82F6');
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
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          if (editedStatusName.trim() && (editedStatusName !== status.name || editedStatusDescription !== (status.description || '') || editedStatusColor !== status.color)) {
                                            updateAssetStatusMutation.mutate({
                                              id: status.id,
                                              name: editedStatusName,
                                              description: editedStatusDescription,
                                              color: editedStatusColor
                                            });
                                          }
                                          setEditingStatusId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingStatusId(null);
                                          setEditedStatusName(status.name);
                                          setEditedStatusDescription(status.description || '');
                                          setEditedStatusColor(status.color || '#3B82F6');
                                        }
                                      }}
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
                                  {editingStatusId === status.id ? (
                                    <>
                                      <Button
                                        onClick={() => {
                                          if (editedStatusName.trim() && (editedStatusName !== status.name || editedStatusDescription !== (status.description || '') || editedStatusColor !== status.color)) {
                                            updateAssetStatusMutation.mutate({
                                              id: status.id,
                                              name: editedStatusName,
                                              description: editedStatusDescription,
                                              color: editedStatusColor
                                            });
                                          }
                                          setEditingStatusId(null);
                                        }}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!editedStatusName.trim()}
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setEditingStatusId(null);
                                          setEditedStatusName(status.name);
                                          setEditedStatusDescription(status.description || '');
                                          setEditedStatusColor(status.color || '#3B82F6');
                                        }}
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
                                    </>
                                  )}
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedProviderName.trim() && (editedProviderName !== provider.name || editedProviderContact !== (provider.contactPerson || '') || editedProviderPhone !== (provider.phone || '') || editedProviderEmail !== (provider.email || ''))) {
                                          updateServiceProviderMutation.mutate({
                                            id: provider.id,
                                            name: editedProviderName,
                                            contactPerson: editedProviderContact,
                                            phone: editedProviderPhone,
                                            email: editedProviderEmail
                                          });
                                        }
                                        setEditingProviderId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingProviderId(null);
                                        setEditedProviderName(provider.name);
                                        setEditedProviderContact(provider.contactPerson || '');
                                        setEditedProviderPhone(provider.phone || '');
                                        setEditedProviderEmail(provider.email || '');
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedProviderName.trim() && (editedProviderName !== provider.name || editedProviderContact !== (provider.contactPerson || '') || editedProviderPhone !== (provider.phone || '') || editedProviderEmail !== (provider.email || ''))) {
                                          updateServiceProviderMutation.mutate({
                                            id: provider.id,
                                            name: editedProviderName,
                                            contactPerson: editedProviderContact,
                                            phone: editedProviderPhone,
                                            email: editedProviderEmail
                                          });
                                        }
                                        setEditingProviderId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingProviderId(null);
                                        setEditedProviderName(provider.name);
                                        setEditedProviderContact(provider.contactPerson || '');
                                        setEditedProviderPhone(provider.phone || '');
                                        setEditedProviderEmail(provider.email || '');
                                      }
                                    }}
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
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editedProviderName.trim() && (editedProviderName !== provider.name || editedProviderContact !== (provider.contactPerson || '') || editedProviderPhone !== (provider.phone || '') || editedProviderEmail !== (provider.email || ''))) {
                                          updateServiceProviderMutation.mutate({
                                            id: provider.id,
                                            name: editedProviderName,
                                            contactPerson: editedProviderContact,
                                            phone: editedProviderPhone,
                                            email: editedProviderEmail
                                          });
                                        }
                                        setEditingProviderId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingProviderId(null);
                                        setEditedProviderName(provider.name);
                                        setEditedProviderContact(provider.contactPerson || '');
                                        setEditedProviderPhone(provider.phone || '');
                                        setEditedProviderEmail(provider.email || '');
                                      }
                                    }}
                                  />
                                ) : (
                                  provider.phone || '-'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  {editingProviderId === provider.id ? (
                                    <>
                                      <Button
                                        onClick={() => {
                                          if (editedProviderName.trim() && (editedProviderName !== provider.name || editedProviderContact !== (provider.contactPerson || '') || editedProviderPhone !== (provider.phone || '') || editedProviderEmail !== (provider.email || ''))) {
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
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!editedProviderName.trim()}
                                      >
                                        <Check className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setEditingProviderId(null);
                                          setEditedProviderName(provider.name);
                                          setEditedProviderContact(provider.contactPerson || '');
                                          setEditedProviderPhone(provider.phone || '');
                                          setEditedProviderEmail(provider.email || '');
                                        }}
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
                                    </>
                                  )}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[22px] font-bold">{language === 'English' ? 'User Management' : 'إدارة المستخدمين'}</h3>
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
                            {language === 'English' ? 'Create a new system user with username, email, and access level. Choose the appropriate access level based on the user\'s responsibilities.' : 'إنشاء مستخدم نظام جديد باسم مستخدم وبريد إلكتروني ومستوى وصول. اختر مستوى الوصول المناسب بناءً على مسؤوليات المستخدم.'}
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
                            <p className="text-xs text-muted-foreground">
                              {language === 'English' ? 'The unique identifier for this user' : 'المعرف الفريد لهذا المستخدم'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</Label>
                            <Input 
                              type="email"
                              value={newUserEmail} 
                              onChange={(e) => setNewUserEmail(e.target.value)}
                              placeholder={language === 'English' ? 'Enter email' : 'أدخل البريد الإلكتروني'}
                            />
                            <p className="text-xs text-muted-foreground">
                              {language === 'English' ? "The user's email address" : 'عنوان البريد الإلكتروني للمستخدم'}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'New Password' : 'كلمة المرور الجديدة'}</Label>
                            <Input 
                              type="password"
                              value={newUserPassword} 
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              placeholder={language === 'English' ? 'Enter password' : 'أدخل كلمة المرور'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Role' : 'الدور'}</Label>
                            <Select value={newUserRole} onValueChange={setNewUserRole}>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select role' : 'اختر الدور'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">{language === 'English' ? 'Admin (Full Access)' : 'مشرف (وصول كامل)'}</SelectItem>
                                <SelectItem value="manager">{language === 'English' ? 'Manager (Supervisory)' : 'مدير (إشرافي)'}</SelectItem>
                                <SelectItem value="agent">{language === 'English' ? 'Agent (Tickets & Assets)' : 'وكيل (التذاكر والأصول)'}</SelectItem>
                                <SelectItem value="employee">{language === 'English' ? 'Employee (Basic Access)' : 'موظف (وصول أساسي)'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Status' : 'الحالة'}</Label>
                            <Select value={newUserIsActive ? 'active' : 'inactive'} onValueChange={(value) => setNewUserIsActive(value === 'active')}>
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select status' : 'اختر الحالة'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">{language === 'English' ? 'Active' : 'نشط'}</SelectItem>
                                <SelectItem value="inactive">{language === 'English' ? 'Inactive' : 'غير نشط'}</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {language === 'English' ? 'Active users can log in and access the system' : 'المستخدمون النشطون يمكنهم تسجيل الدخول والوصول إلى النظام'}
                            </p>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button 
                              onClick={handleAddUser}
                              disabled={createUserMutation.isPending || !newUserUsername.trim() || !newUserEmail.trim() || !newUserPassword.trim()}
                            >
                              {createUserMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {language === 'English' ? 'Adding...' : 'جارٍ الإضافة...'}
                                </>
                              ) : (
                                language === 'English' ? 'Add User' : 'إضافة مستخدم'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Action Buttons for Selected User */}
                  {selectedUserId && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-xs text-blue-700 font-medium">
                          {language === 'English' ? 'Selected User Actions:' : 'إجراءات المستخدم المحدد:'}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const user = allUsers.find(u => u.id === selectedUserId);
                            if (user) handleToggleUserStatus(user.id, !user.isActive);
                          }}
                          disabled={updateUserMutation.isPending}
                          className="h-8"
                        >
                          {updateUserMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            (() => {
                              const user = allUsers.find(u => u.id === selectedUserId);
                              return user?.isActive ? 
                                (language === 'English' ? 'Deactivate' : 'إلغاء تفعيل') : 
                                (language === 'English' ? 'Activate' : 'تفعيل');
                            })()
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const user = allUsers.find(u => u.id === selectedUserId);
                            if (user) handleEditUser(user);
                          }}
                          className="h-8"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          {language === 'English' ? 'Edit' : 'تعديل'}
                        </Button>
                        {selectedUserId !== 1 && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const user = allUsers.find(u => u.id === selectedUserId);
                              if (user && window.confirm(language === 'English' ? `Are you sure you want to delete user "${user.username}"?` : `هل أنت متأكد من حذف المستخدم "${user.username}"؟`)) {
                                deleteUserMutation.mutate(user.id);
                                setSelectedUserId(null);
                              }
                            }}
                            className="h-8 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Trash className="h-3 w-3 mr-1" />
                                {language === 'English' ? 'Delete' : 'حذف'}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="border rounded-lg bg-white shadow-sm">
                  {!allUsers?.length ? (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {language === 'English' ? 'No Users Found' : 'لم يتم العثور على مستخدمين'}
                      </h3>
                      <p className="text-gray-600">
                        {language === 'English' ? 'Get started by adding your first user.' : 'ابدأ بإضافة أول مستخدم.'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{language === 'English' ? 'Username' : 'اسم المستخدم'}</TableHead>
                          <TableHead className="font-semibold">{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</TableHead>
                          <TableHead className="font-semibold">{language === 'English' ? 'Role' : 'الدور'}</TableHead>
                          <TableHead className="font-semibold">{language === 'English' ? 'Status' : 'الحالة'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allUsers.map((user: any) => (
                          <TableRow 
                            key={user.id} 
                            className={`cursor-pointer transition-colors ${
                              selectedUserId === user.id 
                                ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedUserId(user.id === selectedUserId ? null : user.id)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {selectedUserId === user.id && (
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                )}
                                {user.username}
                                {user.id === 1 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {language === 'English' ? 'System Admin' : 'مشرف النظام'}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`${
                                  user.role === 'admin' ? 'border-red-200 text-red-700 bg-red-50' :
                                  user.role === 'manager' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                  user.role === 'agent' ? 'border-green-200 text-green-700 bg-green-50' :
                                  'border-gray-200 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {language === 'English' ? user.role : (
                                  user.role === 'admin' ? 'مشرف' :
                                  user.role === 'manager' ? 'مدير' :
                                  user.role === 'agent' ? 'وكيل' : 'موظف'
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.isActive ? "default" : "secondary"}
                                className={`${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}
                              >
                                {user.isActive ? 
                                  (language === 'English' ? 'Active' : 'نشط') : 
                                  (language === 'English' ? 'Inactive' : 'غير نشط')
                                }
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Edit User Dialog */}
                <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{language === 'English' ? 'Edit User' : 'تعديل المستخدم'}</DialogTitle>
                      <DialogDescription>
                        {language === 'English' ? 'Update user information and settings. Leave password field blank to keep current password.' : 'تحديث معلومات المستخدم والإعدادات. اترك حقل كلمة المرور فارغاً للاحتفاظ بكلمة المرور الحالية.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'Username' : 'اسم المستخدم'}</Label>
                        <Input 
                          value={editedUserUsername} 
                          onChange={(e) => setEditedUserUsername(e.target.value)}
                          placeholder={language === 'English' ? 'Enter username' : 'أدخل اسم المستخدم'}
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' ? 'The unique identifier for this user' : 'المعرف الفريد لهذا المستخدم'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</Label>
                        <Input 
                          type="email"
                          value={editedUserEmail} 
                          onChange={(e) => setEditedUserEmail(e.target.value)}
                          placeholder={language === 'English' ? 'Enter email' : 'أدخل البريد الإلكتروني'}
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' ? "The user's email address" : 'عنوان البريد الإلكتروني للمستخدم'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'New Password' : 'كلمة المرور الجديدة'}</Label>
                        <Input 
                          type="password"
                          value={editedUserPassword} 
                          onChange={(e) => setEditedUserPassword(e.target.value)}
                          placeholder={language === 'English' ? 'Enter new password' : 'أدخل كلمة مرور جديدة'}
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' ? 'Leave blank to keep current password' : 'اتركه فارغاً للاحتفاظ بكلمة المرور الحالية'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'Role' : 'الدور'}</Label>
                        <Select value={editedUserRole} onValueChange={setEditedUserRole}>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'English' ? 'Select role' : 'اختر الدور'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{language === 'English' ? 'Admin (Full Access)' : 'مشرف (وصول كامل)'}</SelectItem>
                            <SelectItem value="manager">{language === 'English' ? 'Manager (Supervisory)' : 'مدير (إشرافي)'}</SelectItem>
                            <SelectItem value="agent">{language === 'English' ? 'Agent (Tickets & Assets)' : 'وكيل (التذاكر والأصول)'}</SelectItem>
                            <SelectItem value="employee">{language === 'English' ? 'Employee (Basic Access)' : 'موظف (وصول أساسي)'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'Status' : 'الحالة'}</Label>
                        <Select value={editedUserIsActive ? 'active' : 'inactive'} onValueChange={(value) => setEditedUserIsActive(value === 'active')}>
                          <SelectTrigger>
                            <SelectValue placeholder={language === 'English' ? 'Select status' : 'اختر الحالة'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{language === 'English' ? 'Active' : 'نشط'}</SelectItem>
                            <SelectItem value="inactive">{language === 'English' ? 'Inactive' : 'غير نشط'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' ? 'Active users can log in and access the system' : 'المستخدمون النشطون يمكنهم تسجيل الدخول والوصول إلى النظام'}
                        </p>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                          {language === 'English' ? 'Cancel' : 'إلغاء'}
                        </Button>
                        <Button 
                          onClick={handleUpdateUser}
                          disabled={updateUserMutation.isPending || !editedUserUsername.trim() || !editedUserEmail.trim()}
                        >
                          {updateUserMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {language === 'English' ? 'Updating...' : 'جارٍ التحديث...'}
                            </>
                          ) : (
                            language === 'English' ? 'Update' : 'تحديث'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {language === 'English' ? 'Data Import & Export' : 'استيراد وتصدير البيانات'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Import and export your system data in CSV format. Use templates to ensure proper formatting.' 
                    : 'استيراد وتصدير بيانات النظام بتنسيق CSV. استخدم القوالب لضمان التنسيق المناسب.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeImportTab} onValueChange={setActiveImportTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="employees">
                      <Users className="h-4 w-4 mr-2" />
                      {language === 'English' ? 'Employees' : 'الموظفين'}
                    </TabsTrigger>
                    <TabsTrigger value="assets">
                      <Package className="h-4 w-4 mr-2" />
                      {language === 'English' ? 'Assets' : 'الأصول'}
                    </TabsTrigger>
                    <TabsTrigger value="tickets">
                      <Ticket className="h-4 w-4 mr-2" />
                      {language === 'English' ? 'Tickets' : 'التذاكر'}
                    </TabsTrigger>
                  </TabsList>

                  {/* Export Section */}
                  <div className="mt-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Export Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Download className="h-5 w-5 text-green-600" />
                            {language === 'English' ? 'Export Data' : 'تصدير البيانات'}
                          </CardTitle>
                          <CardDescription>
                            {language === 'English' 
                              ? 'Download your data as CSV files for backup or reporting.' 
                              : 'تنزيل بياناتك كملفات CSV للنسخ الاحتياطي أو إعداد التقارير.'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <Button 
                              onClick={() => handleDownloadTemplate(activeImportTab as 'employees' | 'assets' | 'tickets')}
                              variant="outline" 
                              className="w-full"
                            >
                              <FileDown className="h-4 w-4 mr-2" />
                              {language === 'English' 
                                ? `Download ${activeImportTab.charAt(0).toUpperCase() + activeImportTab.slice(1)} Template` 
                                : `تنزيل قالب ${activeImportTab}`}
                            </Button>
                            <Button 
                              onClick={() => handleExport(activeImportTab as 'employees' | 'assets' | 'tickets')}
                              className="w-full"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {language === 'English' 
                                ? `Export ${activeImportTab.charAt(0).toUpperCase() + activeImportTab.slice(1)} Data` 
                                : `تصدير بيانات ${activeImportTab}`}
                            </Button>
                          </div>
                          
                          <div className="pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              {language === 'English' 
                                ? 'Template files include sample data and proper column headers for easy importing.' 
                                : 'ملفات القوالب تتضمن بيانات عينة وعناوين أعمدة مناسبة لسهولة الاستيراد.'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Import Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Upload className="h-5 w-5 text-blue-600" />
                            {language === 'English' ? 'Import Data' : 'استيراد البيانات'}
                          </CardTitle>
                          <CardDescription>
                            {language === 'English' 
                              ? 'Upload CSV files to import data into your system.' 
                              : 'رفع ملفات CSV لاستيراد البيانات إلى النظام.'}
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

                          {/* Import Progress */}
                          {isImporting && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{language === 'English' ? 'Importing...' : 'جاري الاستيراد...'}</span>
                                <span>{importProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${importProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Import Button */}
                          <Button 
                            onClick={handleImport}
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
                                {language === 'English' 
                                  ? `Import ${activeImportTab.charAt(0).toUpperCase() + activeImportTab.slice(1)}` 
                                  : `استيراد ${activeImportTab}`}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Import Results */}
                    {importResults && (
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="h-5 w-5" />
                            {language === 'English' ? 'Import Successful' : 'تم الاستيراد بنجاح'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm text-green-700">
                              {language === 'English' 
                                ? `Successfully imported ${importResults.imported} records.` 
                                : `تم استيراد ${importResults.imported} سجل بنجاح.`}
                            </p>
                            {importResults.errors && importResults.errors.length > 0 && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm font-medium text-yellow-800 mb-2">
                                  {language === 'English' ? 'Warnings:' : 'تحذيرات:'}
                                </p>
                                <ul className="text-xs text-yellow-700 space-y-1">
                                  {importResults.errors.slice(0, 5).map((error: any, index: number) => (
                                    <li key={index}>• {typeof error === 'string' ? error : JSON.stringify(error)}</li>
                                  ))}
                                  {importResults.errors.length > 5 && (
                                    <li>
                                      {language === 'English' 
                                        ? `... and ${importResults.errors.length - 5} more` 
                                        : `... و ${importResults.errors.length - 5} أخرى`}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Import Errors */}
                    {importError && (
                      <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-5 w-5" />
                            {language === 'English' ? 'Import Failed' : 'فشل الاستيراد'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-red-700">{importError}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Import Instructions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === 'English' ? 'Import Guidelines' : 'إرشادات الاستيراد'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              {language === 'English' ? 'File Requirements:' : 'متطلبات الملف:'}
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• {language === 'English' ? 'CSV format only' : 'تنسيق CSV فقط'}</li>
                              <li>• {language === 'English' ? 'Maximum file size: 10MB' : 'الحد الأقصى لحجم الملف: 10 ميجابايت'}</li>
                              <li>• {language === 'English' ? 'UTF-8 encoding recommended' : 'يُنصح بترميز UTF-8'}</li>
                              <li>• {language === 'English' ? 'First row must contain column headers' : 'الصف الأول يجب أن يحتوي على عناوين الأعمدة'}</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">
                              {language === 'English' ? 'Data Validation:' : 'التحقق من البيانات:'}
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• {language === 'English' ? 'Required fields must be filled' : 'الحقول المطلوبة يجب ملؤها'}</li>
                              <li>• {language === 'English' ? 'Email addresses must be valid' : 'عناوين البريد الإلكتروني يجب أن تكون صحيحة'}</li>
                              <li>• {language === 'English' ? 'Date fields must be in YYYY-MM-DD format' : 'حقول التاريخ يجب أن تكون بتنسيق YYYY-MM-DD'}</li>
                              <li>• {language === 'English' ? 'Duplicate IDs will be rejected' : 'المعرفات المكررة سيتم رفضها'}</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">
                              {language === 'English' ? 'Best Practices:' : 'أفضل الممارسات:'}
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                              <li>• {language === 'English' ? 'Download and use the provided template' : 'تنزيل واستخدام القالب المُوفر'}</li>
                              <li>• {language === 'English' ? 'Test with small files first' : 'اختبار بملفات صغيرة أولاً'}</li>
                              <li>• {language === 'English' ? 'Backup your data before importing' : 'عمل نسخة احتياطية من البيانات قبل الاستيراد'}</li>
                              <li>• {language === 'English' ? 'Review validation errors carefully' : 'مراجعة أخطاء التحقق بعناية'}</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        
      </Tabs>
    </div>
  );
}

export default SystemConfig;
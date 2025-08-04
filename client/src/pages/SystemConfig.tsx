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
import { FieldMappingInterface } from '@/components/import/FieldMappingInterface';

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
  
  // Import/Export states from current working version
  const [selectedDataType, setSelectedDataType] = useState<string>('employees');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);
  const [importError, setImportError] = useState<string>('');
  const [parsedFileData, setParsedFileData] = useState<any[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [showFieldMapping, setShowFieldMapping] = useState(false);

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

  // Data type options for import/export
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
      icon: Package,
      color: 'text-green-600'
    },
    { 
      value: 'tickets', 
      label: { English: 'Tickets', Arabic: 'التذاكر' },
      description: { English: 'Manage support tickets and requests', Arabic: 'إدارة تذاكر الدعم والطلبات' },
      icon: Ticket,
      color: 'text-orange-600'
    }
  ];

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
      console.error('Failed to update user:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update user' : 'فشل في تحديث المستخدم'),
        variant: 'destructive'
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Deleting user ${id}`);
      const response = await apiRequest(`/api/users/${id}`, 'DELETE');
      console.log(`Delete response for user ${id}:`, response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log(`Successfully deleted user ${variables}:`, data);
      
      // Remove user from cache
      queryClient.setQueryData(['/api/users'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter(user => user.id !== variables);
      });
      
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'User deleted successfully' : 'تم حذف المستخدم بنجاح',
      });
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete user' : 'فشل في حذف المستخدم'),
        variant: 'destructive'
      });
    }
  });

  // Import/Export functions from current working version
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type === 'text/csv') {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0] && files[0].type === 'text/csv') {
      setSelectedFile(files[0]);
    }
  };

  const handleDownloadTemplate = async (type: 'employees' | 'assets' | 'tickets') => {
    try {
      const response = await fetch(`/api/import/template/${type}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to download template' : 'فشل تحميل القالب',
        variant: 'destructive'
      });
    }
  };

  const handleExport = async (type: 'employees' | 'assets' | 'tickets') => {
    try {
      const response = await fetch(`/api/export/${type}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to export data' : 'فشل تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return { headers, data };
  };

  const handleFileImport = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        const { headers, data } = parseCSV(csvText);
        
        setParsedFileData(data);
        setFileColumns(headers);
        setShowFieldMapping(true);
      } catch (error) {
        console.error('File parsing error:', error);
        setImportError(language === 'English' ? 'Failed to parse CSV file' : 'فشل تحليل ملف CSV');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingComplete = async (mappedData: any[], mapping: Record<string, string>) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportError('');
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('entityType', selectedDataType);
      formData.append('data', JSON.stringify(mappedData));
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetch('/api/import/process', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const results = await response.json();
      setImportResults(results);
      setShowFieldMapping(false);
      setSelectedFile(null);
      
      toast({
        title: language === 'English' ? 'Import Complete' : 'اكتمل الاستيراد',
        description: language === 'English' 
          ? `Successfully imported ${results.imported} of ${results.total} records` 
          : `تم استيراد ${results.imported} من ${results.total} سجل بنجاح`,
      });

    } catch (error: any) {
      console.error('Import error:', error);
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      setImportProgress(100);
    }
  };

  const handleMappingCancel = () => {
    setShowFieldMapping(false);
    setParsedFileData([]);
    setFileColumns([]);
  };

  // Handler functions for various operations
  const handleSaveConfig = () => {
    const configData = {
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments,
      emailHost,
      emailPort: emailPort ? parseInt(emailPort) : 587,
      emailUser,
      emailPassword,
      emailFromAddress,
      emailFromName,
      emailSecure,
    };
    updateConfigMutation.mutate(configData);
  };

  const handleAddUser = () => {
    const userData = {
      username: newUserUsername.trim(),
      email: newUserEmail.trim(),
      firstName: newUserFirstName.trim(),
      lastName: newUserLastName.trim(),
      role: newUserRole,
      employeeId: newUserEmployeeId,
      managerId: newUserManagerId,
      password: newUserPassword,
      isActive: newUserIsActive,
    };
    createUserMutation.mutate(userData);
  };

  const handleEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditedUserUsername(user.username);
    setEditedUserEmail(user.email);
    setEditedUserFirstName(user.firstName || '');
    setEditedUserLastName(user.lastName || '');
    setEditedUserRole(user.role);
    setEditedUserEmployeeId(user.employeeId);
    setEditedUserManagerId(user.managerId);
    setEditedUserPassword('');
    setEditedUserIsActive(user.isActive);
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUserId) return;
    
    const userData: any = {
      username: editedUserUsername.trim(),
      email: editedUserEmail.trim(),
      firstName: editedUserFirstName.trim(),
      lastName: editedUserLastName.trim(),
      role: editedUserRole,
      employeeId: editedUserEmployeeId,
      managerId: editedUserManagerId,
      isActive: editedUserIsActive,
    };
    
    // Only include password if it's provided
    if (editedUserPassword.trim()) {
      userData.password = editedUserPassword.trim();
    }
    
    updateUserMutation.mutate({ id: editingUserId, userData });
  };

  const handleToggleUserStatus = (userId: number, newStatus: boolean) => {
    const userData = { isActive: newStatus };
    updateUserMutation.mutate({ id: userId, userData });
  };

  // If user doesn't have access to system configuration
  if (!hasAccess(3)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {language === 'English' ? 'Access Denied' : 'تم رفض الوصول'}
          </h2>
          <p className="text-gray-600">
            {language === 'English' 
              ? 'You do not have permission to access system configuration.' 
              : 'ليس لديك إذن للوصول إلى إعدادات النظام.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            {language === 'English' ? 'System Configuration' : 'إعدادات النظام'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'English' 
              ? 'Configure system-wide settings, manage custom fields, and control user access.'
              : 'تكوين إعدادات النظام، إدارة الحقول المخصصة، والتحكم في وصول المستخدمين.'}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          {language === 'English' ? 'العربية' : 'English'}
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'General' : 'عام'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'Employees' : 'الموظفون'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'Assets' : 'الأصول'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'Tickets' : 'التذاكر'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'Email' : 'البريد'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'Users' : 'المستخدمون'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'English' ? 'Import/Export' : 'استيراد/تصدير'}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'English' ? 'System Defaults' : 'الإعدادات الافتراضية'}</CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure basic system settings and ID prefixes.'
                  : 'تكوين الإعدادات الأساسية وبادئات المعرفات.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل'}</Label>
                  <Input
                    value={assetIdPrefix}
                    onChange={(e) => setAssetIdPrefix(e.target.value)}
                    placeholder="AST-"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'English' ? 'Used for automatic asset ID generation' : 'يستخدم لتوليد معرفات الأصول تلقائياً'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف'}</Label>
                  <Input
                    value={empIdPrefix}
                    onChange={(e) => setEmpIdPrefix(e.target.value)}
                    placeholder="EMP-"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'English' ? 'Used for automatic employee ID generation' : 'يستخدم لتوليد معرفات الموظفين تلقائياً'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة'}</Label>
                  <Input
                    value={ticketIdPrefix}
                    onChange={(e) => setTicketIdPrefix(e.target.value)}
                    placeholder="TKT-"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'English' ? 'Used for automatic ticket ID generation' : 'يستخدم لتوليد معرفات التذاكر تلقائياً'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Default Currency' : 'العملة الافتراضية'}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'System Language' : 'لغة النظام'}</Label>
                  <Select value={language} onValueChange={() => toggleLanguage()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Arabic">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Save Settings' : 'حفظ الإعدادات'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab - Working version preserved */}
        <TabsContent value="import-export" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {language === 'English' ? 'Import & Export Data' : 'استيراد وتصدير البيانات'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' 
                    ? 'Import data from CSV files or export existing data for backup and analysis.'
                    : 'استيراد البيانات من ملفات CSV أو تصدير البيانات الموجودة للنسخ الاحتياطي والتحليل.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Select Data Type' : 'اختر نوع البيانات'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {DATA_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedDataType === option.value;
                      
                      return (
                        <Card
                          key={option.value}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'ring-2 ring-blue-500 shadow-md bg-blue-50' 
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
                                <Check className="h-5 w-5 text-blue-600" />
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
                          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
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
                              <Upload className="h-4 w-4 text-blue-600" />
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
                            <Download className="h-4 w-4 mr-2" />
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

                    {/* Import Results */}
                    {importResults && (
                      <Card className="mt-4">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-4">
                            <Check className="h-5 w-5 text-green-600" />
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
                            <X className="h-5 w-5 text-red-600" />
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

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'English' ? 'Employee Configuration' : 'تكوين الموظفين'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage employee departments, custom fields, and organizational settings.'
                  : 'إدارة أقسام الموظفين والحقول المخصصة وإعدادات المؤسسة.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Department Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Department Management' : 'إدارة الأقسام'}
                  </h3>
                  <Button
                    onClick={() => {
                      const newDept = prompt(language === 'English' ? 'Enter department name:' : 'أدخل اسم القسم:');
                      if (newDept && newDept.trim()) {
                        const updatedDepartments = [...departments, newDept.trim()];
                        setDepartments(updatedDepartments);
                        setPreservedTab('employees');
                      }
                    }}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {language === 'English' ? 'Add Department' : 'إضافة قسم'}
                  </Button>
                </div>
                
                <div className="border rounded-lg bg-white shadow-sm">
                  {!departments?.length ? (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {language === 'English' ? 'No Departments' : 'لا توجد أقسام'}
                      </h3>
                      <p className="text-gray-600">
                        {language === 'English' ? 'Add departments to organize your employees.' : 'أضف أقساماً لتنظيم موظفيك.'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{language === 'English' ? 'Department Name' : 'اسم القسم'}</TableHead>
                          <TableHead className="font-semibold w-32">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departments.map((dept: string, index: number) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell>
                              {editingDeptIndex === index ? (
                                <Input
                                  value={editedDeptName}
                                  onChange={(e) => setEditedDeptName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      const updatedDepartments = [...departments];
                                      updatedDepartments[index] = editedDeptName.trim();
                                      setDepartments(updatedDepartments);
                                      setEditingDeptIndex(null);
                                      setEditedDeptName('');
                                      setPreservedTab('employees');
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-medium">{dept}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {editingDeptIndex === index ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedDepartments = [...departments];
                                        updatedDepartments[index] = editedDeptName.trim();
                                        setDepartments(updatedDepartments);
                                        setEditingDeptIndex(null);
                                        setEditedDeptName('');
                                        setPreservedTab('employees');
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingDeptIndex(null);
                                        setEditedDeptName('');
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingDeptIndex(index);
                                        setEditedDeptName(dept);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm(language === 'English' ? `Delete department "${dept}"?` : `حذف القسم "${dept}"؟`)) {
                                          const updatedDepartments = departments.filter((_, i) => i !== index);
                                          setDepartments(updatedDepartments);
                                          setPreservedTab('employees');
                                        }
                                      }}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Save Settings' : 'حفظ الإعدادات'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {language === 'English' ? 'Asset Configuration' : 'تكوين الأصول'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage asset types, brands, statuses, and service providers for comprehensive asset tracking.'
                  : 'إدارة أنواع الأصول والعلامات التجارية والحالات ومقدمي الخدمات لتتبع شامل للأصول.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Asset Types Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Asset Types' : 'أنواع الأصول'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={language === 'English' ? 'Search types...' : 'البحث في الأنواع...'}
                        value={assetTypeSearch}
                        onChange={(e) => setAssetTypeSearch(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Dialog open={isAssetTypeDialogOpen} onOpenChange={setIsAssetTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {language === 'English' ? 'Add Type' : 'إضافة نوع'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Asset Type' : 'إضافة نوع أصل'}</DialogTitle>
                          <DialogDescription>
                            {language === 'English' ? 'Create a new asset type for classification.' : 'إنشاء نوع أصل جديد للتصنيف.'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Type Name' : 'اسم النوع'}</Label>
                            <Input 
                              value={newTypeName} 
                              onChange={(e) => setNewTypeName(e.target.value)}
                              placeholder={language === 'English' ? 'e.g., Laptop, Desktop, Server' : 'مثال: لابتوب، سطح مكتب، خادم'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Description' : 'الوصف'}</Label>
                            <Input 
                              value={newTypeDescription} 
                              onChange={(e) => setNewTypeDescription(e.target.value)}
                              placeholder={language === 'English' ? 'Brief description...' : 'وصف مختصر...'}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsAssetTypeDialogOpen(false)}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button onClick={() => {
                              // Handle add asset type logic here
                              setNewTypeName('');
                              setNewTypeDescription('');
                              setIsAssetTypeDialogOpen(false);
                            }}>
                              {language === 'English' ? 'Add' : 'إضافة'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="border rounded-lg bg-white shadow-sm">
                  {!filteredAssetTypes?.length ? (
                    <div className="p-8 text-center">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {language === 'English' ? 'No Asset Types' : 'لا توجد أنواع أصول'}
                      </h3>
                      <p className="text-gray-600">
                        {language === 'English' ? 'Add asset types to categorize your equipment.' : 'أضف أنواع الأصول لتصنيف معداتك.'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{language === 'English' ? 'Type Name' : 'اسم النوع'}</TableHead>
                          <TableHead className="font-semibold">{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                          <TableHead className="font-semibold w-32">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssetTypes.map((type: any) => (
                          <TableRow key={type.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell className="text-gray-600">{type.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Save Settings' : 'حفظ الإعدادات'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                {language === 'English' ? 'Ticket Configuration' : 'تكوين التذاكر'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage ticket request types, priorities, and workflow settings for efficient support operations.'
                  : 'إدارة أنواع طلبات التذاكر والأولويات وإعدادات سير العمل لعمليات دعم فعالة.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request Types Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Request Types' : 'أنواع الطلبات'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={language === 'English' ? 'Search request types...' : 'البحث في أنواع الطلبات...'}
                        value={requestTypeSearch}
                        onChange={(e) => setRequestTypeSearch(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Dialog open={isRequestTypeDialogOpen} onOpenChange={setIsRequestTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {language === 'English' ? 'Add Type' : 'إضافة نوع'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Request Type' : 'إضافة نوع طلب'}</DialogTitle>
                          <DialogDescription>
                            {language === 'English' ? 'Create a new request type for ticket categorization.' : 'إنشاء نوع طلب جديد لتصنيف التذاكر.'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Request Type Name' : 'اسم نوع الطلب'}</Label>
                            <Input 
                              value={newRequestTypeName} 
                              onChange={(e) => setNewRequestTypeName(e.target.value)}
                              placeholder={language === 'English' ? 'e.g., Hardware Issue, Software Support' : 'مثال: مشكلة أجهزة، دعم برمجيات'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Description' : 'الوصف'}</Label>
                            <Input 
                              value={newRequestTypeDescription} 
                              onChange={(e) => setNewRequestTypeDescription(e.target.value)}
                              placeholder={language === 'English' ? 'Brief description of this request type...' : 'وصف مختصر لهذا النوع من الطلبات...'}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => {
                              setIsRequestTypeDialogOpen(false);
                              setNewRequestTypeName('');
                              setNewRequestTypeDescription('');
                            }}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button 
                              onClick={() => {
                                if (newRequestTypeName.trim()) {
                                  createRequestTypeMutation.mutate({
                                    name: newRequestTypeName.trim(),
                                    description: newRequestTypeDescription.trim()
                                  });
                                }
                              }}
                              disabled={createRequestTypeMutation.isPending || !newRequestTypeName.trim()}
                            >
                              {createRequestTypeMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {language === 'English' ? 'Adding...' : 'جارٍ الإضافة...'}
                                </>
                              ) : (
                                language === 'English' ? 'Add' : 'إضافة'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="border rounded-lg bg-white shadow-sm">
                  {!filteredRequestTypes?.length ? (
                    <div className="p-8 text-center">
                      <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {language === 'English' ? 'No Request Types' : 'لا توجد أنواع طلبات'}
                      </h3>
                      <p className="text-gray-600">
                        {language === 'English' ? 'Add request types to categorize support tickets.' : 'أضف أنواع الطلبات لتصنيف تذاكر الدعم.'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{language === 'English' ? 'Request Type' : 'نوع الطلب'}</TableHead>
                          <TableHead className="font-semibold">{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                          <TableHead className="font-semibold w-32">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequestTypes.map((requestType: any) => (
                          <TableRow key={requestType.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{requestType.name}</TableCell>
                            <TableCell className="text-gray-600">{requestType.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Save Settings' : 'حفظ الإعدادات'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {language === 'English' ? 'Email Configuration' : 'تكوين البريد الإلكتروني'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Configure SMTP settings for email notifications and system communications.'
                  : 'تكوين إعدادات SMTP لإشعارات البريد الإلكتروني واتصالات النظام.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'SMTP Server Settings' : 'إعدادات خادم SMTP'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'SMTP Host' : 'خادم SMTP'}</Label>
                    <Input
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'SMTP server hostname' : 'اسم خادم SMTP'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'SMTP Port' : 'منفذ SMTP'}</Label>
                    <Input
                      type="number"
                      value={emailPort}
                      onChange={(e) => setEmailPort(e.target.value)}
                      placeholder="587"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)' : 'المنافذ الشائعة: 587 (TLS)، 465 (SSL)، 25 (غير آمن)'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Username' : 'اسم المستخدم'}</Label>
                    <Input
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'SMTP authentication username' : 'اسم مستخدم التحقق من SMTP'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Password' : 'كلمة المرور'}</Label>
                    <Input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="your-app-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'SMTP authentication password or app password' : 'كلمة مرور SMTP أو كلمة مرور التطبيق'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Email Settings' : 'إعدادات البريد الإلكتروني'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'From Email Address' : 'عنوان البريد المرسل'}</Label>
                    <Input
                      type="email"
                      value={emailFromAddress}
                      onChange={(e) => setEmailFromAddress(e.target.value)}
                      placeholder="noreply@yourcompany.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Email address that appears as sender' : 'عنوان البريد الذي يظهر كمرسل'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'From Name' : 'اسم المرسل'}</Label>
                    <Input
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      placeholder="SimpleIT System"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Display name for sent emails' : 'الاسم المعروض للرسائل المرسلة'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'English' ? 'Use Secure Connection (TLS/SSL)' : 'استخدام اتصال آمن (TLS/SSL)'}</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-secure"
                        checked={emailSecure}
                        onChange={(e) => setEmailSecure(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="email-secure" className="text-sm">
                        {language === 'English' ? 'Enable secure connection' : 'تفعيل الاتصال الآمن'}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {language === 'English' ? 'Recommended for most SMTP providers' : 'موصى به لمعظم مقدمي خدمة SMTP'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  {language === 'English' ? 'Common SMTP Configurations:' : 'تكوينات SMTP الشائعة:'}
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><strong>Gmail:</strong> smtp.gmail.com:587 (TLS)</div>
                  <div><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</div>
                  <div><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</div>
                  <div><strong>SendGrid:</strong> smtp.sendgrid.net:587 (TLS)</div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="min-w-32"
                >
                  {updateConfigMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'English' ? 'Saving...' : 'جارٍ الحفظ...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {language === 'English' ? 'Save Email Settings' : 'حفظ إعدادات البريد'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'English' ? 'User Management' : 'إدارة المستخدمين'}
              </CardTitle>
              <CardDescription>
                {language === 'English' 
                  ? 'Manage system users, their roles, and access permissions.'
                  : 'إدارة مستخدمي النظام وأدوارهم وصلاحيات الوصول.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">
                      {language === 'English' ? 'Total Users:' : 'إجمالي المستخدمين:'} {allUsers.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">
                      {language === 'English' ? 'Active:' : 'نشط:'} {allUsers.filter(u => u.isActive).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-sm text-gray-600">
                      {language === 'English' ? 'Inactive:' : 'غير نشط:'} {allUsers.filter(u => !u.isActive).length}
                    </span>
                  </div>
                </div>
                
                {/* Add User Button */}
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {language === 'English' ? 'Add User' : 'إضافة مستخدم'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{language === 'English' ? 'Create New User' : 'إنشاء مستخدم جديد'}</DialogTitle>
                      <DialogDescription>
                        {language === 'English' ? 'Add a new user to the system with role-based access control.' : 'إضافة مستخدم جديد إلى النظام مع التحكم في الوصول القائم على الأدوار.'}
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
                          {language === 'English' ? 'Must be unique and at least 3 characters' : 'يجب أن يكون فريداً وعلى الأقل 3 أحرف'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</Label>
                        <Input 
                          type="email"
                          value={newUserEmail} 
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder={language === 'English' ? 'Enter email address' : 'أدخل عنوان البريد الإلكتروني'}
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' ? 'Used for login and notifications' : 'يستخدم لتسجيل الدخول والإشعارات'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'English' ? 'Password' : 'كلمة المرور'}</Label>
                        <Input 
                          type="password"
                          value={newUserPassword} 
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder={language === 'English' ? 'Enter password' : 'أدخل كلمة المرور'}
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === 'English' ? 'Minimum 6 characters required' : 'مطلوب 6 أحرف على الأقل'}
                        </p>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SystemConfig;
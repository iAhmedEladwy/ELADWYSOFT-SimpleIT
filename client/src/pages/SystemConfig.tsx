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
import { Settings, Save, Globe, Loader2, Trash, Trash2, Plus, Edit, Check, X, Mail, Download, Upload, Search, Users, Ticket, Package, FileText, Database, Info as InfoIcon } from 'lucide-react';
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
  const { language } = useLanguage();
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
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(true);
  
  // Department management states
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editedDeptName, setEditedDeptName] = useState('');
  
  // Category management states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
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

  // Asset Management dialog states
  const [isAssetTypeDialogOpen, setIsAssetTypeDialogOpen] = useState(false);
  const [isAssetBrandDialogOpen, setIsAssetBrandDialogOpen] = useState(false);
  const [isAssetStatusDialogOpen, setIsAssetStatusDialogOpen] = useState(false);
  
  // Department dialog state
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);

  // Asset Management search states
  const [assetTypeSearch, setAssetTypeSearch] = useState('');
  const [assetBrandSearch, setAssetBrandSearch] = useState('');
  const [assetStatusSearch, setAssetStatusSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

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
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [editedCategoryDescription, setEditedCategoryDescription] = useState('');
  
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
  
  // Password change states
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] = useState(false);
  const [changePasswordUserId, setChangePasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Data type options for import/export
  const DATA_TYPE_OPTIONS = [
    { 
      value: 'employees', 
      label: { English: 'Employees', Arabic: 'الموظفون' } as Record<string, string>,
      description: { English: 'Manage employee records and information', Arabic: 'إدارة سجلات ومعلومات الموظفين' } as Record<string, string>,
      icon: Users,
      color: 'text-blue-600'
    },
    { 
      value: 'assets', 
      label: { English: 'Assets', Arabic: 'الأصول' } as Record<string, string>,
      description: { English: 'Manage IT assets and equipment', Arabic: 'إدارة الأصول والمعدات التقنية' } as Record<string, string>,
      icon: Package,
      color: 'text-green-600'
    },
    { 
      value: 'tickets', 
      label: { English: 'Tickets', Arabic: 'التذاكر' } as Record<string, string>,
      description: { English: 'Manage support tickets and requests', Arabic: 'إدارة تذاكر الدعم والطلبات' } as Record<string, string>,
      icon: Ticket,
      color: 'text-orange-600'
    }
  ];

  // Queries
  const { data: config } = useQuery<any>({
    queryKey: ['/api/system-config'],
    enabled: hasAccess(3),
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/categories'],
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

  const filteredCategories = categories.filter((category: any) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Update local state when config data is loaded
  useEffect(() => {
    if (config) {
      setAssetIdPrefix(config.assetIdPrefix || 'AST-');
      setEmpIdPrefix(config.empIdPrefix || 'EMP-');
      setTicketIdPrefix(config.ticketIdPrefix || 'TKT-');
      setCurrency(config.currency || 'USD');
      setSelectedLanguage(config.language === 'en' ? 'English' : 'Arabic');
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
      // Force refetch to ensure language changes are reflected immediately
      queryClient.refetchQueries({ queryKey: ['/api/system-config'] });
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

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest('/api/categories', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Category added successfully' : 'تمت إضافة الفئة بنجاح',
      });
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCategoryDialogOpen(false);
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

  // Create custom asset type mutation
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
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset type' : 'فشل إضافة نوع الأصل',
        variant: 'destructive'
      });
      console.error('Failed to create asset type:', error);
    }
  });

  // Create custom asset brand mutation
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
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset brand' : 'فشل إضافة علامة الأصل',
        variant: 'destructive'
      });
      console.error('Failed to create asset brand:', error);
    }
  });

  // Create custom asset status mutation  
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
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to add asset status' : 'فشل إضافة حالة الأصل',
        variant: 'destructive'
      });
      console.error('Failed to create asset status:', error);
    }
  });

  // Create service provider mutation
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

  // Delete Asset Type Mutation
  const deleteAssetTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-types/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type deleted successfully' : 'تم حذف نوع الأصل بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete asset type' : 'فشل حذف نوع الأصل'),
        variant: 'destructive'
      });
    }
  });

  // Delete Asset Brand Mutation  
  const deleteAssetBrandMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-brands/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand deleted successfully' : 'تم حذف علامة الأصل بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete asset brand' : 'فشل حذف علامة الأصل'),
        variant: 'destructive'
      });
    }
  });

  // Delete Asset Status Mutation
  const deleteAssetStatusMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/custom-asset-statuses/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-statuses'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset status deleted successfully' : 'تم حذف حالة الأصل بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete asset status' : 'فشل حذف حالة الأصل'),
        variant: 'destructive'
      });
    }
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/categories/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Category deleted successfully' : 'تم حذف الفئة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to delete category' : 'فشل حذف الفئة'),
        variant: 'destructive'
      });
    }
  });

  // UPDATE MUTATIONS - Missing functionality
  
  // Update Asset Type Mutation
  const updateAssetTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => 
      apiRequest(`/api/custom-asset-types/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
      setEditingTypeId(null);
      setEditedTypeName('');
      setEditedTypeDescription('');
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update asset type' : 'فشل تحديث نوع الأصل'),
        variant: 'destructive'
      });
    }
  });

  // Update Asset Brand Mutation
  const updateAssetBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => 
      apiRequest(`/api/custom-asset-brands/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-brands'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset brand updated successfully' : 'تم تحديث علامة الأصل بنجاح',
      });
      setEditingBrandId(null);
      setEditedBrandName('');
      setEditedBrandDescription('');
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update asset brand' : 'فشل تحديث علامة الأصل'),
        variant: 'destructive'
      });
    }
  });

  // Update Asset Status Mutation
  const updateAssetStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string; color?: string } }) => 
      apiRequest(`/api/custom-asset-statuses/${id}`, 'PUT', data),
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
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update asset status' : 'فشل تحديث حالة الأصل'),
        variant: 'destructive'
      });
    }
  });

  // Update Category Mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) => 
      apiRequest(`/api/categories/${id}`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Category updated successfully' : 'تم تحديث الفئة بنجاح',
      });
      setEditingCategoryId(null);
      setEditedCategoryName('');
      setEditedCategoryDescription('');
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || (language === 'English' ? 'Failed to update request type' : 'فشل تحديث نوع الطلب'),
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
      // Use direct fetch with authentication since we need the raw CSV text
      const response = await fetch(`/api/${type}/template`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv, application/csv, text/plain',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the CSV text content
      const csvContent = await response.text();
      
      // Create blob from the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_template.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: language === 'English' ? 'Template Downloaded' : 'تم تنزيل القالب',
        description: language === 'English' ? `${type} template downloaded successfully` : `تم تنزيل قالب ${type} بنجاح`,
      });
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
      // Use direct fetch with authentication since we need the raw CSV text
      const response = await fetch(`/api/${type}/export`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv, application/csv, text/plain',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the CSV text content
      const csvContent = await response.text();
      
      // Create blob from the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: language === 'English' ? 'Export Successful' : 'تم التصدير بنجاح',
        description: language === 'English' ? `${type} data exported successfully` : `تم تصدير بيانات ${type} بنجاح`,
      });
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
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return { headers, data };
};

// ✅ NEW: Proper CSV line parser that handles quotes
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ("") -> single quote
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Only split on comma if we're not inside quotes
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
};

  const handleFileImport = async () => {
    if (!selectedFile) {
      console.log('No file selected for import');
      return;
    }

    console.log('Starting file import for:', selectedFile.name, 'Selected data type:', selectedDataType);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvText = e.target?.result as string;
        console.log('CSV text length:', csvText.length);
        console.log('CSV preview:', csvText.substring(0, 200));
        
        const { headers, data } = parseCSV(csvText);
        console.log('Parsed headers:', headers);
        console.log('Parsed data rows:', data.length);
        console.log('First data row:', data[0]);
        
        setParsedFileData(data);
        setFileColumns(headers);
        setShowFieldMapping(true);
        setImportError('');
        
        console.log('Field mapping dialog should now show');
      } catch (error) {
        console.error('File parsing error:', error);
        const errorMessage = language === 'English' ? 'Failed to parse CSV file' : 'فشل تحليل ملف CSV';
        setImportError(errorMessage);
        toast({
          title: language === 'English' ? 'Parse Error' : 'خطأ تحليل',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingComplete = async (mappings: any[]) => {
    // Extract mapped data and mapping from the interface format
    const mappedData = parsedFileData;
    const mapping = mappings.reduce((acc: Record<string, string>, m: any) => {
      if (m.sourceColumn && m.targetField) {
        acc[m.targetField] = m.sourceColumn;
      }
      return acc;
    }, {});
    
    // Validate required data before proceeding
    if (!selectedDataType) {
      throw new Error('No data type selected');
    }
    if (!mappedData || !Array.isArray(mappedData)) {
      throw new Error('No parsed file data available');
    }
    if (!mapping || Object.keys(mapping).length === 0) {
      throw new Error('No field mapping provided');
    }
    
    console.log('Import validation:', { 
      selectedDataType, 
      mappedDataLength: mappedData.length, 
      mappingKeys: Object.keys(mapping) 
    });
    
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
      const errorMessage = error?.message || error?.toString() || 'Unknown import error occurred';
      setImportError(errorMessage);
      toast({
        title: language === 'English' ? 'Import Failed' : 'فشل الاستيراد',
        description: errorMessage,
        variant: 'destructive',
      });
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
      language: selectedLanguage === 'English' ? 'en' : 'ar',
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

  // Password change handlers
  const handleChangePassword = (user: any) => {
    setChangePasswordUserId(user.id);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordChangeDialogOpen(true);
  };

  const handlePasswordUpdate = () => {
    if (!changePasswordUserId) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة',
        variant: 'destructive'
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive'
      });
      return;
    }
    
    const userData = { password: newPassword };
    updateUserMutation.mutate({ 
      id: changePasswordUserId, 
      userData 
    });
    
    setIsPasswordChangeDialogOpen(false);
    setChangePasswordUserId(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handler functions for delete operations
  const handleDeleteAssetType = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this asset type?' : 'هل أنت متأكد من حذف نوع الأصل هذا؟')) {
      deleteAssetTypeMutation.mutate(id);
    }
  };

  const handleDeleteAssetBrand = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this asset brand?' : 'هل أنت متأكد من حذف علامة الأصل هذه؟')) {
      deleteAssetBrandMutation.mutate(id);
    }
  };

  const handleDeleteAssetStatus = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this asset status?' : 'هل أنت متأكد من حذف حالة الأصل هذه؟')) {
      deleteAssetStatusMutation.mutate(id);
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (window.confirm(language === 'English' ? 'Are you sure you want to delete this category?' : 'هل أنت متأكد من حذف هذه الفئة؟')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  // Department handlers
  const handleAddDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      const updatedDepartments = [...departments, newDepartment.trim()];
      setDepartments(updatedDepartments);
      setNewDepartment('');
      
      // Save immediately to database
      const configData = {
        assetIdPrefix,
        empIdPrefix,
        ticketIdPrefix,
        currency,
        language: selectedLanguage === 'English' ? 'en' : 'ar',
        departments: updatedDepartments,
        emailHost,
        emailPort: emailPort ? parseInt(emailPort) : 587,
        emailUser,
        emailPassword,
        emailFromAddress,
        emailFromName,
        emailSecure,
      };
      updateConfigMutation.mutate(configData);
    }
  };

  const handleEditDepartment = (index: number) => {
    setEditingDeptIndex(index);
    setEditedDeptName(departments[index]);
  };

  const handleSaveDepartmentEdit = () => {
    if (editingDeptIndex !== null && editedDeptName.trim()) {
      const updatedDepartments = departments.map((dept, index) => 
        index === editingDeptIndex ? editedDeptName.trim() : dept
      );
      setDepartments(updatedDepartments);
      setEditingDeptIndex(null);
      setEditedDeptName('');
      
      // Save immediately to database
      const configData = {
        assetIdPrefix,
        empIdPrefix,
        ticketIdPrefix,
        currency,
        language: selectedLanguage === 'English' ? 'en' : 'ar',
        departments: updatedDepartments,
        emailHost,
        emailPort: emailPort ? parseInt(emailPort) : 587,
        emailUser,
        emailPassword,
        emailFromAddress,
        emailFromName,
        emailSecure,
      };
      updateConfigMutation.mutate(configData);
    }
  };

  // Asset Type Edit Handlers
  const startEditAssetType = (type: any) => {
    setEditingTypeId(type.id);
    setEditedTypeName(type.name);
    setEditedTypeDescription(type.description || '');
  };

  const handleSaveAssetType = () => {
    if (editingTypeId && editedTypeName.trim()) {
      updateAssetTypeMutation.mutate({
        id: editingTypeId,
        data: {
          name: editedTypeName.trim(),
          description: editedTypeDescription.trim()
        }
      });
    }
  };

  const handleCancelAssetTypeEdit = () => {
    setEditingTypeId(null);
    setEditedTypeName('');
    setEditedTypeDescription('');
  };

  // Asset Brand Edit Handlers
  const startEditAssetBrand = (brand: any) => {
    setEditingBrandId(brand.id);
    setEditedBrandName(brand.name);
    setEditedBrandDescription(brand.description || '');
  };

  const handleSaveAssetBrand = () => {
    if (editingBrandId && editedBrandName.trim()) {
      updateAssetBrandMutation.mutate({
        id: editingBrandId,
        data: {
          name: editedBrandName.trim(),
          description: editedBrandDescription.trim()
        }
      });
    }
  };

  const handleCancelAssetBrandEdit = () => {
    setEditingBrandId(null);
    setEditedBrandName('');
    setEditedBrandDescription('');
  };

  // Asset Status Edit Handlers
  const startEditAssetStatus = (status: any) => {
    setEditingStatusId(status.id);
    setEditedStatusName(status.name);
    setEditedStatusDescription(status.description || '');
    setEditedStatusColor(status.color || '#3B82F6');
  };

  const handleSaveAssetStatus = () => {
    if (editingStatusId && editedStatusName.trim()) {
      updateAssetStatusMutation.mutate({
        id: editingStatusId,
        data: {
          name: editedStatusName.trim(),
          description: editedStatusDescription.trim(),
          color: editedStatusColor
        }
      });
    }
  };

  const handleCancelAssetStatusEdit = () => {
    setEditingStatusId(null);
    setEditedStatusName('');
    setEditedStatusDescription('');
    setEditedStatusColor('#3B82F6');
  };

  // Category Edit Handlers
  const startEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setEditedCategoryName(category.name);
    setEditedCategoryDescription(category.description || '');
  };

  const handleSaveCategory = () => {
    if (editingCategoryId && editedCategoryName.trim()) {
      updateCategoryMutation.mutate({
        id: editingCategoryId,
        data: {
          name: editedCategoryName.trim(),
          description: editedCategoryDescription.trim()
        }
      });
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setEditedCategoryName('');
    setEditedCategoryDescription('');
  };

  const handleCancelDepartmentEdit = () => {
    setEditingDeptIndex(null);
    setEditedDeptName('');
  };

  const handleDeleteDepartment = (index: number) => {
    if (window.confirm(language === 'English' ? `Delete department "${departments[index]}"?` : `حذف القسم "${departments[index]}"؟`)) {
      const updatedDepartments = departments.filter((_, i) => i !== index);
      setDepartments(updatedDepartments);
      
      // Save immediately to database
      const configData = {
        assetIdPrefix,
        empIdPrefix,
        ticketIdPrefix,
        currency,
        language: selectedLanguage === 'English' ? 'en' : 'ar',
        departments: updatedDepartments,
        emailHost,
        emailPort: emailPort ? parseInt(emailPort) : 587,
        emailUser,
        emailPassword,
        emailFromAddress,
        emailFromName,
        emailSecure,
      };
      updateConfigMutation.mutate(configData);
    }
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
    <div className="max-w-full mx-auto p-6 space-y-6">
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
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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
                  <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {language === 'English' ? 'Add Department' : 'إضافة قسم'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{language === 'English' ? 'Add Department' : 'إضافة قسم'}</DialogTitle>
                        <DialogDescription>
                          {language === 'English' ? 'Create a new department to organize employees.' : 'إنشاء قسم جديد لتنظيم الموظفين.'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Department Name' : 'اسم القسم'}</Label>
                          <Input 
                            value={newDepartment} 
                            onChange={(e) => setNewDepartment(e.target.value)}
                            placeholder={language === 'English' ? 'e.g., IT, HR, Finance' : 'مثال: تقنية المعلومات، الموارد البشرية، المالية'}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setIsDepartmentDialogOpen(false);
                            setNewDepartment('');
                          }}>
                            {language === 'English' ? 'Cancel' : 'إلغاء'}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
                                const updatedDepartments = [...departments, newDepartment.trim()];
                                setDepartments(updatedDepartments);
                                setNewDepartment('');
                                setIsDepartmentDialogOpen(false);
                                setPreservedTab('employees');
                                
                                // Save immediately to database
                                const configData = {
                                  assetIdPrefix,
                                  empIdPrefix,
                                  ticketIdPrefix,
                                  currency,
                                  language: selectedLanguage === 'English' ? 'en' : 'ar',
                                  departments: updatedDepartments,
                                  emailHost,
                                  emailPort: emailPort ? parseInt(emailPort) : 587,
                                  emailUser,
                                  emailPassword,
                                  emailFromAddress,
                                  emailFromName,
                                  emailSecure,
                                };
                                updateConfigMutation.mutate(configData);
                              }
                            }}
                            disabled={!newDepartment.trim() || departments.includes(newDepartment.trim())}
                          >
                            {language === 'English' ? 'Add' : 'إضافة'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                                      
                                      // Save immediately to database
                                      const configData = {
                                        assetIdPrefix,
                                        empIdPrefix,
                                        ticketIdPrefix,
                                        currency,
                                        language: selectedLanguage === 'English' ? 'en' : 'ar',
                                        departments: updatedDepartments,
                                        emailHost,
                                        emailPort: emailPort ? parseInt(emailPort) : 587,
                                        emailUser,
                                        emailPassword,
                                        emailFromAddress,
                                        emailFromName,
                                        emailSecure,
                                      };
                                      updateConfigMutation.mutate(configData);
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
                                        
                                        // Save immediately to database
                                        const configData = {
                                          assetIdPrefix,
                                          empIdPrefix,
                                          ticketIdPrefix,
                                          currency,
                                          language: selectedLanguage === 'English' ? 'en' : 'ar',
                                          departments: updatedDepartments,
                                          emailHost,
                                          emailPort: emailPort ? parseInt(emailPort) : 587,
                                          emailUser,
                                          emailPassword,
                                          emailFromAddress,
                                          emailFromName,
                                          emailSecure,
                                        };
                                        updateConfigMutation.mutate(configData);
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
                                      onClick={() => handleDeleteDepartment(index)}
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
                  ? 'Manage asset types, brands, and statuses for comprehensive asset tracking.'
                  : 'إدارة أنواع الأصول والعلامات التجارية والحالات لتتبع شامل للأصول.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="types" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="types" className="text-xs">
                    {language === 'English' ? 'Types' : 'الأنواع'}
                  </TabsTrigger>
                  <TabsTrigger value="brands" className="text-xs">
                    {language === 'English' ? 'Brands' : 'العلامات'}
                  </TabsTrigger>
                  <TabsTrigger value="statuses" className="text-xs">
                    {language === 'English' ? 'Statuses' : 'الحالات'}
                  </TabsTrigger>
                </TabsList>

                {/* Asset Types Tab */}
                <TabsContent value="types" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={language === 'English' ? 'Search types...' : 'البحث في الأنواع...'}
                        value={assetTypeSearch}
                        onChange={(e) => setAssetTypeSearch(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <Dialog open={isAssetTypeDialogOpen} onOpenChange={setIsAssetTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
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
                            <Button 
                              onClick={() => {
                                if (newTypeName.trim()) {
                                  createAssetTypeMutation.mutate({
                                    name: newTypeName.trim(),
                                    description: newTypeDescription.trim()
                                  });
                                }
                              }}
                              disabled={createAssetTypeMutation.isPending || !newTypeName.trim()}
                            >
                              {createAssetTypeMutation.isPending ? (
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
                  
                  <div className="border rounded-lg">
                    {!filteredAssetTypes?.length ? (
                      <div className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {language === 'English' ? 'No Asset Types' : 'لا توجد أنواع أصول'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {language === 'English' ? 'Add asset types to categorize equipment.' : 'أضف أنواع الأصول لتصنيف المعدات.'}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'English' ? 'Type Name' : 'اسم النوع'}</TableHead>
                            <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                            <TableHead className="w-20">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssetTypes.map((type: any) => (
                            <TableRow key={type.id}>
                              <TableCell className="font-medium">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeName}
                                    onChange={(e) => setEditedTypeName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetTypeMutation.mutate({
                                          id: type.id,
                                          data: { name: editedTypeName.trim(), description: editedTypeDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                ) : (
                                  type.name
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {editingTypeId === type.id ? (
                                  <Input
                                    value={editedTypeDescription}
                                    onChange={(e) => setEditedTypeDescription(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetTypeMutation.mutate({
                                          id: type.id,
                                          data: { name: editedTypeName.trim(), description: editedTypeDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    placeholder="Description..."
                                  />
                                ) : (
                                  type.description
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {editingTypeId === type.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateAssetTypeMutation.mutate({
                                            id: type.id,
                                            data: { name: editedTypeName.trim(), description: editedTypeDescription.trim() }
                                          });
                                        }}
                                        className="h-7 w-7 p-0"
                                        disabled={updateAssetTypeMutation.isPending}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingTypeId(null);
                                          setEditedTypeName('');
                                          setEditedTypeDescription('');
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={() => startEditAssetType(type)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-red-600"
                                        onClick={() => handleDeleteAssetType(type.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
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
                </TabsContent>


                {/* Asset Brands Tab */}
                <TabsContent value="brands" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={language === 'English' ? 'Search brands...' : 'البحث في العلامات...'}
                        value={assetBrandSearch}
                        onChange={(e) => setAssetBrandSearch(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <Dialog open={isAssetBrandDialogOpen} onOpenChange={setIsAssetBrandDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                        {language === 'English' ? 'Add Brand' : 'إضافة علامة'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{language === 'English' ? 'Add Asset Brand' : 'إضافة علامة أصل'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Brand Name' : 'اسم العلامة'}</Label>
                          <Input 
                            value={newBrandName} 
                            onChange={(e) => setNewBrandName(e.target.value)}
                            placeholder={language === 'English' ? 'e.g., Dell, HP, Lenovo' : 'مثال: Dell، HP، Lenovo'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Description' : 'الوصف'}</Label>
                          <Input 
                            value={newBrandDescription} 
                            onChange={(e) => setNewBrandDescription(e.target.value)}
                            placeholder={language === 'English' ? 'Brief description...' : 'وصف مختصر...'}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAssetBrandDialogOpen(false)}>
                            {language === 'English' ? 'Cancel' : 'إلغاء'}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (newBrandName.trim()) {
                                createAssetBrandMutation.mutate({
                                  name: newBrandName.trim(),
                                  description: newBrandDescription.trim()
                                });
                              }
                            }}
                            disabled={createAssetBrandMutation.isPending || !newBrandName.trim()}
                          >
                            {createAssetBrandMutation.isPending ? (
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
                  
                  <div className="border rounded-lg">
                    {!filteredAssetBrands?.length ? (
                      <div className="p-8 text-center">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {language === 'English' ? 'No Asset Brands' : 'لا توجد علامات أصول'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {language === 'English' ? 'Add brands to track manufacturers.' : 'أضف العلامات لتتبع المصنعين.'}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'English' ? 'Brand Name' : 'اسم العلامة'}</TableHead>
                            <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                            <TableHead className="w-20">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssetBrands.map((brand: any) => (
                            <TableRow key={brand.id}>
                              <TableCell className="font-medium">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandName}
                                    onChange={(e) => setEditedBrandName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetBrandMutation.mutate({
                                          id: brand.id,
                                          data: { name: editedBrandName.trim(), description: editedBrandDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                ) : (
                                  brand.name
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {editingBrandId === brand.id ? (
                                  <Input
                                    value={editedBrandDescription}
                                    onChange={(e) => setEditedBrandDescription(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetBrandMutation.mutate({
                                          id: brand.id,
                                          data: { name: editedBrandName.trim(), description: editedBrandDescription.trim() }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    placeholder="Description..."
                                  />
                                ) : (
                                  brand.description
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {editingBrandId === brand.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateAssetBrandMutation.mutate({
                                            id: brand.id,
                                            data: { name: editedBrandName.trim(), description: editedBrandDescription.trim() }
                                          });
                                        }}
                                        className="h-7 w-7 p-0"
                                        disabled={updateAssetBrandMutation.isPending}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingBrandId(null);
                                          setEditedBrandName('');
                                          setEditedBrandDescription('');
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={() => startEditAssetBrand(brand)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-red-600"
                                        onClick={() => handleDeleteAssetBrand(brand.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
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
                </TabsContent>

                {/* Asset Statuses Tab */}
                <TabsContent value="statuses" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={language === 'English' ? 'Search statuses...' : 'البحث في الحالات...'}
                        value={assetStatusSearch}
                        onChange={(e) => setAssetStatusSearch(e.target.value)}
                        className="w-48"
                      />
                    </div>
                  <Dialog open={isAssetStatusDialogOpen} onOpenChange={setIsAssetStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {language === 'English' ? 'Add Status' : 'إضافة حالة'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{language === 'English' ? 'Add Asset Status' : 'إضافة حالة أصل'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Status Name' : 'اسم الحالة'}</Label>
                          <Input 
                            value={newStatusName} 
                            onChange={(e) => setNewStatusName(e.target.value)}
                            placeholder={language === 'English' ? 'e.g., Active, Under Repair' : 'مثال: نشط، قيد الإصلاح'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Description' : 'الوصف'}</Label>
                          <Input 
                            value={newStatusDescription} 
                            onChange={(e) => setNewStatusDescription(e.target.value)}
                            placeholder={language === 'English' ? 'Brief description...' : 'وصف مختصر...'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Color' : 'اللون'}</Label>
                          <Input 
                            type="color"
                            value={newStatusColor} 
                            onChange={(e) => setNewStatusColor(e.target.value)}
                            className="h-10 w-20"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAssetStatusDialogOpen(false)}>
                            {language === 'English' ? 'Cancel' : 'إلغاء'}
                          </Button>
                          <Button 
                            onClick={() => {
                              if (newStatusName.trim()) {
                                createAssetStatusMutation.mutate({
                                  name: newStatusName.trim(),
                                  description: newStatusDescription.trim(),
                                  color: newStatusColor
                                });
                              }
                            }}
                            disabled={createAssetStatusMutation.isPending || !newStatusName.trim()}
                          >
                            {createAssetStatusMutation.isPending ? (
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
                  
                  <div className="border rounded-lg">
                    {!filteredAssetStatuses?.length ? (
                      <div className="p-8 text-center">
                        <Settings className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {language === 'English' ? 'No Asset Statuses' : 'لا توجد حالات أصول'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {language === 'English' ? 'Add statuses to track lifecycle.' : 'أضف الحالات لتتبع دورة الحياة.'}
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'English' ? 'Status Name' : 'اسم الحالة'}</TableHead>
                            <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                            <TableHead>{language === 'English' ? 'Color' : 'اللون'}</TableHead>
                            <TableHead className="w-20">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAssetStatuses.map((status: any) => (
                            <TableRow key={status.id}>
                              <TableCell className="font-medium">
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusName}
                                    onChange={(e) => setEditedStatusName(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetStatusMutation.mutate({
                                          id: status.id,
                                          data: { name: editedStatusName.trim(), description: editedStatusDescription.trim(), color: editedStatusColor }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    autoFocus
                                  />
                                ) : (
                                  status.name
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {editingStatusId === status.id ? (
                                  <Input
                                    value={editedStatusDescription}
                                    onChange={(e) => setEditedStatusDescription(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        updateAssetStatusMutation.mutate({
                                          id: status.id,
                                          data: { name: editedStatusName.trim(), description: editedStatusDescription.trim(), color: editedStatusColor }
                                        });
                                      }
                                    }}
                                    className="h-8"
                                    placeholder="Description..."
                                  />
                                ) : (
                                  status.description
                                )}
                              </TableCell>
                              <TableCell>
                                {editingStatusId === status.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="color"
                                      value={editedStatusColor}
                                      onChange={(e) => setEditedStatusColor(e.target.value)}
                                      className="h-8 w-16"
                                    />
                                    <span className="text-xs text-gray-500">{editedStatusColor}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded border" 
                                      style={{ backgroundColor: status.color }}
                                    ></div>
                                    <span className="text-xs text-gray-500">{status.color}</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {editingStatusId === status.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          updateAssetStatusMutation.mutate({
                                            id: status.id,
                                            data: { name: editedStatusName.trim(), description: editedStatusDescription.trim(), color: editedStatusColor }
                                          });
                                        }}
                                        className="h-7 w-7 p-0"
                                        disabled={updateAssetStatusMutation.isPending}
                                      >
                                        <Check className="h-3 w-3 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingStatusId(null);
                                          setEditedStatusName('');
                                          setEditedStatusDescription('');
                                          setEditedStatusColor('#3B82F6');
                                        }}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3 text-red-600" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0"
                                        onClick={() => startEditAssetStatus(status)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 p-0 text-red-600"
                                        onClick={() => handleDeleteAssetStatus(status.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
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
                </TabsContent>

              </Tabs>
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
                  ? 'Manage ticket categories, priorities, and workflow settings for efficient support operations.'
                  : 'إدارة فئات التذاكر والأولويات وإعدادات سير العمل لعمليات دعم فعالة.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categories Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {language === 'English' ? 'Categories' : 'الفئات'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={language === 'English' ? 'Search categories...' : 'البحث في الفئات...'}
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {language === 'English' ? 'Add Category' : 'إضافة فئة'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{language === 'English' ? 'Add Category' : 'إضافة فئة'}</DialogTitle>
                          <DialogDescription>
                            {language === 'English' ? 'Create a new category for ticket classification.' : 'إنشاء فئة جديدة لتصنيف التذاكر.'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Category Name' : 'اسم الفئة'}</Label>
                            <Input 
                              value={newCategoryName} 
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder={language === 'English' ? 'e.g., Hardware Issue, Software Support' : 'مثال: مشكلة أجهزة، دعم برمجيات'}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'English' ? 'Description' : 'الوصف'}</Label>
                            <Input 
                              value={newCategoryDescription} 
                              onChange={(e) => setNewCategoryDescription(e.target.value)}
                              placeholder={language === 'English' ? 'Brief description of this category...' : 'وصف مختصر لهذه الفئة...'}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => {
                              setIsCategoryDialogOpen(false);
                              setNewCategoryName('');
                              setNewCategoryDescription('');
                            }}>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button 
                              onClick={() => {
                                if (newCategoryName.trim()) {
                                  createCategoryMutation.mutate({
                                    name: newCategoryName.trim(),
                                    description: newCategoryDescription.trim()
                                  });
                                }
                              }}
                              disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                            >
                              {createCategoryMutation.isPending ? (
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
                  {!filteredCategories?.length ? (
                    <div className="p-8 text-center">
                      <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {language === 'English' ? 'No Categories' : 'لا توجد فئات'}
                      </h3>
                      <p className="text-gray-600">
                        {language === 'English' ? 'Add categories to classify support tickets.' : 'أضف الفئات لتصنيف تذاكر الدعم.'}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="font-semibold">{language === 'English' ? 'Category' : 'الفئة'}</TableHead>
                          <TableHead className="font-semibold">{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
                          <TableHead className="font-semibold w-32">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCategories.map((category: any) => (
                          <TableRow key={category.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {editingCategoryId === category.id ? (
                                <Input
                                  value={editedCategoryName}
                                  onChange={(e) => setEditedCategoryName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: {
                                          name: editedCategoryName.trim(),
                                          description: editedCategoryDescription.trim()
                                        }
                                      });
                                    }
                                  }}
                                  className="h-8"
                                  autoFocus
                                />
                              ) : (
                                category.name
                              )}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {editingCategoryId === category.id ? (
                                <Input
                                  value={editedCategoryDescription}
                                  onChange={(e) => setEditedCategoryDescription(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: {
                                          name: editedCategoryName.trim(),
                                          description: editedCategoryDescription.trim()
                                        }
                                      });
                                    }
                                  }}
                                  className="h-8"
                                  placeholder="Description..."
                                />
                              ) : (
                                category.description
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {editingCategoryId === category.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        updateCategoryMutation.mutate({
                                          id: category.id,
                                          data: {
                                            name: editedCategoryName.trim(),
                                            description: editedCategoryDescription.trim()
                                          }
                                        });
                                      }}
                                      className="h-8 w-8 p-0"
                                      disabled={updateCategoryMutation.isPending}
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCategoryId(null);
                                        setEditedCategoryName('');
                                        setEditedCategoryDescription('');
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
                                      className="h-8 w-8 p-0"
                                      onClick={() => startEditCategory(category)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteCategory(category.id)}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'First Name' : 'الاسم الأول'}</Label>
                          <Input 
                            value={newUserFirstName} 
                            onChange={(e) => setNewUserFirstName(e.target.value)}
                            placeholder={language === 'English' ? 'Enter first name' : 'أدخل الاسم الأول'}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{language === 'English' ? 'Last Name' : 'الاسم الأخير'}</Label>
                          <Input 
                            value={newUserLastName} 
                            onChange={(e) => setNewUserLastName(e.target.value)}
                            placeholder={language === 'English' ? 'Enter last name' : 'أدخل الاسم الأخير'}
                          />
                        </div>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const user = allUsers.find(u => u.id === selectedUserId);
                        if (user) handleChangePassword(user);
                      }}
                      className="h-8"
                    >
                      {language === 'English' ? 'Change Password' : 'تغيير كلمة المرور'}
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

              {/* Password Change Dialog */}
              <Dialog open={isPasswordChangeDialogOpen} onOpenChange={setIsPasswordChangeDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{language === 'English' ? 'Change Password' : 'تغيير كلمة المرور'}</DialogTitle>
                    <DialogDescription>
                      {language === 'English' 
                        ? `Change password for user: ${allUsers.find(u => u.id === changePasswordUserId)?.username || ''}`
                        : `تغيير كلمة المرور للمستخدم: ${allUsers.find(u => u.id === changePasswordUserId)?.username || ''}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{language === 'English' ? 'New Password' : 'كلمة المرور الجديدة'}</Label>
                      <Input 
                        type="password"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={language === 'English' ? 'Enter new password' : 'أدخل كلمة مرور جديدة'}
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'English' ? 'Password must be at least 6 characters' : 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'English' ? 'Confirm Password' : 'تأكيد كلمة المرور'}</Label>
                      <Input 
                        type="password"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={language === 'English' ? 'Confirm new password' : 'أكد كلمة المرور الجديدة'}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsPasswordChangeDialogOpen(false)}>
                        {language === 'English' ? 'Cancel' : 'إلغاء'}
                      </Button>
                      <Button 
                        onClick={handlePasswordUpdate}
                        disabled={updateUserMutation.isPending || !newPassword.trim() || !confirmPassword.trim()}
                      >
                        {updateUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === 'English' ? 'Updating...' : 'جارٍ التحديث...'}
                          </>
                        ) : (
                          language === 'English' ? 'Change Password' : 'تغيير كلمة المرور'
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
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
import { Settings, Save, Globe, Loader2, Trash, Plus, Edit, Check, X, Mail, Download, Upload, Package, Ticket, Building, FileDown, Users, Monitor } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function SystemConfig() {
  const { language, toggleLanguage } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  // State variables
  const [assetIdPrefix, setAssetIdPrefix] = useState('SIT-');
  const [empIdPrefix, setEmpIdPrefix] = useState('EMP-');
  const [ticketIdPrefix, setTicketIdPrefix] = useState('TKT-');
  const [currency, setCurrency] = useState('USD');
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editedDeptName, setEditedDeptName] = useState('');

  // Asset management states
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetBrand, setNewAssetBrand] = useState('');
  const [newAssetStatus, setNewAssetStatus] = useState('');
  const [newServiceProvider, setNewServiceProvider] = useState('');
  const [newServiceProviderContact, setNewServiceProviderContact] = useState('');
  const [newServiceProviderPhone, setNewServiceProviderPhone] = useState('');
  const [newServiceProviderEmail, setNewServiceProviderEmail] = useState('');

  // Ticket management states
  const [newTicketType, setNewTicketType] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('');
  const [newTicketStatus, setNewTicketStatus] = useState('');

  // Editing states
  const [editingAssetTypeId, setEditingAssetTypeId] = useState<number | null>(null);
  const [editedAssetTypeName, setEditedAssetTypeName] = useState('');
  const [editingAssetBrandId, setEditingAssetBrandId] = useState<number | null>(null);
  const [editedAssetBrandName, setEditedAssetBrandName] = useState('');
  const [editingAssetStatusId, setEditingAssetStatusId] = useState<number | null>(null);
  const [editedAssetStatusName, setEditedAssetStatusName] = useState('');

  const [editingTicketTypeId, setEditingTicketTypeId] = useState<number | null>(null);
  const [editedTicketTypeName, setEditedTicketTypeName] = useState('');
  const [editingTicketCategoryId, setEditingTicketCategoryId] = useState<number | null>(null);
  const [editedTicketCategoryName, setEditedTicketCategoryName] = useState('');
  const [editingTicketPriorityId, setEditingTicketPriorityId] = useState<number | null>(null);
  const [editedTicketPriorityName, setEditedTicketPriorityName] = useState('');
  const [editingTicketStatusId, setEditingTicketStatusId] = useState<number | null>(null);
  const [editedTicketStatusName, setEditedTicketStatusName] = useState('');

  // Fetch system configuration
  const { data: systemConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/system-config'],
  });

  // Fetch asset data
  const { data: assetTypes = [] } = useQuery({
    queryKey: ['/api/custom-asset-types'],
  });

  const { data: assetBrands = [] } = useQuery({
    queryKey: ['/api/custom-asset-brands'],
  });

  const { data: assetStatuses = [] } = useQuery({
    queryKey: ['/api/custom-asset-statuses'],
  });

  const { data: serviceProviders = [] } = useQuery({
    queryKey: ['/api/service-providers'],
  });

  // Fetch ticket data
  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['/api/custom-ticket-types'],
  });

  const { data: ticketCategories = [] } = useQuery({
    queryKey: ['/api/custom-ticket-categories'],
  });

  const { data: ticketPriorities = [] } = useQuery({
    queryKey: ['/api/custom-ticket-priorities'],
  });

  const { data: ticketStatuses = [] } = useQuery({
    queryKey: ['/api/custom-ticket-statuses'],
  });

  // Initialize state from system config
  useEffect(() => {
    if (systemConfig) {
      setAssetIdPrefix(systemConfig.assetIdPrefix || 'SIT-');
      setEmpIdPrefix(systemConfig.empIdPrefix || 'EMP-');
      setTicketIdPrefix(systemConfig.ticketIdPrefix || 'TKT-');
      setCurrency(systemConfig.currency || 'USD');
      setDepartments(systemConfig.departments || []);
    }
  }, [systemConfig]);

  // Update system configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', '/api/system-config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-config'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'System configuration updated successfully' : 'تم تحديث إعدادات النظام بنجاح',
      });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update system configuration' : 'فشل تحديث إعدادات النظام',
        variant: 'destructive'
      });
    }
  });

  // Asset Management Mutations
  const createAssetTypeMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest('POST', '/api/custom-asset-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type added successfully' : 'تم إضافة نوع الأصل بنجاح',
      });
      setNewAssetType('');
    },
  });

  const updateAssetTypeMutation = useMutation({
    mutationFn: (data: { id: number; name: string }) => 
      apiRequest('PUT', `/api/custom-asset-types/${data.id}`, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-asset-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Asset type updated successfully' : 'تم تحديث نوع الأصل بنجاح',
      });
      handleCancelEdit();
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

  // Ticket Management Mutations
  const createTicketTypeMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest('POST', '/api/custom-ticket-types', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-ticket-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Ticket type added successfully' : 'تم إضافة نوع التذكرة بنجاح',
      });
      setNewTicketType('');
    },
  });

  const updateTicketTypeMutation = useMutation({
    mutationFn: (data: { id: number; name: string }) => 
      apiRequest('PUT', `/api/custom-ticket-types/${data.id}`, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-ticket-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Ticket type updated successfully' : 'تم تحديث نوع التذكرة بنجاح',
      });
      handleCancelEdit();
    },
  });

  const deleteTicketTypeMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/custom-ticket-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-ticket-types'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Ticket type deleted successfully' : 'تم حذف نوع التذكرة بنجاح',
      });
    },
  });

  // Similar mutations for other ticket fields (categories, priorities, statuses)
  const createTicketCategoryMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest('POST', '/api/custom-ticket-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-ticket-categories'] });
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Ticket category added successfully' : 'تم إضافة فئة التذكرة بنجاح',
      });
      setNewTicketCategory('');
    },
  });

  // Event handlers
  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      assetIdPrefix,
      empIdPrefix,
      ticketIdPrefix,
      currency,
      departments,
    });
  };

  const handleAddAssetType = () => {
    if (newAssetType.trim()) {
      createAssetTypeMutation.mutate({ name: newAssetType.trim() });
    }
  };

  const handleEditAssetType = (type: any) => {
    setEditingAssetTypeId(type.id);
    setEditedAssetTypeName(type.name);
  };

  const handleUpdateAssetType = (id: number) => {
    if (editedAssetTypeName.trim()) {
      updateAssetTypeMutation.mutate({ id, name: editedAssetTypeName.trim() });
    }
  };

  const handleDeleteAssetType = (id: number) => {
    deleteAssetTypeMutation.mutate(id);
  };

  const handleAddTicketType = () => {
    if (newTicketType.trim()) {
      createTicketTypeMutation.mutate({ name: newTicketType.trim() });
    }
  };

  const handleEditTicketType = (type: any) => {
    setEditingTicketTypeId(type.id);
    setEditedTicketTypeName(type.name);
  };

  const handleUpdateTicketType = (id: number) => {
    if (editedTicketTypeName.trim()) {
      updateTicketTypeMutation.mutate({ id, name: editedTicketTypeName.trim() });
    }
  };

  const handleDeleteTicketType = (id: number) => {
    deleteTicketTypeMutation.mutate(id);
  };

  const handleCancelEdit = () => {
    setEditingAssetTypeId(null);
    setEditedAssetTypeName('');
    setEditingTicketTypeId(null);
    setEditedTicketTypeName('');
  };

  if (configLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'English' ? 'System Configuration' : 'إعدادات النظام'}
          </h1>
          <p className="text-gray-600 mt-2">
            {language === 'English' ? 'Manage system settings and configurations' : 'إدارة إعدادات وتكوينات النظام'}
          </p>
        </div>
        <Button onClick={toggleLanguage} variant="outline">
          <Globe className="h-4 w-4 mr-2" />
          {language === 'English' ? 'العربية' : 'English'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="general">{language === 'English' ? 'General' : 'عام'}</TabsTrigger>
          <TabsTrigger value="departments">{language === 'English' ? 'Departments' : 'الأقسام'}</TabsTrigger>
          <TabsTrigger value="assets">{language === 'English' ? 'Assets' : 'الأصول'}</TabsTrigger>
          <TabsTrigger value="tickets">{language === 'English' ? 'Tickets' : 'التذاكر'}</TabsTrigger>
          <TabsTrigger value="email">{language === 'English' ? 'Email' : 'البريد الإلكتروني'}</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {language === 'English' ? 'General Settings' : 'الإعدادات العامة'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Asset ID Prefix' : 'بادئة معرف الأصل'}</Label>
                  <Input
                    value={assetIdPrefix}
                    onChange={(e) => setAssetIdPrefix(e.target.value)}
                    placeholder="SIT-"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Employee ID Prefix' : 'بادئة معرف الموظف'}</Label>
                  <Input
                    value={empIdPrefix}
                    onChange={(e) => setEmpIdPrefix(e.target.value)}
                    placeholder="EMP-"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Ticket ID Prefix' : 'بادئة معرف التذكرة'}</Label>
                  <Input
                    value={ticketIdPrefix}
                    onChange={(e) => setTicketIdPrefix(e.target.value)}
                    placeholder="TKT-"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'English' ? 'Currency' : 'العملة'}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveConfig} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {language === 'English' ? 'Save Configuration' : 'حفظ التكوين'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Asset Types Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {language === 'English' ? 'Asset Types' : 'أنواع الأصول'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' ? 'Manage asset type categories' : 'إدارة فئات أنواع الأصول'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === 'English' ? 'Type name' : 'اسم النوع'}
                      value={newAssetType}
                      onChange={(e) => setNewAssetType(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddAssetType} disabled={!newAssetType.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {assetTypes.map((type: any) => (
                        <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            {editingAssetTypeId === type.id ? (
                              <Input
                                value={editedAssetTypeName}
                                onChange={(e) => setEditedAssetTypeName(e.target.value)}
                                className="text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{type.name}</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {editingAssetTypeId === type.id ? (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleUpdateAssetType(type.id)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleEditAssetType(type)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteAssetType(type.id)}>
                                  <Trash className="h-3 w-3 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Ticket Types Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  {language === 'English' ? 'Ticket Types' : 'أنواع التذاكر'}
                </CardTitle>
                <CardDescription>
                  {language === 'English' ? 'Manage ticket type categories' : 'إدارة فئات أنواع التذاكر'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === 'English' ? 'Type name' : 'اسم النوع'}
                      value={newTicketType}
                      onChange={(e) => setNewTicketType(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddTicketType} disabled={!newTicketType.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {ticketTypes.map((type: any) => (
                        <div key={type.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            {editingTicketTypeId === type.id ? (
                              <Input
                                value={editedTicketTypeName}
                                onChange={(e) => setEditedTicketTypeName(e.target.value)}
                                className="text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{type.name}</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {editingTicketTypeId === type.id ? (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleUpdateTicketType(type.id)}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => handleEditTicketType(type)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteTicketType(type.id)}>
                                  <Trash className="h-3 w-3 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {language === 'English' ? 'Email Configuration' : 'تكوين البريد الإلكتروني'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {language === 'English' ? 'Email configuration will be available in future updates' : 'سيتوفر تكوين البريد الإلكتروني في التحديثات المستقبلية'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {language === 'English' ? 'Department Management' : 'إدارة الأقسام'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {language === 'English' ? 'Department management functionality' : 'وظائف إدارة الأقسام'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

import { Plus, Search, Filter, Download, Upload, RefreshCw, FileUp, DollarSign, FileDown, Package, Wrench, X, Trash2 } from 'lucide-react';
import type { AssetFilters as AssetFiltersType } from '@shared/types';
import AssetFilters from '@/components/assets/AssetFilters';
import AssetForm from '@/components/assets/AssetForm';
import MaintenanceForm from '@/components/assets/MaintenanceForm';
import AssetsTable from '@/components/assets/AssetsTable';
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Assets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [filters, setFilters] = useState<AssetFiltersType>({});
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [openSellDialog, setOpenSellDialog] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [maintenanceAsset, setMaintenanceAsset] = useState<any>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Parse URL parameters on component mount
  useEffect(() => {
    // Get query parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    
    const urlFilters: AssetFilters = {};
    
    // Check for assignedTo parameter
    const assignedTo = urlParams.get('assignedTo');
    if (assignedTo) {
      urlFilters.assignedTo = assignedTo;
    }
    
    // Check for type parameter
    const type = urlParams.get('type');
    if (type) {
      urlFilters.type = type;
    }
    
    // Check for brand parameter
    const brand = urlParams.get('brand');
    if (brand) {
      urlFilters.brand = brand;
    }
    
    // Check for status parameter
    const status = urlParams.get('status');
    if (status) {
      urlFilters.status = status;
    }
    
    // Check for search parameter
    const search = urlParams.get('search');
    if (search) {
      urlFilters.search = search;
      setSearchInput(search); // Also update search input field
    }
    
    // Update filters if any URL parameters were found
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, []); // Empty dependency array means this runs once on mount
   
// Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    // Add each filter to URL params if it exists
    if (filters.assignedTo) {
      params.set('assignedTo', filters.assignedTo);
    }
    if (filters.type) {
      params.set('type', filters.type);
    }
    if (filters.brand) {
      params.set('brand', filters.brand);
    }
    if (filters.status) {
      params.set('status', filters.status);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    
    // Update URL without causing a page reload
    const newUrl = params.toString() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    
    // Only update if URL actually changed to avoid infinite loops
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [filters]);
  
  // Sell assets form state
  const [sellForm, setSellForm] = useState({
    buyer: '',
    saleDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    notes: ''
  });

  const translations = {
    title: language === 'Arabic' ? 'إدارة الأصول' : 'Assets Management',
    description: language === 'Arabic' ? 'إدارة شاملة للأصول مع التتبع الذكي ومعايير ITIL' : 'Comprehensive ITIL-compliant asset management with intelligent tracking',
    addAsset: language === 'Arabic' ? 'إضافة أصل' : 'Add Asset',
    editAsset: language === 'Arabic' ? 'تعديل الأصل' : 'Edit Asset',
    deleteAsset: language === 'Arabic' ? 'حذف الأصل' : 'Delete Asset',
    assignAsset: language === 'Arabic' ? 'تخصيص الأصل' : 'Assign Asset',
    unassignAsset: language === 'Arabic' ? 'إلغاء تخصيص الأصل' : 'Unassign Asset',
    selectAll: language === 'Arabic' ? 'تحديد الكل' : 'Select All',
    deselectAll: language === 'Arabic' ? 'إلغاء تحديد الكل' : 'Deselect All',
    bulkActions: language === 'Arabic' ? 'العمليات المجمعة' : 'Bulk Actions',
    deleteSelected: language === 'Arabic' ? 'حذف المحدد' : 'Delete Selected',
    changeStatus: language === 'Arabic' ? 'تغيير الحالة' : 'Change Status',

    export: language === 'Arabic' ? 'تصدير' : 'Export',
    import: language === 'Arabic' ? 'استيراد' : 'Import',
    refresh: language === 'Arabic' ? 'تحديث' : 'Refresh',
    sell: language === 'Arabic' ? 'بيع الأصول' : 'Sell Assets',
    sellSelected: language === 'Arabic' ? 'بيع المحدد' : 'Sell Selected',
    buyer: language === 'Arabic' ? 'المشتري' : 'Buyer',
    saleDate: language === 'Arabic' ? 'تاريخ البيع' : 'Sale Date',
    totalAmount: language === 'Arabic' ? 'المبلغ الإجمالي' : 'Total Amount',
    notes: language === 'Arabic' ? 'ملاحظات' : 'Notes',
    cancel: language === 'Arabic' ? 'إلغاء' : 'Cancel',
    selectFile: language === 'Arabic' ? 'اختر ملف' : 'Select File',
    uploadFile: language === 'Arabic' ? 'رفع الملف' : 'Upload File',
    importing: language === 'Arabic' ? 'جاري الاستيراد...' : 'Importing...',
    success: language === 'Arabic' ? 'نجح' : 'Success',
    error: language === 'Arabic' ? 'خطأ' : 'Error',
    assetAdded: language === 'Arabic' ? 'تم إضافة الأصل بنجاح' : 'Asset added successfully',
    assetUpdated: language === 'Arabic' ? 'تم تحديث الأصل بنجاح' : 'Asset updated successfully',
    assetDeleted: language === 'Arabic' ? 'تم حذف الأصل بنجاح' : 'Asset deleted successfully',
    assetAssigned: language === 'Arabic' ? 'تم تخصيص الأصل بنجاح' : 'Asset assigned successfully',
    assetUnassigned: language === 'Arabic' ? 'تم إلغاء تخصيص الأصل بنجاح' : 'Asset unassigned successfully',
    assetsSold: language === 'Arabic' ? 'تم بيع الأصول بنجاح' : 'Assets sold successfully',
    assetsImported: language === 'Arabic' ? 'تم استيراد الأصول بنجاح' : 'Assets imported successfully',
    deleteConfirm: language === 'Arabic' ? 'هل أنت متأكد من حذف هذا الأصل؟' : 'Are you sure you want to delete this asset?',
    sellConfirm: language === 'Arabic' ? 'هل أنت متأكد من بيع الأصول المحددة؟' : 'Are you sure you want to sell the selected assets?',
    noAssetsSelected: language === 'Arabic' ? 'لم يتم تحديد أصول للبيع' : 'No assets selected for sale',
    invalidFile: language === 'Arabic' ? 'يرجى اختيار ملف CSV صالح' : 'Please select a valid CSV file'
  };

  // Fetch data
  const { data: assets, isLoading, refetch } = useQuery({
    queryKey: ['/api/assets'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const { data: assetStatuses = [] } = useQuery({
  queryKey: ['/api/custom-asset-statuses'],
  select: (data: any[]) => data.map(status => status.name)
  });

  // Mutations
  const addAssetMutation = useMutation({
    mutationFn: (assetData: any) => apiRequest('/api/assets', 'POST', assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setOpenDialog(false);
      setEditingAsset(null);
      toast({
        title: translations.success,
        description: translations.assetAdded,
      });
    },
    onError: (error: any) => {
      console.error('Add asset error:', error);
      toast({
        title: translations.error,
        description: error.message || 'Failed to add asset',
        variant: 'destructive',
      });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, ...assetData }: any) => apiRequest(`/api/assets/${id}`, 'PUT', assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setOpenDialog(false);
      setEditingAsset(null);
      toast({
        title: translations.success,
        description: translations.assetUpdated,
      });
    },
    onError: (error: any) => {
      console.error('Update asset error:', error);
      toast({
        title: translations.error,
        description: error.message || 'Failed to update asset',
        variant: 'destructive',
      });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: number) => apiRequest(`/api/assets/${assetId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.success,
        description: translations.assetDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const assignAssetMutation = useMutation({
    mutationFn: ({ assetId, employeeId }: { assetId: number; employeeId: number }) =>
      apiRequest(`/api/assets/${assetId}/assign`, 'POST', { employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.success,
        description: translations.assetAssigned,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const unassignAssetMutation = useMutation({
    mutationFn: (assetId: number) => apiRequest(`/api/assets/${assetId}/unassign`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.success,
        description: translations.assetUnassigned,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const sellAssetsMutation = useMutation({
    mutationFn: (saleData: any) => apiRequest('/api/assets/sell', 'POST', saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setOpenSellDialog(false);
      setSelectedAssets([]);
      setSellForm({
        buyer: '',
        saleDate: new Date().toISOString().split('T')[0],
        totalAmount: '',
        notes: ''
      });
      toast({
        title: translations.success,
        description: translations.assetsSold,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const res = await fetch('/api/assets/import', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Import failed');
        return res.json();
      } catch (error) {
        console.error('Import error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setImportFile(null);
      setIsImporting(false);
      toast({
        title: translations.success,
        description: translations.assetsImported,
      });
    },
    onError: (error: any) => {
      setIsImporting(false);
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch('/api/assets/export', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      } catch (error) {
        console.error('Export error:', error);
        throw error;
      }
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assets-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const addMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceData: any) => {
      try {
        const { assetId, ...data } = maintenanceData;
        const res = await fetch(`/api/assets/${assetId}/maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to add maintenance record');
        }
        return res.json();
      } catch (error) {
        console.error('Maintenance error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setOpenMaintenanceDialog(false);
      setMaintenanceAsset(null);
      toast({
        title: translations.success,
        description: language === 'Arabic' ? 'تم إضافة سجل الصيانة بنجاح' : 'Maintenance record added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || (language === 'Arabic' ? 'فشل في إضافة سجل الصيانة' : 'Failed to add maintenance record'),
        variant: 'destructive',
      });
    }
  });



  // Event handlers
  const handleAddAsset = (assetData: any) => {
    addAssetMutation.mutate(assetData);
  };

  const handleUpdateAsset = (assetData: any) => {
  if (!editingAsset) return;
  updateAssetMutation.mutate({ id: editingAsset.id, ...assetData });
  };

  const handleAssignAsset = (assetId: number, employeeId: number) => {
    assignAssetMutation.mutate({ assetId, employeeId });
  };

  const handleUnassignAsset = (assetId: number) => {
    unassignAssetMutation.mutate(assetId);
  };

  const handleAddMaintenance = (assetId: number) => {
    const asset = Array.isArray(assets) ? assets.find((a: any) => a.id === assetId) : null;
    setMaintenanceAsset(asset);
    setOpenMaintenanceDialog(true);
  };

  const handleMaintenanceSubmit = (maintenanceData: any) => {
    addMaintenanceMutation.mutate(maintenanceData);
  };





  const handleUpgradeAsset = (assetId: number) => {
    // Record asset upgrade
    const upgradeDescription = prompt('Enter upgrade details (e.g., RAM upgrade, Storage upgrade):');
    if (!upgradeDescription) return;
    
    const upgradeData = {
      assetId: assetId,
      date: new Date().toISOString().split('T')[0],
      type: 'Upgrade',
      description: upgradeDescription,
      cost: parseFloat(prompt('Enter upgrade cost (optional):') || '0'),
      providerType: 'Internal',
      providerName: 'IT Department'
    };
    
    // Call API to record upgrade
    fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(upgradeData)
    }).then(() => {
      toast({
        title: 'Success',
        description: 'Asset upgrade recorded successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    }).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to record asset upgrade',
        variant: 'destructive',
      });
    });
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map((asset: any) => asset.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAssets.length === 0) return;
    
    try {
      await Promise.all(
        selectedAssets.map(id => 
          apiRequest(`/api/assets/${id}`, 'DELETE')
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: `${selectedAssets.length} assets deleted successfully`,
      });
      setSelectedAssets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to delete assets',
        variant: 'destructive',
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedAssets.length === 0) return;
    
    try {
      await Promise.all(
        selectedAssets.map(id => 
          apiRequest(`/api/assets/${id}`, 'PUT', { status: newStatus })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: `${selectedAssets.length} assets status updated to ${newStatus}`,
      });
      setSelectedAssets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to update asset status',
        variant: 'destructive',
      });
    }
  };



  // Enhanced export function for filtered data
  const handleExportFilteredAssets = () => {
    if (filteredAssets.length === 0) {
      toast({
        title: translations.error,
        description: 'No assets to export',
        variant: 'destructive',
      });
      return;
    }
    
    // Create CSV content from filtered assets
    const headers = ['Asset ID', 'Type', 'Brand', 'Model', 'Serial Number', 'CPU', 'RAM', 'Storage', 'Status', 'Assigned To'];
    const csvContent = [
      headers.join(','),
      ...filteredAssets.map((asset: any) => {
        const assignedEmployee = Array.isArray(employees) ? employees.find((e: any) => e.id === asset.assignedEmployeeId) : null;
        return [
          asset.assetId || '',
          asset.type || '',
          asset.brand || '',
          asset.modelName || '',
          asset.serialNumber || '',
          asset.cpu || '',
          asset.ram || '',
          asset.storage || '',
          asset.status || '',
          assignedEmployee ? assignedEmployee.englishName : ''
        ].map(field => `"${field}"`).join(',');
      })
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered-assets-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: translations.success,
      description: `Exported ${filteredAssets.length} assets successfully`,
    });
  };

  const handleImport = () => {
    if (!importFile) {
      toast({
        title: translations.error,
        description: translations.invalidFile,
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);
    setIsImporting(true);
    importMutation.mutate(formData);
  };

  const handleSellAssets = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: translations.error,
        description: translations.noAssetsSelected,
        variant: 'destructive',
      });
      return;
    }

    const saleData = {
      ...sellForm,
      totalAmount: parseFloat(sellForm.totalAmount),
      assetIds: selectedAssets
    };

    sellAssetsMutation.mutate(saleData);
  };

  // Filter assets based on filters
  const filteredAssets = useMemo(() => {
    if (!assets || !Array.isArray(assets)) return [];
    
    return assets.filter((asset: any) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchFields = [
          asset.assetId,
          asset.type,
          asset.brand,
          asset.modelName,
          asset.serialNumber,
          asset.location,
          asset.specs,
          asset.cpu,
          asset.ram,
          asset.storage
        ].filter(Boolean);
        
        if (!searchFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }
      
      // Type filter
      if (filters.type && asset.type !== filters.type) {
        return false;
      }
      
      // Brand filter
      if (filters.brand && asset.brand !== filters.brand) {
        return false;
      }
      
      // Model filter
      if (filters.model && asset.modelName !== filters.model) {
        return false;
      }
      
      // Status filter
      if (filters.status && asset.status !== filters.status) {
        return false;
      }
      
      // Assignment filter - Fixed to use proper field mapping
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          if (asset.assignedEmployeeId) return false;
        } else {
          if (asset.assignedEmployeeId?.toString() !== filters.assignedTo) return false;
        }
      }
      
      return true;
    });
  }, [assets, filters]);

      // Process employees who have assets assigned
    const employeesWithAssets = useMemo(() => {
      if (!assets || !employees) return [];
      
      const assignedEmployeeIds = new Set(
        assets
          .filter((asset: any) => asset.assignedEmployeeId)
          .map((asset: any) => asset.assignedEmployeeId)
      );
      
      return employees.filter((emp: any) => 
        assignedEmployeeIds.has(emp.id)
      );
    }, [assets, employees]);

    // Check if there are unassigned assets
    const hasUnassignedAssets = useMemo(() => {
      return assets?.some((asset: any) => !asset.assignedEmployeeId) || false;
    }, [assets]);

    // Get display text for selected employee
    const getEmployeeDisplay = (employeeId: string | undefined) => {
      if (!employeeId || employeeId === 'all') return "All Assignments";
      if (employeeId === 'unassigned') return "Unassigned";
      const employee = employees?.find((emp: any) => emp.id.toString() === employeeId);
      return employee ? (employee.englishName || employee.name) : "All Assignments";
    };

  return (
    <>
      <Helmet>
        <title>{translations.title} | SimpleIT v0.2.5</title>
        <meta name="description" content={translations.description} />
      </Helmet>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
            <p className="text-gray-600">{translations.description}</p>
          </div>
        <div className="flex gap-2">        
          
          {hasAccess(2) && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportFilteredAssets}
              disabled={filteredAssets.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV ({filteredAssets.length})
            </Button>
          )}
          
          {hasAccess(2) && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setEditingAsset(null); // Clear editing state for new asset
                      setOpenDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {translations.addAsset}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAsset ? translations.editAsset : translations.addAsset}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAsset ? 'Edit asset information and specifications' : 'Add a new asset to the inventory system'}
                    </DialogDescription>
                  </DialogHeader>
                  <AssetForm
                    onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
                    initialData={editingAsset}
                    isSubmitting={addAssetMutation.isPending || updateAssetMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
          )}
        </div>
        </div>

      {/* ITIL-Compliant Filter & Search Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-lg">Filter & Search Assets</CardTitle>
              {Object.values(filters).filter(Boolean).length > 0 && (
                <Badge variant="secondary">{Object.values(filters).filter(Boolean).length}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAssets.length} of {assets && Array.isArray(assets) ? assets.length : 0} assets
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <form onSubmit={(e) => {
            e.preventDefault();
            setFilters({ ...filters, search: searchInput });
          }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Asset ID, Type, Brand, Model, Serial Number, Specs, CPU, RAM, Storage..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="all">All Types</SelectItem>
                {assets && Array.isArray(assets) ? Array.from(new Set(assets.map((a: any) => a.type).filter(Boolean))).map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="all">All Statuses</SelectItem>
                {assetStatuses.map((status: string) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Brand</label>
            <Select
              value={filters.brand || 'all'}
              onValueChange={(value) => setFilters({ ...filters, brand: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="all">All Brands</SelectItem>
                {assets && Array.isArray(assets) ? Array.from(new Set(assets.map((a: any) => a.brand).filter(Boolean))).map((brand: string) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Assignment Filter - Updated with Combobox */}
          <div>
            <label className="text-sm font-medium mb-2 block">Assignment</label>
            <Popover open={assignmentOpen} onOpenChange={setAssignmentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assignmentOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {getEmployeeDisplay(filters.assignedTo)}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search employees..." 
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>No employees found.</CommandEmpty>
                    <CommandGroup>
                      {/* All Assignments option */}
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setFilters({ ...filters, assignedTo: undefined });
                          setAssignmentOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            !filters.assignedTo ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        All Assignments
                      </CommandItem>
                      
                      {/* Unassigned option - only show if there are unassigned assets */}
                      {hasUnassignedAssets && (
                        <CommandItem
                          value="unassigned"
                          onSelect={() => {
                            setFilters({ ...filters, assignedTo: 'unassigned' });
                            setAssignmentOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filters.assignedTo === 'unassigned' ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Unassigned
                        </CommandItem>
                      )}
                      
                      {/* Employee options - only show employees with assets */}
                      {employeesWithAssets.map((employee: any) => (
                        <CommandItem
                          key={employee.id}
                          value={employee.englishName || employee.name || ''}
                          onSelect={() => {
                            setFilters({ ...filters, assignedTo: employee.id.toString() });
                            setAssignmentOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filters.assignedTo === employee.id.toString() 
                                ? "opacity-100" 
                                : "opacity-0"
                            }`}
                          />
                          {employee.englishName || employee.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          </div>


        </CardContent>
      </Card>

      {/* Bulk Actions for Selected Assets */}
      {selectedAssets.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-700">
            {selectedAssets.length} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedAssets.length === filteredAssets.length ? 
                translations.deselectAll : translations.selectAll}
            </Button>
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder={translations.changeStatus} />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses.map((status: string) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {translations.deleteSelected}
            </Button>
          </div>
        </div>
      )}

      {/* ITIL-Compliant Assets Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asset Inventory ({filteredAssets.length})
          </CardTitle>
          <CardDescription>
            Complete ITIL-compliant asset management with lifecycle tracking, hardware specifications, and change history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <AssetsTable 
              assets={filteredAssets}
              employees={Array.isArray(employees) ? employees : []}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={(asset) => {
                setEditingAsset(asset);
                setOpenDialog(true);
              }}
              onDelete={(assetId) => deleteAssetMutation.mutate(assetId)}
              onAssign={(assetId, employeeId) => assignAssetMutation.mutate({ assetId, employeeId })}
              onUnassign={(assetId) => unassignAssetMutation.mutate(assetId)}
              onAddMaintenance={(assetId, maintenanceData) => {
                handleAddMaintenance(assetId);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle>
            {editingAsset 
              ? `${translations.editAsset} (${editingAsset.assetId})` 
              : translations.addAsset}
          </DialogTitle>
            <DialogDescription>
              {editingAsset 
                ? 'Update the asset information below' 
                : 'Fill in the details to add a new asset'
              }
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
            initialData={editingAsset}
            isSubmitting={addAssetMutation.isPending || updateAssetMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Maintenance Form Dialog */}
      <Dialog open={openMaintenanceDialog} onOpenChange={setOpenMaintenanceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {language === 'Arabic' ? 'إضافة سجل صيانة' : 'Add Maintenance Record'}
            </DialogTitle>
            <DialogDescription>
              {language === 'Arabic' 
                ? 'أضف سجل صيانة مفصل لتتبع أعمال الصيانة والإصلاحات' 
                : 'Add a detailed maintenance record to track service work and repairs'
              }
            </DialogDescription>
          </DialogHeader>
          {maintenanceAsset && (
            <MaintenanceForm
              onSubmit={handleMaintenanceSubmit}
              isSubmitting={addMaintenanceMutation.isPending}
              assetId={maintenanceAsset.id}
              assetName={`${maintenanceAsset.type} - ${maintenanceAsset.brand} ${maintenanceAsset.modelName || ''}`.trim()}
            />
          )}
        </DialogContent>
      </Dialog>


      </div>
    </>
  );
}
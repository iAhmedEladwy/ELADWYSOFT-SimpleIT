import { useState, useEffect, useMemo } from 'react';
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

import { Plus, Search, Filter, Download, Upload, RefreshCw, FileUp, DollarSign, FileDown, Package, Wrench } from 'lucide-react';
import type { AssetFilters as AssetFiltersType } from '@shared/types';
import AssetFilters from '@/components/assets/AssetFilters';
import AssetForm from '@/components/assets/AssetForm';
import MaintenanceForm from '@/components/assets/MaintenanceForm';
import AssetsTable from '@/components/assets/AssetsTable';

export default function Assets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [filters, setFilters] = useState<AssetFiltersType>({});
  const [searchInput, setSearchInput] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [openSellDialog, setOpenSellDialog] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = useState(false);
  const [maintenanceAsset, setMaintenanceAsset] = useState<any>(null);

  

  
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

  return (
    <>
      <Helmet>
        <title>{translations.title} | SimpleIT v1.3</title>
        <meta name="description" content={translations.description} />
      </Helmet>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
            <p className="text-gray-600">{translations.description}</p>
          </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations.refresh}
          </Button>
          
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
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {filteredAssets.length} of {assets && Array.isArray(assets) ? assets.length : 0} assets
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
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
                <SelectContent>
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
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
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
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {assets && Array.isArray(assets) ? Array.from(new Set(assets.map((a: any) => a.brand).filter(Boolean))).map((brand: string) => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Assignment</label>
              <Select
                value={filters.assignedTo || 'all'}
                onValueChange={(value) => setFilters({ ...filters, assignedTo: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees && Array.isArray(employees) ? employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.englishName || employee.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters and Export CSV */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({});
                setSearchInput('');
              }}
              disabled={Object.values(filters).every(v => !v) && !searchInput}
            >
              Clear Filters
            </Button>
            {hasAccess(2) && (
              <Button 
                variant="outline"
                onClick={handleExportFilteredAssets}
                disabled={filteredAssets.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV ({filteredAssets.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
              employees={employees || []}
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
              {editingAsset ? translations.editAsset : translations.addAsset}
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
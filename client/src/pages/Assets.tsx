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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, History, FileDown, Package, Monitor, Cpu, HardDrive, MemoryStick, RefreshCw, FileUp, DollarSign, Calendar, User, Tag, Building, Wrench, CheckCircle, AlertCircle, Clipboard } from 'lucide-react';
import type { AssetFilters as AssetFiltersType } from '@shared/types';
import AssetFilters from '@/components/assets/AssetFilters';
import AssetForm from '@/components/assets/AssetForm';

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
    // Create maintenance record for asset
    const maintenanceData = {
      assetId: assetId,
      date: new Date().toISOString().split('T')[0],
      type: 'Preventive', 
      description: prompt('Enter maintenance description:') || 'Routine maintenance',
      cost: 0,
      providerType: 'Internal',
      providerName: 'IT Department',
      status: 'Completed'
    };
    
    // Call API to create maintenance record
    fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(maintenanceData)
    }).then(() => {
      toast({
        title: 'Success',
        description: 'Maintenance record added successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    }).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to add maintenance record',
        variant: 'destructive',
      });
    });
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
          asset.location
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
      
      // Assignment filter
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          if (asset.assignedToId) return false;
        } else {
          if (asset.assignedToId?.toString() !== filters.assignedTo) return false;
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
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                {translations.export}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {translations.import}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{translations.import}</DialogTitle>
                    <DialogDescription>
                      Upload a CSV file to import assets
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="import-file">{translations.selectFile}</Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <Button 
                      onClick={handleImport} 
                      disabled={!importFile || isImporting}
                      className="w-full"
                    >
                      <FileUp className="h-4 w-4 mr-2" />
                      {isImporting ? translations.importing : translations.uploadFile}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedAssets.length > 0 && (
                <Dialog open={openSellDialog} onOpenChange={setOpenSellDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {translations.sellSelected} ({selectedAssets.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{translations.sell}</DialogTitle>
                      <DialogDescription>
                        Sell {selectedAssets.length} selected assets
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="buyer">{translations.buyer}</Label>
                        <Input
                          id="buyer"
                          value={sellForm.buyer}
                          onChange={(e) => setSellForm({ ...sellForm, buyer: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="saleDate">{translations.saleDate}</Label>
                        <Input
                          id="saleDate"
                          type="date"
                          value={sellForm.saleDate}
                          onChange={(e) => setSellForm({ ...sellForm, saleDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="totalAmount">{translations.totalAmount}</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          step="0.01"
                          value={sellForm.totalAmount}
                          onChange={(e) => setSellForm({ ...sellForm, totalAmount: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">{translations.notes}</Label>
                        <Textarea
                          id="notes"
                          value={sellForm.notes}
                          onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                        />
                      </div>
                      <Button 
                        onClick={handleSellAssets} 
                        disabled={sellAssetsMutation.isPending}
                        className="w-full"
                      >
                        {sellAssetsMutation.isPending ? 'Processing...' : translations.sell}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
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
            </>
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
                placeholder="Search by Asset ID, Type, Brand, Model, Serial Number..."
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

          {/* Clear Filters */}
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssets(filteredAssets.map((a: any) => a.id));
                          } else {
                            setSelectedAssets([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Type & Brand</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Hardware Specs</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset: any) => (
                    <TableRow key={asset.id} className="hover:bg-muted/50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssets([...selectedAssets, asset.id]);
                            } else {
                              setSelectedAssets(selectedAssets.filter(id => id !== asset.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div 
                          className="font-medium text-blue-600 cursor-pointer hover:text-blue-800"
                          onClick={() => {
                            setEditingAsset(asset);
                            setOpenDialog(true);
                          }}
                        >
                          {asset.assetId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{asset.type}</div>
                          <div className="text-sm text-gray-500">{asset.brand} {asset.modelName && `- ${asset.modelName}`}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{asset.serialNumber}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMM dd, yyyy') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {(asset.cpu || asset.ram || asset.storage) ? (
                            <>
                              {asset.cpu && (
                                <div className="flex items-center gap-1">
                                  <Cpu className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-[120px]" title={asset.cpu}>{asset.cpu}</span>
                                </div>
                              )}
                              {asset.ram && (
                                <div className="flex items-center gap-1">
                                  <MemoryStick className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-[80px]" title={asset.ram}>{asset.ram}</span>
                                </div>
                              )}
                              {asset.storage && (
                                <div className="flex items-center gap-1">
                                  <HardDrive className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-[100px]" title={asset.storage}>{asset.storage}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">No specs</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            asset.status === 'Available' ? 'bg-green-100 text-green-800' :
                            asset.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                            asset.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            asset.status === 'Damaged' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.assignedToId ? (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {employees && Array.isArray(employees) ? 
                                (employees.find((e: any) => e.id === asset.assignedToId)?.englishName || 
                                 employees.find((e: any) => e.id === asset.assignedToId)?.name || 
                                 'Unknown') : 'Unknown'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingAsset(asset);
                              setOpenDialog(true);
                            }}
                            title="Edit Asset"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/asset-history?assetId=${asset.id}`, '_blank')}
                            title="View Asset History"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAddMaintenance(asset.id)}
                            title="Add Maintenance Record"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpgradeAsset(asset.id)}
                            title="Record Upgrade"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          {hasAccess(3) && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteAssetMutation.mutate(asset.id)}
                              title="Delete Asset"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAssets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No assets found matching the current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
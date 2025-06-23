import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import AssetsTable from '@/components/assets/AssetsTable';
import AssetForm from '@/components/assets/AssetForm';
import AssetFilters from '@/components/assets/AssetFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Upload, DollarSign, FileUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AssetFilters as AssetFiltersType } from '@shared/types';

export default function Assets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [filters, setFilters] = useState<AssetFiltersType>({});
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [openSellDialog, setOpenSellDialog] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  
  // Listen for the FAB add asset event
  useEffect(() => {
    const handleFabAddAsset = () => {
      // Clear editing state and open dialog for new asset
      setEditingAsset(null);
      setOpenDialog(true);
    };
    
    // Register event listener
    window.addEventListener('fab:add-asset', handleFabAddAsset);
    
    // Check if URL has action=new parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      handleFabAddAsset();
      // Clean up the URL to prevent dialog from reopening on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Clean up
    return () => {
      window.removeEventListener('fab:add-asset', handleFabAddAsset);
    };
  }, []);
  
  // Sell assets form state
  const [sellForm, setSellForm] = useState({
    buyer: '',
    saleDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    notes: ''
  });

  const translations = {
    title: language === 'Arabic' ? 'إدارة الأصول' : 'Assets Management',
    description: language === 'Arabic' ? 'إدارة وتتبع جميع أصول الشركة' : 'Manage and track all company assets',
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
      toast({
        title: translations.error,
        description: error.message,
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
      toast({
        title: translations.error,
        description: error.message,
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
    mutationFn: (formData: FormData) => {
      return fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Import failed');
        return res.json();
      });
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
    mutationFn: () => {
      return fetch('/api/assets/export').then(res => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      });
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
    // Navigate to maintenance page or open maintenance dialog
    console.log('Add maintenance for asset:', assetId);
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
    if (!assets) return [];
    
    return assets.filter(asset => {
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
                  <Button size="sm">
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

      {/* Filters Section */}
      <div className="mb-6">
        <AssetFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={assets?.length || 0}
          filteredCount={filteredAssets.length}
          onExport={() => exportMutation.mutate('csv')}
        />
      </div>

      {/* Assets Table */}
      {isLoading ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <AssetsTable 
          assets={filteredAssets}
          employees={employees}
          onEdit={setEditingAsset}
          onDelete={(id) => deleteAssetMutation.mutate(id)}
          onAssign={handleAssignAsset}
          onUnassign={handleUnassignAsset}
          onAddMaintenance={handleAddMaintenance}
          onSelect={setSelectedAssets}
          selectedAssets={selectedAssets}
          onOpenDialog={() => setOpenDialog(true)}
        />
      )}
    </div>
  );
}
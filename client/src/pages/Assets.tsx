import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import AssetsTable from '@/components/assets/AssetsTable';
import AssetForm from '@/components/assets/AssetForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download, Upload, DollarSign, FileUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function Assets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    date: new Date().toISOString().split('T')[0],
    totalAmount: '',
    notes: ''
  });

  // Translations
  const translations = {
    title: language === 'English' ? 'Assets Management' : 'إدارة الأصول',
    description: language === 'English' 
      ? 'Track and manage all company IT assets' 
      : 'تتبع وإدارة جميع أصول تكنولوجيا المعلومات للشركة',
    allAssets: language === 'English' ? 'All Assets' : 'جميع الأصول',
    available: language === 'English' ? 'Available' : 'متاح',
    inUse: language === 'English' ? 'In Use' : 'قيد الاستخدام',
    maintenance: language === 'English' ? 'Maintenance' : 'صيانة',
    sold: language === 'English' ? 'Sold' : 'تم بيعه',
    damaged: language === 'English' ? 'Damaged' : 'تالف',
    retired: language === 'English' ? 'Retired' : 'متقاعد',
    addAsset: language === 'English' ? 'Add Asset' : 'إضافة أصل',
    editAsset: language === 'English' ? 'Edit Asset' : 'تعديل الأصل',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    search: language === 'English' ? 'Search...' : 'بحث...',
    import: language === 'English' ? 'Import' : 'استيراد',
    export: language === 'English' ? 'Export' : 'تصدير',
    sellAssets: language === 'English' ? 'Sell Assets' : 'بيع الأصول',
    selectFile: language === 'English' ? 'Select File' : 'اختر ملف',
    assetAdded: language === 'English' ? 'Asset added successfully' : 'تمت إضافة الأصل بنجاح',
    assetUpdated: language === 'English' ? 'Asset updated successfully' : 'تم تحديث الأصل بنجاح',
    assetDeleted: language === 'English' ? 'Asset deleted successfully' : 'تم حذف الأصل بنجاح',
    importSuccess: language === 'English' ? 'Assets imported successfully' : 'تم استيراد الأصول بنجاح',
    sellSuccess: language === 'English' ? 'Assets sold successfully' : 'تم بيع الأصول بنجاح',
    buyer: language === 'English' ? 'Buyer' : 'المشتري',
    date: language === 'English' ? 'Date' : 'التاريخ',
    totalAmount: language === 'English' ? 'Total Amount' : 'المبلغ الإجمالي',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    sell: language === 'English' ? 'Sell' : 'بيع',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
    noAssetsSelected: language === 'English' ? 'No assets selected' : 'لم يتم تحديد أي أصول',
    assetAssigned: language === 'English' ? 'Asset assigned successfully' : 'تم تعيين الأصل بنجاح',
    assetUnassigned: language === 'English' ? 'Asset unassigned successfully' : 'تم إلغاء تعيين الأصل بنجاح',
    maintenanceSuccess: language === 'English' ? 'Maintenance record added successfully' : 'تمت إضافة سجل الصيانة بنجاح',
  };

  // Fetch assets
  const { 
    data: assets = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch employees for assignment dropdown
  const { 
    data: employees = [], 
    isLoading: employeesLoading
  } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Add asset mutation
  const addAssetMutation = useMutation({
    mutationFn: async (assetData: any) => {
      const res = await apiRequest('POST', '/api/assets', assetData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.assetAdded,
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, assetData }: { id: number; assetData: any }) => {
      const res = await apiRequest('PUT', `/api/assets/${id}`, assetData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.assetUpdated,
      });
      setOpenDialog(false);
      setEditingAsset(null);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/assets/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.assetDeleted,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign asset mutation
  const assignAssetMutation = useMutation({
    mutationFn: async ({ id, employeeId }: { id: number; employeeId: number }) => {
      const res = await apiRequest('POST', `/api/assets/${id}/assign`, { employeeId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.assetAssigned,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unassign asset mutation
  const unassignAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/assets/${id}/unassign`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.assetUnassigned,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add maintenance record mutation
  const addMaintenanceMutation = useMutation({
    mutationFn: async ({ id, maintenanceData }: { id: number; maintenanceData: any }) => {
      const res = await apiRequest('POST', `/api/assets/${id}/maintenance`, maintenanceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.maintenanceSuccess,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import assets mutation
  const importAssetsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.importSuccess,
        description: `${data.imported} assets imported.`,
      });
      setImportFile(null);
      setIsImporting(false);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
      setIsImporting(false);
    },
  });

  // Sell assets mutation
  const sellAssetsMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await apiRequest('POST', '/api/asset-sales', saleData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      toast({
        title: translations.sellSuccess,
      });
      setOpenSellDialog(false);
      setSelectedAssets([]);
      setSellForm({
        buyer: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: '',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddAsset = (assetData: any) => {
    addAssetMutation.mutate(assetData);
  };

  const handleUpdateAsset = (assetData: any) => {
    if (editingAsset && editingAsset.id) {
      updateAssetMutation.mutate({ id: editingAsset.id, assetData });
    }
  };

  const handleDeleteAsset = (assetId: number) => {
    deleteAssetMutation.mutate(assetId);
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setOpenDialog(true);
  };

  const handleAssignAsset = (assetId: number, employeeId: number) => {
    assignAssetMutation.mutate({ id: assetId, employeeId });
  };

  const handleUnassignAsset = (assetId: number) => {
    unassignAssetMutation.mutate(assetId);
  };

  const handleAddMaintenance = (assetId: number, maintenanceData: any) => {
    addMaintenanceMutation.mutate({ id: assetId, maintenanceData });
  };

  const handleExport = () => {
    window.open('/api/assets/export', '_blank');
  };

  const handleImport = () => {
    if (!importFile) return;
    
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    importAssetsMutation.mutate(formData);
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

  // Filter assets based on search query
  const filteredAssets = assets.filter((asset: any) => {
    const searchString = searchQuery.toLowerCase();
    return (
      asset.assetId?.toLowerCase().includes(searchString) ||
      asset.type?.toLowerCase().includes(searchString) ||
      asset.brand?.toLowerCase().includes(searchString) ||
      asset.modelName?.toLowerCase().includes(searchString) ||
      asset.serialNumber?.toLowerCase().includes(searchString)
    );
  });

  // Filter assets by status
  const availableAssets = filteredAssets.filter((asset: any) => asset.status === 'Available');
  const inUseAssets = filteredAssets.filter((asset: any) => asset.status === 'In Use');
  const maintenanceAssets = filteredAssets.filter((asset: any) => asset.status === 'Maintenance');
  const soldAssets = filteredAssets.filter((asset: any) => asset.status === 'Sold');
  const damagedAssets = filteredAssets.filter((asset: any) => asset.status === 'Damaged');
  const retiredAssets = filteredAssets.filter((asset: any) => asset.status === 'Retired');

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
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Button 
                      onClick={handleImport} 
                      disabled={!importFile || isImporting}
                      className="w-full"
                    >
                      {isImporting ? 'Importing...' : translations.import}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              {selectedAssets.length > 0 && hasAccess(3) && (
                <Dialog open={openSellDialog} onOpenChange={setOpenSellDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {translations.sellAssets} ({selectedAssets.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{translations.sellAssets}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="buyer">{translations.buyer}</Label>
                        <Input
                          id="buyer"
                          value={sellForm.buyer}
                          onChange={(e) => setSellForm({ ...sellForm, buyer: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">{translations.date}</Label>
                        <Input
                          id="date"
                          type="date"
                          value={sellForm.date}
                          onChange={(e) => setSellForm({ ...sellForm, date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalAmount">{translations.totalAmount}</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={sellForm.totalAmount}
                          onChange={(e) => setSellForm({ ...sellForm, totalAmount: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">{translations.notes}</Label>
                        <Input
                          id="notes"
                          value={sellForm.notes}
                          onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                        />
                      </div>
                      <Button 
                        onClick={handleSellAssets} 
                        disabled={!sellForm.buyer || !sellForm.date || !sellForm.totalAmount || sellAssetsMutation.isPending}
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

      <div className="mb-6">
        <Input
          placeholder={translations.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{translations.allAssets}</TabsTrigger>
          <TabsTrigger value="available">{translations.available}</TabsTrigger>
          <TabsTrigger value="inuse">{translations.inUse}</TabsTrigger>
          <TabsTrigger value="maintenance">{translations.maintenance}</TabsTrigger>
          <TabsTrigger value="sold">{translations.sold}</TabsTrigger>
          <TabsTrigger value="damaged">{translations.damaged}</TabsTrigger>
          <TabsTrigger value="retired">{translations.retired}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={filteredAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>

        <TabsContent value="available">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={availableAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>

        <TabsContent value="inuse">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={inUseAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={maintenanceAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>

        <TabsContent value="sold">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={soldAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>

        <TabsContent value="damaged">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={damagedAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>

        <TabsContent value="retired">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <AssetsTable 
              assets={retiredAssets}
              employees={employees}
              selectedAssets={selectedAssets}
              setSelectedAssets={setSelectedAssets}
              onEdit={handleEditAsset}
              onDelete={handleDeleteAsset}
              onAssign={handleAssignAsset}
              onUnassign={handleUnassignAsset}
              onAddMaintenance={handleAddMaintenance}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

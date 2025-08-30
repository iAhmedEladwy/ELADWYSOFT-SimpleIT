import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useCurrency } from '@/lib/currencyContext';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import AssetsTable from '@/components/assets/AssetsTable';
import AssetForm from '@/components/assets/AssetForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export default function Assets() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const queryClient = useQueryClient();
  
  // State management
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    brand: '',
    model: '',
    status: '',
    assignedTo: '',
    maintenanceDue: ''
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Translations
  const translations = {
    assets: language === 'English' ? 'Assets' : 'الأصول',
    manageAssets: language === 'English' ? 'Manage your IT assets inventory' : 'إدارة مخزون أصول تكنولوجيا المعلومات',
    addAsset: language === 'English' ? 'Add Asset' : 'إضافة أصل',
    search: language === 'English' ? 'Search' : 'بحث',
    searchPlaceholder: language === 'English' ? 'Search by ID, type, brand, model...' : 'البحث بالمعرف، النوع، العلامة التجارية، الموديل...',
    filters: language === 'English' ? 'Filters' : 'المرشحات',
    clearFilters: language === 'English' ? 'Clear Filters' : 'مسح المرشحات',
    type: language === 'English' ? 'Type' : 'النوع',
    brand: language === 'English' ? 'Brand' : 'العلامة التجارية',
    model: language === 'English' ? 'Model' : 'الموديل',
    status: language === 'English' ? 'Status' : 'الحالة',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    maintenanceStatus: language === 'English' ? 'Maintenance Status' : 'حالة الصيانة',
    all: language === 'English' ? 'All' : 'الكل',
    scheduled: language === 'English' ? 'Scheduled' : 'مجدول',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
    export: language === 'English' ? 'Export' : 'تصدير',
    import: language === 'English' ? 'Import' : 'استيراد',
    loading: language === 'English' ? 'Loading assets...' : 'جاري تحميل الأصول...',
    noAssets: language === 'English' ? 'No assets found' : 'لم يتم العثور على أصول',
    editAsset: language === 'English' ? 'Edit Asset' : 'تعديل الأصل',
    updateAsset: language === 'English' ? 'Update asset information' : 'تحديث معلومات الأصل',
    perPage: language === 'English' ? 'Per page:' : 'لكل صفحة:',
    firstPage: language === 'English' ? 'First page' : 'الصفحة الأولى',
    lastPage: language === 'English' ? 'Last page' : 'الصفحة الأخيرة',
    nextPage: language === 'English' ? 'Next page' : 'الصفحة التالية',
    previousPage: language === 'English' ? 'Previous page' : 'الصفحة السابقة',
  };
  
  // Build query parameters
  const queryParams = useMemo(() => {
    const params: any = {
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    };
    
    // Add filters to params
    if (filters.search) params.search = filters.search;
    if (filters.type) params.type = filters.type;
    if (filters.brand) params.brand = filters.brand;
    if (filters.model) params.model = filters.model;
    if (filters.status) params.status = filters.status;
    if (filters.assignedTo) params.assignedTo = filters.assignedTo;
    if (filters.maintenanceDue) params.maintenanceDue = filters.maintenanceDue;
    
    return params;
  }, [currentPage, itemsPerPage, filters]);
  
  // Fetch assets with pagination
  const { data: assetsResponse, isLoading, refetch } = useQuery({
    queryKey: ['/api/assets', queryParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams(queryParams);
      const response = await apiRequest(`/api/assets?${searchParams}`);
      return response;
    },
    keepPreviousData: true,
  });
  
  // Extract data and pagination info
  const assets = assetsResponse?.data || [];
  const pagination = assetsResponse?.pagination || {
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasMore: false
  };
  
  // Fetch additional data for filters
  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });
  
  const { data: systemConfig } = useQuery({
    queryKey: ['/api/system-config'],
  });
  
  // Get unique values for filter dropdowns
  const uniqueTypes = useMemo(() => {
    return systemConfig?.assetTypes || ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Phone', 'Tablet'];
  }, [systemConfig]);
  
  const uniqueBrands = useMemo(() => {
    return systemConfig?.assetBrands || ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung'];
  }, [systemConfig]);
  
  const uniqueStatuses = useMemo(() => {
    return systemConfig?.assetStatuses || ['Available', 'In Use', 'Under Maintenance', 'Retired'];
  }, [systemConfig]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  
  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const maintenanceDue = params.get('maintenanceDue');
    const search = params.get('search');
    const type = params.get('type');
    
    const newFilters: any = {};
    if (maintenanceDue && ['scheduled', 'inProgress', 'completed'].includes(maintenanceDue)) {
      newFilters.maintenanceDue = maintenanceDue;
    }
    if (search) newFilters.search = search;
    if (type) newFilters.type = type;
    
    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...newFilters }));
    }
  }, []);
  
  // Mutations
  const createAssetMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/assets', 'POST', data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Asset created successfully' });
      refetch();
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to create asset',
        variant: 'destructive' 
      });
    }
  });
  
  const updateAssetMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/assets/${id}`, 'PUT', data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Asset updated successfully' });
      refetch();
      setShowEditDialog(false);
      setEditingAsset(null);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to update asset',
        variant: 'destructive' 
      });
    }
  });
  
  const deleteAssetMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/assets/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Asset deleted successfully' });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to delete asset',
        variant: 'destructive' 
      });
    }
  });
  
  // Handlers
  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setShowEditDialog(true);
  };
  
  const handleDelete = (asset: any) => {
    if (confirm(`Are you sure you want to delete asset ${asset.assetId}?`)) {
      deleteAssetMutation.mutate(asset.id);
    }
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      brand: '',
      model: '',
      status: '',
      assignedTo: '',
      maintenanceDue: ''
    });
  };
  
  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {language === 'English' ? (
            <>
              Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, pagination.totalCount)}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, pagination.totalCount)}</span> of{' '}
              <span className="font-medium">{pagination.totalCount}</span> assets
            </>
          ) : (
            <>
              عرض <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, pagination.totalCount)}</span> إلى{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, pagination.totalCount)}</span> من{' '}
              <span className="font-medium">{pagination.totalCount}</span> أصل
            </>
          )}
        </p>
        <div className="flex items-center space-x-2">
          <Label className="text-sm">{translations.perPage}</Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          title={translations.firstPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          title={translations.previousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">
            {language === 'English' 
              ? `Page ${currentPage} of ${pagination.totalPages || 1}`
              : `صفحة ${currentPage} من ${pagination.totalPages || 1}`}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
          disabled={currentPage >= pagination.totalPages}
          title={translations.nextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(pagination.totalPages)}
          disabled={currentPage >= pagination.totalPages}
          title={translations.lastPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{translations.assets}</h1>
        <p className="text-gray-600">{translations.manageAssets}</p>
      </div>
      
      {/* Actions bar */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {translations.addAsset}
        </Button>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          {translations.filters}
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {translations.export}
        </Button>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          {translations.import}
        </Button>
      </div>
      
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={translations.searchPlaceholder}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{translations.filters}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Type filter */}
              <div>
                <Label>{translations.type}</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{translations.all}</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Brand filter */}
              <div>
                <Label>{translations.brand}</Label>
                <Select value={filters.brand} onValueChange={(value) => setFilters({ ...filters, brand: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{translations.all}</SelectItem>
                    {uniqueBrands.map(brand => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status filter */}
              <div>
                <Label>{translations.status}</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{translations.all}</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Maintenance filter */}
              <div>
                <Label>{translations.maintenanceStatus}</Label>
                <Select 
                  value={filters.maintenanceDue || ''} 
                  onValueChange={(value) => setFilters({ ...filters, maintenanceDue: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{translations.all}</SelectItem>
                    <SelectItem value="scheduled">{translations.scheduled}</SelectItem>
                    <SelectItem value="inProgress">{translations.inProgress}</SelectItem>
                    <SelectItem value="completed">{translations.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                {translations.clearFilters}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">{translations.loading}</span>
        </div>
      )}
      
      {/* Assets content */}
      {!isLoading && (
        <>
          <PaginationControls />
          
          {assets.length > 0 ? (
            <AssetsTable 
              assets={assets}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">{translations.noAssets}</p>
            </div>
          )}
          
          {assets.length > 0 && <PaginationControls />}
        </>
      )}
      
      {/* Add Asset Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.addAsset}</DialogTitle>
          </DialogHeader>
          <AssetForm
            onSubmit={(data) => createAssetMutation.mutate(data)}
            isSubmitting={createAssetMutation.isPending}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Asset Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.editAsset}</DialogTitle>
            <DialogDescription>{translations.updateAsset}</DialogDescription>
          </DialogHeader>
          {editingAsset && (
            <AssetForm
              asset={editingAsset}
              onSubmit={(data) => updateAssetMutation.mutate({ id: editingAsset.id, ...data })}
              isSubmitting={updateAssetMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
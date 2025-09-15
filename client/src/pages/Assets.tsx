import { useState, useEffect, useMemo } from 'react';
import { useCurrency } from '@/lib/currencyContext';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,CalendarIcon , Plus, Search, Filter, Download, Upload, RefreshCw, FileUp, DollarSign, FileDown, Package, Wrench, X, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import type { AssetFilters as AssetFiltersType } from '@shared/types';
import AssetFilters from '@/components/assets/AssetFilters';
import AssetForm from '@/components/assets/AssetForm';
import MaintenanceForm from '@/components/assets/MaintenanceForm';
import AssetsTable from '@/components/assets/AssetsTable';
import BulkActions from '@/components/assets/BulkActions';
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
  const { user, hasAccess } = useAuth();
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
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showBulkCheckOutDialog, setShowBulkCheckOutDialog] = useState(false);
  const [showBulkCheckInDialog, setShowBulkCheckInDialog] = useState(false);
  const { formatCurrency } = useCurrency();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Sell assets form state
  const [sellForm, setSellForm] = useState({
    buyer: '',
    saleDate: new Date().toISOString().split('T')[0],
    totalAmount: '',
    notes: ''
  });

// Bulk operation dialogs state
  const [showBulkSellDialog, setShowBulkSellDialog] = useState(false);
  const [showBulkRetireDialog, setShowBulkRetireDialog] = useState(false);
  const [pricingMethod, setPricingMethod] = useState<'total' | 'individual'>('total');
  const [individualPrices, setIndividualPrices] = useState<Record<number, string>>({});
  const [bulkSellData, setBulkSellData] = useState({
    buyer: '',
    saleDate: new Date(),
    totalAmount: '',
    notes: ''
  });
  const [bulkRetireData, setBulkRetireData] = useState({
    reason: '',
    retirementDate: new Date(),
    notes: ''
  });

  // Initialize individual prices when dialog opens
  useEffect(() => {
    if (showBulkSellDialog && pricingMethod === 'individual') {
      const initialPrices: Record<number, string> = {};
      selectedAssets.forEach(id => {
        initialPrices[id] = individualPrices[id] || '';
      });
      setIndividualPrices(initialPrices);
    }
  }, [showBulkSellDialog, pricingMethod, selectedAssets]);

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
    scheduled: language === 'Arabic' ? 'مجدول' : 'Scheduled',
    inProgress: language === 'Arabic' ? 'قيد التنفيذ' : 'In Progress',
    completed: language === 'Arabic' ? 'مكتمل' : 'Completed',
    overdue: language === 'Arabic' ? 'متأخر' : 'Overdue', 
    all: language === 'Arabic' ? 'الكل' : 'All',
    invalidFile: language === 'Arabic' ? 'يرجى اختيار ملف CSV صالح' : 'Please select a valid CSV file',
    perPage: language === 'Arabic' ? 'لكل صفحة:' : 'Per page:',
    showing: language === 'Arabic' ? 'عرض' : 'Showing',
    of: language === 'Arabic' ? 'من' : 'of',
    assets: language === 'Arabic' ? 'أصل' : 'assets',
    page: language === 'Arabic' ? 'صفحة' : 'Page',
    sellAssets: language === 'English' ? 'Sell Assets' : 'بيع الأصول',
    sellAssetsDesc: language === 'English' 
      ? `You are about to sell ${selectedAssets.length} assets. Please provide the sale details.`
      : `أنت على وشك بيع ${selectedAssets.length} أصل. يرجى تقديم تفاصيل البيع.`,
    buyerName: language === 'English' ? 'Buyer Name' : 'اسم المشتري',
    enterBuyerName: language === 'English' ? 'Enter buyer name' : 'أدخل اسم المشتري',
    pickDate: language === 'English' ? 'Pick a date' : 'اختر التاريخ',
    pricingMethod: language === 'English' ? 'Pricing Method' : 'طريقة التسعير',
    totalPricing: language === 'English' ? 'Total Amount for All' : 'المبلغ الإجمالي للجميع',
    individualPricing: language === 'English' ? 'Individual Pricing' : 'التسعير الفردي',
    totalSaleAmount: language === 'English' ? 'Total Sale Amount' : 'إجمالي مبلغ البيع',
    enterAmount: language === 'English' ? 'Enter amount' : 'أدخل المبلغ',
    pricePerAsset: language === 'English' ? 'Price' : 'السعر',
    notesOptional: language === 'English' ? 'Notes (Optional)' : 'ملاحظات (اختياري)',
    additionalNotesSale: language === 'English' 
      ? 'Additional notes about this sale...' 
      : 'ملاحظات إضافية حول هذا البيع...',
    selectedAssetsPreview: language === 'English' ? 'Selected Assets:' : 'الأصول المحددة:',
    andMore: language === 'English' ? 'and' : 'و',
    more: language === 'English' ? 'more' : 'أكثر',
    confirmSale: language === 'English' ? 'Confirm Sale' : 'تأكيد البيع',
    totalCalculated: language === 'English' ? 'Total:' : 'المجموع:',
    fillAllPrices: language === 'English' ? 'Please fill in all asset prices' : 'يرجى ملء جميع أسعار الأصول',
    
    // Bulk Retire Dialog translations
    retireAssets: language === 'English' ? 'Retire Assets' : 'سحب الأصول',
    retireAssetsDesc: language === 'English' 
      ? `You are about to retire ${selectedAssets.length} assets. Please provide the retirement details.`
      : `أنت على وشك سحب ${selectedAssets.length} أصل. يرجى تقديم تفاصيل السحب.`,
    retirementReason: language === 'English' ? 'Retirement Reason' : 'سبب السحب',
    selectReason: language === 'English' ? 'Select a reason' : 'اختر السبب',
    obsolete: language === 'English' ? 'Obsolete/End of Life' : 'قديم/نهاية العمر',
    damagedBeyondRepair: language === 'English' ? 'Damaged Beyond Repair' : 'تالف بشكل لا يمكن إصلاحه',
    lostOrStolen: language === 'English' ? 'Lost or Stolen' : 'مفقود أو مسروق',
    donated: language === 'English' ? 'Donated' : 'تبرع',
    replacedByNew: language === 'English' ? 'Replaced by New Asset' : 'استبدل بأصل جديد',
    other: language === 'English' ? 'Other' : 'آخر',
    retirementDate: language === 'English' ? 'Retirement Date' : 'تاريخ السحب',
    additionalNotes: language === 'English' ? 'Additional Notes (Optional)' : 'ملاحظات إضافية (اختياري)',
    additionalDetailsRetirement: language === 'English' 
      ? 'Additional details about the retirement...' 
      : 'تفاصيل إضافية حول السحب...',
    confirmRetirement: language === 'English' ? 'Confirm Retirement' : 'تأكيد السحب',
    provideRetirementReason: language === 'English' ? 'Please provide a retirement reason' : 'يرجى تقديم سبب السحب',
    fillRequiredFields: language === 'English' ? 'Please fill in all required fields' : 'يرجى ملء جميع الحقول المطلوبة',
    
    // Missing filter and UI translations
    filterSearchAssets: language === 'Arabic' ? 'تصفية والبحث في الأصول' : 'Filter & Search Assets',
    searchPlaceholder: language === 'Arabic' ? 'البحث بمعرف الأصل، النوع، العلامة التجارية، الموديل، الرقم التسلسلي...' : 'Search by Asset ID, Type, Brand, Model, Serial Number...',
    search: language === 'Arabic' ? 'بحث' : 'Search',
    type: language === 'Arabic' ? 'النوع' : 'Type',
    status: language === 'Arabic' ? 'الحالة' : 'Status',
    brand: language === 'Arabic' ? 'العلامة التجارية' : 'Brand',
    assignment: language === 'Arabic' ? 'التخصيص' : 'Assignment',
    allTypes: language === 'Arabic' ? 'جميع الأنواع' : 'All Types',
    allStatuses: language === 'Arabic' ? 'جميع الحالات' : 'All Statuses',
    allBrands: language === 'Arabic' ? 'جميع العلامات التجارية' : 'All Brands',
    allAssignments: language === 'Arabic' ? 'جميع التخصيصات' : 'All Assignments',
    unassigned: language === 'Arabic' ? 'غير مخصص' : 'Unassigned',
    totalAssets: language === 'Arabic' ? 'إجمالي الأصول' : 'total assets',
    searchEmployees: language === 'Arabic' ? 'البحث عن الموظفين...' : 'Search employees...',
    noEmployeesFound: language === 'Arabic' ? 'لم يتم العثور على موظفين.' : 'No employees found.',
    maintenanceStatus: language === 'Arabic' ? 'حالة الصيانة' : 'Maintenance Status',
    exportCsv: language === 'Arabic' ? 'تصدير CSV' : 'Export CSV'
  };

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFilters: AssetFiltersType = {};
    
    const assignedTo = urlParams.get('assignedTo');
    if (assignedTo) urlFilters.assignedTo = assignedTo;
    
    const type = urlParams.get('type');
    if (type) urlFilters.type = type;
    
    const brand = urlParams.get('brand');
    if (brand) urlFilters.brand = brand;
    
    const status = urlParams.get('status');
    if (status) urlFilters.status = status;
    
    const search = urlParams.get('search');
    if (search) {
      urlFilters.search = search;
      setSearchInput(search);
    }

    const maintenanceDue = urlParams.get('maintenanceDue');
    if (maintenanceDue && ['scheduled', 'inProgress', 'completed', 'overdue'].includes(maintenanceDue)) {
      urlFilters.maintenanceDue = maintenanceDue as 'scheduled' | 'inProgress' | 'completed' | 'overdue';
    }
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, []);

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
    queryKey: ['/api/assets/paginated', queryParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams(queryParams);
      const response = await apiRequest(`/api/assets/paginated?${searchParams}`);
      return response;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 10, // Add this - 10 seconds
    gcTime: 1000 * 60 * 2, // Add this - 2 minutes
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

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 5, // Add - 5 minutes
    gcTime: 1000 * 60 * 10, // Add - 10 minutes
  });

  const { data: employeesWithAssetsData } = useQuery({
    queryKey: ['employees-with-assets'],
    queryFn: async () => {
      const response = await fetch('/api/employees/with-assets', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employees with assets');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: customAssetTypes = [] } = useQuery({
  queryKey: ['/api/custom-asset-types'],
  staleTime: 1000 * 60 * 10, // Add - 10 minutes
  gcTime: 1000 * 60 * 20, // Add - 20 minutes
  });

  const { data: customAssetBrands = [] } = useQuery({
    queryKey: ['/api/custom-asset-brands'],
    staleTime: 1000 * 60 * 10, // Add - 10 minutes
    gcTime: 1000 * 60 * 20, // Add - 20 minutes
  });

  const { data: assetStatuses = [] } = useQuery({
    queryKey: ['/api/custom-asset-statuses'],
    select: (data: any[]) => data.map(status => status.name),
    staleTime: 1000 * 60 * 10, // Add - 10 minutes
    gcTime: 1000 * 60 * 20, // Add - 20 minutes
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // All your mutations remain the same
  const addAssetMutation = useMutation({
    mutationFn: (assetData: any) => apiRequest('/api/assets', 'POST', assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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
        description: error.message || 'Failed to add asset',
        variant: 'destructive',
      });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, ...assetData }: any) => apiRequest(`/api/assets/${id}`, 'PUT', assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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
        description: error.message || 'Failed to update asset',
        variant: 'destructive',
      });
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (assetId: number) => apiRequest(`/api/assets/${assetId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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
    mutationFn: (saleData: any) => apiRequest('/api/assetssell', 'POST', saleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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


  const addMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceData: any) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] });
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
    if (!editingAsset) return;
    updateAssetMutation.mutate({ id: editingAsset.id, ...assetData });
  };

  const handleAddMaintenance = (assetId: number) => {
    const asset = assets.find((a: any) => a.id === assetId);
    setMaintenanceAsset(asset);
    setOpenMaintenanceDialog(true);
  };

  const handleMaintenanceSubmit = (maintenanceData: any) => {
    addMaintenanceMutation.mutate(maintenanceData);
  };

  const handleSelectAll = () => {
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map((asset: any) => asset.id));
    }
  };

  // Handler for bulk sell confirmation
  const handleBulkSellConfirm = async () => {
    // Validation based on pricing method
    if (pricingMethod === 'total') {
      if (!bulkSellData.buyer || !bulkSellData.totalAmount) {
        toast({
          title: translations.error,
          description: translations.fillRequiredFields,
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!bulkSellData.buyer) {
        toast({
          title: translations.error,
          description: translations.fillRequiredFields,
          variant: 'destructive',
        });
        return;
      }
      
      // Check if all individual prices are filled
      const allPricesFilled = selectedAssets.every(id => 
        individualPrices[id] && parseFloat(individualPrices[id]) > 0
      );
      
      if (!allPricesFilled) {
        toast({
          title: translations.error,
          description: translations.fillAllPrices,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      toast({
        title: translations.processing || 'Processing...',
        description: `Selling ${selectedAssets.length} assets...`,
      });

      // Calculate total amount based on pricing method
      let totalAmount = 0;
      let saleNotes = bulkSellData.notes || `Bulk sale to ${bulkSellData.buyer}`;
      
      if (pricingMethod === 'total') {
        totalAmount = parseFloat(bulkSellData.totalAmount);
      } else {
        // Sum up individual prices
        totalAmount = selectedAssets.reduce((sum, id) => {
          return sum + parseFloat(individualPrices[id] || '0');
        }, 0);
        
        // Add individual pricing details to notes
        const pricingDetails = assets
          .filter((asset: any) => selectedAssets.includes(asset.id))
          .map((asset: any) => `${asset.assetId}: ${formatCurrency(parseFloat(individualPrices[asset.id]))}`)
          .join(', ');
        
        saleNotes = `${saleNotes}\nIndividual Pricing: ${pricingDetails}`;
      }

      const response = await apiRequest('/api/assets/sell', 'POST', {
        assetIds: selectedAssets,
        buyer: bulkSellData.buyer,
        saleDate: bulkSellData.saleDate.toISOString().split('T')[0],
        totalAmount: totalAmount,
        notes: saleNotes,
        pricingMethod: pricingMethod,
        individualPrices: pricingMethod === 'individual' ? individualPrices : undefined
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/assets'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/asset-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] })
      ]);
      
      await refetch();

      toast({
        title: translations.success,
        description: response.message || `Successfully sold ${selectedAssets.length} assets`,
      });

      // Reset everything
      setSelectedAssets([]);
      setShowBulkSellDialog(false);
      setPricingMethod('total');
      setIndividualPrices({});
      setBulkSellData({
        buyer: '',
        saleDate: new Date(),
        totalAmount: '',
        notes: ''
      });

    } catch (error: any) {
      console.error('Bulk sell error:', error);
      toast({
        title: translations.error,
        description: error.message || 'Failed to sell assets',
        variant: 'destructive',
      });
    }
  };

  // Handler for bulk retire confirmation
  const handleBulkRetireConfirm = async () => {
    if (!bulkRetireData.reason) {
      toast({
        title: translations.error || 'Error',
        description: 'Please provide a retirement reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: translations.processing || 'Processing...',
        description: `Retiring ${selectedAssets.length} assets...`,
      });

      const response = await apiRequest('/api/assets/retire', 'POST', {
        assetIds: selectedAssets,
        reason: bulkRetireData.reason,
        retirementDate: bulkRetireData.retirementDate.toISOString(),
        notes: bulkRetireData.notes
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/assets/paginated'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/assets'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/asset-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/summary'] })
      ]);
      
      await refetch();

      toast({
        title: translations.success,
        description: response.message || `Successfully retired ${selectedAssets.length} assets`,
      });

      setSelectedAssets([]);
      setShowBulkRetireDialog(false);
      setBulkRetireData({
        reason: '',
        retirementDate: new Date(),
        notes: ''
      });

    } catch (error: any) {
      console.error('Bulk retire error:', error);
      toast({
        title: translations.error,
        description: error.message || 'Failed to retire assets',
        variant: 'destructive',
      });
    }
  };

  const handleExportFilteredAssets = () => {
    if (assets.length === 0) {
      toast({
        title: translations.error,
        description: 'No assets to export',
        variant: 'destructive',
      });
      return;
    }
    
    const headers = ['Asset ID', 'Type', 'Brand', 'Model', 'Serial Number', 'CPU', 'RAM', 'Storage', 'Status', 'Assigned To'];
    const csvContent = [
      headers.join(','),
      ...assets.map((asset: any) => {
        const assignedEmployee = employees?.find((e: any) => e.id === asset.assignedEmployeeId);
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
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: translations.success,
      description: `Exported ${assets.length} assets successfully`,
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

    // Process employees who have assets assigned - optimized version
   const employeesWithAssets = useMemo(() => {
    // Use the data from our dedicated API endpoint
    if (!employeesWithAssetsData || !Array.isArray(employeesWithAssetsData)) {
      return [];
    }
    return employeesWithAssetsData;
    }, [employeesWithAssetsData]);

      const hasUnassignedAssets = useMemo(() => {
      if (!assets || !Array.isArray(assets)) return false;
      
      // Use some() for early exit on first unassigned asset
      return assets.some((asset: any) => !asset.assignedEmployeeId);
     }, [assets]);

  const getEmployeeDisplay = (employeeId: string | undefined) => {
    if (!employeeId || employeeId === 'all') return translations.allAssignments;
    if (employeeId === 'unassigned') return translations.unassigned;
    const employee = employees?.find((emp: any) => emp.id.toString() === employeeId);
    return employee ? (employee.englishName || employee.name) : translations.allAssignments;
  };

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-4">
        {/* Add BulkActions button here on the left */}
        <BulkActions
          selectedAssets={selectedAssets}
          availableAssets={assets}
          currentUser={user}
          onSelectionChange={setSelectedAssets}
          onRefresh={refetch}
          onSellRequest={() => setShowBulkSellDialog(true)}
          onRetireRequest={() => setShowBulkRetireDialog(true)}
        />
        
        {/* Showing text */}
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {translations.showing} {Math.min((currentPage - 1) * itemsPerPage + 1, pagination.totalCount)} - {' '}
          {Math.min(currentPage * itemsPerPage, pagination.totalCount)} {translations.of} {' '}
          {pagination.totalCount} {translations.assets}
        </p>
        
        {/* Items per page selector */}
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
      
      {/* Keep pagination buttons on the right */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium">
              {translations.page} {currentPage} {translations.of} {pagination.totalPages || 1}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={currentPage >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(pagination.totalPages)}
            disabled={currentPage >= pagination.totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );

  return (
    <>
      <Helmet>
        <title>{translations.title} | SimpleIT v0.3.6</title>
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
                disabled={assets.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {translations.exportCsv} ({pagination.totalCount})
              </Button>
            )}
            
            {hasAccess(2) && (
              <Button 
                size="sm"
                onClick={() => {
                  setEditingAsset(null);
                  setOpenDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {translations.addAsset}
              </Button>
            )}
          </div>
        </div>

        {/* Filter & Search Card - keeping all original filters */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-lg">{translations.filterSearchAssets}</CardTitle>
                {Object.values(filters).filter(Boolean).length > 0 && (
                  <Badge variant="secondary">{Object.values(filters).filter(Boolean).length}</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {pagination.totalCount} {translations.totalAssets}
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
                  placeholder={translations.searchPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline">
                {translations.search}
              </Button>
            </form>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             
             {/* Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">{translations.type}</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => setFilters({ ...filters, type: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={translations.allTypes} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">{translations.allTypes}</SelectItem>
                  {customAssetTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">{translations.status}</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={translations.allStatuses} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">{translations.allStatuses}</SelectItem>
                  {assetStatuses.map((status: string) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">{translations.brand}</label>
              <Select
                value={filters.brand || 'all'}
                onValueChange={(value) => setFilters({ ...filters, brand: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={translations.allBrands} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">{translations.allBrands}</SelectItem>
                  {customAssetBrands.map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.name}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              {/* Assignment Filter with Combobox */}
              <div>
                <label className="text-sm font-medium mb-2 block">{translations.assignment}</label>
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
                        placeholder={translations.searchEmployees} 
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>{translations.noEmployeesFound}</CommandEmpty>
                        <CommandGroup>
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
                            {translations.allAssignments}
                          </CommandItem>
                          
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
                              {translations.unassigned}
                            </CommandItem>
                          )}
                          
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

           {/* Maintenance Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {translations.maintenanceStatus || 'Maintenance Status'}
              </label>
              <Select
                value={filters.maintenanceDue || 'all'}
                onValueChange={(value) => setFilters({ ...filters, maintenanceDue: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={translations.allStatuses || 'All Statuses'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.all || 'All'}</SelectItem>
                  <SelectItem value="scheduled">{translations.scheduled || 'Scheduled'}</SelectItem>
                  <SelectItem value="inProgress">{translations.inProgress || 'In Progress'}</SelectItem>
                  <SelectItem value="completed">{translations.completed || 'Completed'}</SelectItem>
                  <SelectItem value="overdue">{translations.overdue || 'Overdue'}</SelectItem>  {/* ADD THIS LINE */}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pagination Controls Top */}
        {!isLoading && <PaginationControls />}

        {/* Assets Table */}
            {isLoading && !assets.length ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <AssetsTable 
                assets={assets}
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
                onAddMaintenance={(assetId) => handleAddMaintenance(assetId)}
              />
            )}
        
        {/* Pagination Controls Bottom */}
        {!isLoading && assets.length > 0 && <PaginationControls />}

        {/* Add/Edit Asset Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"> 
            <DialogHeader>
              <DialogTitle>
                {editingAsset 
                  ? `${translations.editAsset} (${editingAsset.assetId})` 
                  : translations.addAsset}
              </DialogTitle>
              <DialogDescription>
                {editingAsset 
                  ? 'Update the asset information below' 
                  : 'Fill in the details to add a new asset'}
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Add Maintenance Record
              </DialogTitle>
              <DialogDescription>
                Add a detailed maintenance record to track service work and repairs
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

        {/* Sell Assets Dialog */}
        <Dialog open={openSellDialog} onOpenChange={setOpenSellDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translations.sellSelected}</DialogTitle>
              <DialogDescription>
                Sell {selectedAssets.length} selected assets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{translations.buyer}</Label>
                <Input
                  value={sellForm.buyer}
                  onChange={(e) => setSellForm({ ...sellForm, buyer: e.target.value })}
                  placeholder="Enter buyer name"
                />
              </div>
              <div>
                <Label>{translations.saleDate}</Label>
                <Input
                  type="date"
                  value={sellForm.saleDate}
                  onChange={(e) => setSellForm({ ...sellForm, saleDate: e.target.value })}
                />
              </div>
              <div>
                <Label>{translations.totalAmount}</Label>
                <Input
                  type="number"
                  value={sellForm.totalAmount}
                  onChange={(e) => setSellForm({ ...sellForm, totalAmount: e.target.value })}
                  placeholder="Enter total amount"
                />
              </div>
              <div>
                <Label>{translations.notes}</Label>
                <Textarea
                  value={sellForm.notes}
                  onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenSellDialog(false)}>
                  {translations.cancel}
                </Button>
                <Button onClick={handleSellAssets}>
                  {translations.sell}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Bulk Sell Dialog */}
      <Dialog open={showBulkSellDialog} onOpenChange={(open) => {
        setShowBulkSellDialog(open);
        if (!open) {
          setPricingMethod('total');
          setIndividualPrices({});
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.sellAssets}</DialogTitle>
            <DialogDescription>{translations.sellAssetsDesc}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="buyer" className="required">
                {translations.buyerName} *
              </Label>
              <Input
                id="buyer"
                value={bulkSellData.buyer}
                onChange={(e) => setBulkSellData({ ...bulkSellData, buyer: e.target.value })}
                placeholder={translations.enterBuyerName}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="saleDate" className="required">
                {translations.saleDate} *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !bulkSellData.saleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkSellData.saleDate ? format(bulkSellData.saleDate, "PPP") : translations.pickDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={bulkSellData.saleDate}
                    onSelect={(date) => date && setBulkSellData({ ...bulkSellData, saleDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Pricing Method Selection */}
            <div className="grid gap-2">
              <Label>{translations.pricingMethod}</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingMethod"
                    value="total"
                    checked={pricingMethod === 'total'}
                    onChange={() => setPricingMethod('total')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{translations.totalPricing}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pricingMethod"
                    value="individual"
                    checked={pricingMethod === 'individual'}
                    onChange={() => setPricingMethod('individual')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{translations.individualPricing}</span>
                </label>
              </div>
            </div>
            
            {/* Pricing Input based on method */}
            {pricingMethod === 'total' ? (
              <div className="grid gap-2">
                <Label htmlFor="totalAmount" className="required">
                  {translations.totalSaleAmount} *
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkSellData.totalAmount}
                  onChange={(e) => setBulkSellData({ ...bulkSellData, totalAmount: e.target.value })}
                  placeholder={translations.enterAmount}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label>{translations.individualPricing} *</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {assets
                      .filter((asset: any) => selectedAssets.includes(asset.id))
                      .map((asset: any) => (
                        <div key={asset.id} className="flex items-center gap-2">
                          <span className="text-sm flex-1">
                            {asset.assetId} - {asset.type} ({asset.brand})
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={individualPrices[asset.id] || ''}
                            onChange={(e) => setIndividualPrices({
                              ...individualPrices,
                              [asset.id]: e.target.value
                            })}
                            placeholder={translations.pricePerAsset}
                            className="w-32"
                          />
                        </div>
                      ))}
                  </div>
                  {pricingMethod === 'individual' && selectedAssets.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-center font-medium">
                        <span>{translations.totalCalculated}</span>
                        <span>
                          {formatCurrency(
                            selectedAssets.reduce((sum, id) => {
                              return sum + parseFloat(individualPrices[id] || '0');
                            }, 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="saleNotes">{translations.notesOptional}</Label>
              <Textarea
                id="saleNotes"
                value={bulkSellData.notes}
                onChange={(e) => setBulkSellData({ ...bulkSellData, notes: e.target.value })}
                placeholder={translations.additionalNotesSale}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkSellDialog(false);
                setPricingMethod('total');
                setIndividualPrices({});
              }}
            >
              {translations.cancel}
            </Button>
            <Button
              onClick={handleBulkSellConfirm}
              disabled={
                !bulkSellData.buyer || 
                (pricingMethod === 'total' && !bulkSellData.totalAmount) ||
                (pricingMethod === 'individual' && !selectedAssets.every(id => individualPrices[id]))
              }
            >
              {translations.confirmSale}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Retire Dialog */}
      <Dialog open={showBulkRetireDialog} onOpenChange={setShowBulkRetireDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{translations.retireAssets}</DialogTitle>
            <DialogDescription>{translations.retireAssetsDesc}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="retireReason" className="required">
                {translations.retirementReason} *
              </Label>
              <Select
                value={bulkRetireData.reason}
                onValueChange={(value) => setBulkRetireData({ ...bulkRetireData, reason: value })}
              >
                <SelectTrigger id="retireReason">
                  <SelectValue placeholder={translations.selectReason} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Obsolete">{translations.obsolete}</SelectItem>
                  <SelectItem value="Damaged">{translations.damagedBeyondRepair}</SelectItem>
                  <SelectItem value="Lost">{translations.lostOrStolen}</SelectItem>
                  <SelectItem value="Donated">{translations.donated}</SelectItem>
                  <SelectItem value="Replaced">{translations.replacedByNew}</SelectItem>
                  <SelectItem value="Other">{translations.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="retirementDate" className="required">
                {translations.retirementDate} *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !bulkRetireData.retirementDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkRetireData.retirementDate ? format(bulkRetireData.retirementDate, "PPP") : translations.pickDate}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={bulkRetireData.retirementDate}
                    onSelect={(date) => date && setBulkRetireData({ ...bulkRetireData, retirementDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="retireNotes">{translations.additionalNotes}</Label>
              <Textarea
                id="retireNotes"
                value={bulkRetireData.notes}
                onChange={(e) => setBulkRetireData({ ...bulkRetireData, notes: e.target.value })}
                placeholder={translations.additionalDetailsRetirement}
                rows={3}
              />
            </div>
            
            {/* Selected assets preview */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium mb-2">{translations.selectedAssetsPreview}</p>
              <div className="max-h-32 overflow-y-auto">
                {assets
                  .filter((asset: any) => selectedAssets.includes(asset.id))
                  .slice(0, 5)
                  .map((asset: any) => (
                    <div key={asset.id} className="text-sm text-muted-foreground">
                      • {asset.assetId} - {asset.type} ({asset.brand})
                    </div>
                  ))}
                {selectedAssets.length > 5 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ...{translations.andMore} {selectedAssets.length - 5} {translations.more}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkRetireDialog(false)}>
              {translations.cancel}
            </Button>
            <Button
              onClick={handleBulkRetireConfirm}
              disabled={!bulkRetireData.reason}
            >
              {translations.confirmRetirement}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
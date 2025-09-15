import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/hooks/use-language';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Calendar as CalendarIcon, User, Package, FileDown, Filter, Eye, Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/currencyContext';



interface Asset {
  id: number;
  assetId: string;
  type: string;
  brand?: string;
  modelName?: string;
  serialNumber?: string;
  location?: string;
  status?: string;
  operatingSystem?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  condition?: string;
}

interface Employee {
  id: number;
  englishName?: string;
  arabicName?: string;
  department?: string;
}

interface TransactionWithRelations {
  id: number;
  assetId: number;
  employeeId?: number;
  type: string;
  date?: string;
  transactionDate?: string;
  notes?: string;
  conditionNotes?: string;
  deviceSpecs?: {
    serialNumber?: string;
    condition?: string;
    operatingSystem?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    location?: string;
    status?: string;
  };
  asset?: Asset;
  employee?: Employee;
}

export default function AssetHistory() {
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    assetId: '',
    employeeId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [dateFromSelected, setDateFromSelected] = useState<Date | undefined>(undefined);
  const [dateToSelected, setDateToSelected] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const [assetSearchValue, setAssetSearchValue] = useState('');
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  // Translations
  const translations = {
    title: language === 'English' ? 'Asset History' : 'سجل الأصول',
    description: language === 'English' 
      ? 'Track and manage all asset check-in and check-out activities with detailed history and device specifications' 
      : 'تتبع وإدارة جميع أنشطة تسجيل الوصول والمغادرة للأصول مع سجل تفصيلي ومواصفات الجهاز',
    metaDescription: language === 'English' 
      ? 'Track and manage all asset check-in and check-out activities with detailed history and device specifications' 
      : 'تتبع وإدارة جميع أنشطة تسجيل الوصول والمغادرة للأصول مع سجل تفصيلي ومواصفات الجهاز',
    filterSearch: language === 'English' ? 'Filter & Search Asset History' : 'تصفية وبحث سجل الأصول',
    show: language === 'English' ? 'Show:' : 'عرض:',
    transactionHistory: language === 'English' ? 'Transaction History' : 'تاريخ المعاملات',
    search: language === 'English' ? 'Search transactions...' : 'البحث في المعاملات...',
    transactionType: language === 'English' ? 'Transaction Type' : 'نوع المعاملة',
    transactionDetails: language === 'English' ? 'Transaction Details' : 'تفاصيل المعاملة',
    transactionID: language === 'English' ? 'Transaction ID' : 'رقم المعاملة',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    assetId: language === 'English' ? 'Asset ID' : 'رقم الأصل',
    employee: language === 'English' ? 'Employee' : 'الموظف',
    dateFrom: language === 'English' ? 'Date From' : 'التاريخ من',
    dateTo: language === 'English' ? 'Date To' : 'التاريخ إلى',
    all: language === 'English' ? 'All' : 'الكل',
    checkIn: language === 'English' ? 'Check In' : 'تسجيل الدخول',
    checkOut: language === 'English' ? 'Check Out' : 'تسجيل الخروج',
    assignment: language === 'English' ? 'Assignment' : 'تخصيص',
    maintenance: language === 'English' ? 'Maintenance' : 'صيانة',
    sale: language === 'English' ? 'Sale' : 'بيع',
    retirement: language === 'English' ? 'Retirement' : 'تقاعد',
    upgrade: language === 'English' ? 'Upgrade' : 'ترقية',
    sold: language === 'English' ? 'Sold' : 'مباع',
    retired: language === 'English' ? 'Retired' : 'متقاعد',
    id: language === 'English' ? 'ID' : 'المعرف',
    type: language === 'English' ? 'Type' : 'النوع',
    date: language === 'English' ? 'Date' : 'التاريخ',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    deviceSpecs: language === 'English' ? 'Device Specifications' : 'مواصفات الجهاز',
    serialNumber: language === 'English' ? 'Serial Number' : 'الرقم التسلسلي',
    condition: language === 'English' ? 'Condition' : 'الحالة',
    operatingSystem: language === 'English' ? 'Operating System' : 'نظام التشغيل',
    processor: language === 'English' ? 'Processor' : 'المعالج',
    ram: language === 'English' ? 'RAM' : 'الذاكرة العشوائية',
    storage: language === 'English' ? 'Storage' : 'التخزين',
    location: language === 'English' ? 'Location' : 'الموقع',
    status: language === 'English' ? 'Status' : 'الحالة',
    export: language === 'English' ? 'Export' : 'تصدير',
    clearFilters: language === 'English' ? 'Clear Filters' : 'مسح المرشحات',
    exportSuccess: language === 'English' ? 'Data exported successfully' : 'تم تصدير البيانات بنجاح',
    exportError: language === 'English' ? 'Failed to export data' : 'فشل تصدير البيانات',
    noDataToExport: language === 'English' ? 'No data to export' : 'لا توجد بيانات للتصدير',
    searchAssets: language === 'English' ? 'Search assets...' : 'البحث عن الأصول...',
    searchEmployees: language === 'English' ? 'Search employees...' : 'البحث عن الموظفين...',
    noAssetsFound: language === 'English' ? 'No assets found' : 'لم يتم العثور على أصول',
    noEmployeesFound: language === 'English' ? 'No employees found' : 'لم يتم العثور على موظفين',
    saleDetails: language === 'English' ? 'Sale Details' : 'تفاصيل البيع',
    retirementDetails: language === 'English' ? 'Retirement Details' : 'تفاصيل التقاعد',
    maintenanceDetails: language === 'English' ? 'Maintenance Details' : 'تفاصيل الصيانة',
    buyer: language === 'English' ? 'Buyer' : 'المشتري',
    saleDate: language === 'English' ? 'Sale Date' : 'تاريخ البيع',
    salePrice: language === 'English' ? 'Sale Price' : 'سعر البيع',
    retirementReason: language === 'English' ? 'Retirement Reason' : 'سبب التقاعد',
    retirementDate: language === 'English' ? 'Retirement Date' : 'تاريخ التقاعد',
    maintenanceType: language === 'English' ? 'Maintenance Type' : 'نوع الصيانة',
    maintenanceCost: language === 'English' ? 'Cost' : 'التكلفة',
    provider: language === 'English' ? 'Provider' : 'المزود',
    generalNotes: language === 'English' ? 'General Notes' : 'ملاحظات عامة',
    exportedTransactions: language === 'English' ? 'transactions' : 'معاملات',
    conditionNotes: language === 'English' ? 'Condition Notes' : 'ملاحظات الحالة',
    price: language === 'English' ? 'Price' : 'السعر',
    // Pagination
    previous: language === 'English' ? 'Previous' : 'السابق',
    next: language === 'English' ? 'Next' : 'التالي',
    page: language === 'English' ? 'Page' : 'صفحة',
    of: language === 'English' ? 'of' : 'من',
    noTransactionRecords: language === 'English' ? 'No transaction records found' : 'لم يتم العثور على سجلات المعاملات',
    // Dialog labels
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    assetInformation: language === 'English' ? 'Asset Information' : 'معلومات الأصل',
    currentStatus: language === 'English' ? 'Current Status' : 'الحالة الحالية',
    cpu: language === 'English' ? 'CPU' : 'المعالج',
    upgradeDetails: language === 'English' ? 'Upgrade Details' : 'تفاصيل الترقية',
    upgradeTitle: language === 'English' ? 'Title' : 'العنوان',
    upgradeCategory: language === 'English' ? 'Category' : 'الفئة',
    upgradeType: language === 'English' ? 'Upgrade Type' : 'نوع الترقية',
    upgradePriority: language === 'English' ? 'Priority' : 'الأولوية',
    upgradeStatus: language === 'English' ? 'Status' : 'الحالة',
    estimatedCost: language === 'English' ? 'Estimated Cost' : 'التكلفة المقدرة',
    upgradeDescription: language === 'English' ? 'Description' : 'الوصف',
    perPage: language === 'English' ? 'per page' : 'لكل صفحة',
    // Table content labels
    brandModel: language === 'English' ? 'Brand & Model' : 'الماركة والموديل',
    deviceSpecsAt: language === 'English' ? 'Device Specs at' : 'مواصفات الجهاز في',
    recorded: language === 'English' ? 'Recorded' : 'مسجل',
    notAvailable: language === 'English' ? 'Not Available' : 'غير متوفر',
    reason: language === 'English' ? 'Reason' : 'السبب',
    typeLabel: language === 'English' ? 'Type' : 'النوع',
    costLabel: language === 'English' ? 'Cost' : 'التكلفة',
    providerLabel: language === 'English' ? 'Provider' : 'المزود',
    statusLabel: language === 'English' ? 'Status' : 'الحالة',
    // Pagination text
    showing: language === 'English' ? 'Showing' : 'عرض',
    to: language === 'English' ? 'to' : 'إلى',
    results: language === 'English' ? 'results' : 'نتيجة',
    lowPriority: language === 'English' ? 'Low' : 'منخفض',
    // Additional CSV headers
    transactionDate: language === 'English' ? 'Transaction Date' : 'تاريخ المعاملة',
    assetType: language === 'English' ? 'Asset Type' : 'نوع الأصل',
    assetBrand: language === 'English' ? 'Asset Brand' : 'ماركة الأصل',
    assetModel: language === 'English' ? 'Asset Model' : 'موديل الأصل',
    employeeID: language === 'English' ? 'Employee ID' : 'رقم الموظف',
    employeeNameEnglish: language === 'English' ? 'Employee Name (English)' : 'اسم الموظف (إنجليزي)',
    employeeNameArabic: language === 'English' ? 'Employee Name (Arabic)' : 'اسم الموظف (عربي)',
    employeeDepartment: language === 'English' ? 'Employee Department' : 'قسم الموظف',
    deviceCondition: language === 'English' ? 'Device Condition' : 'حالة الجهاز',
    notAssigned: language === 'English' ? 'Not assigned' : 'غير مخصص',
    completeTransactionInfo: language === 'English' ? 'Complete transaction information and device specifications' : 'معلومات المعاملة الكاملة ومواصفات الجهاز',
    
    // Add missing card description translations
    filterSearchDescription: language === 'English' 
      ? 'Filter and search through asset transaction history with device specifications' 
      : 'تصفية والبحث في سجل معاملات الأصول مع مواصفات الجهاز',
    transactionHistoryDescription: language === 'English' 
      ? 'Complete history of asset transactions with device specifications at time of change' 
      : 'تاريخ كامل لمعاملات الأصول مع مواصفات الجهاز في وقت التغيير'
  };

      // Fetch transaction history
      const { data: transactionsData, isLoading, refetch } = useQuery({
        queryKey: ['/api/asset-transactions', filters, currentPage, pageSize],
        queryFn: async () => {
          const params = new URLSearchParams();
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
          });
          params.append('page', currentPage.toString());
          params.append('limit', pageSize.toString());
          params.append('include', 'asset,employee');
          
          const response = await fetch(`/api/asset-transactions?${params.toString()}`, {
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch transactions');
          }
          
          const result = await response.json();
        // Handle the enhanced route response format
        return {
          transactions: result.transactions || result.data || [],
          pagination: result.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: pageSize }
        };
        },
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true
      });

  // Fetch assets for filter dropdown
    const { data: assetsResponse } = useQuery({
      queryKey: ['/api/assets'],
      queryFn: async () => {
        const response = await fetch('/api/assets', {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        return response.json();
      }
    });

  // Fetch employees for filter dropdown
  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    }
  });

    const pagination = transactionsData?.pagination;

    
    // Safely handle assets and employees arrays
    const assets = useMemo(() => {
      if (!assetsResponse) return [];
      if (Array.isArray(assetsResponse)) return assetsResponse;
      if (assetsResponse.data && Array.isArray(assetsResponse.data)) return assetsResponse.data;
      return [];
    }, [assetsResponse]);

    const employeesList = useMemo(() => {
      if (!employees) return [];
      if (Array.isArray(employees)) return employees;
      if (employees.data && Array.isArray(employees.data)) return employees.data;
      return [];
    }, [employees]);

    // Safely extract transactions with multiple fallbacks
    const transactions = useMemo(() => {
      if (!transactionsData) return [];
      if (Array.isArray(transactionsData)) return transactionsData;
      if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
        return transactionsData.transactions;
      }
      if (transactionsData.data && Array.isArray(transactionsData.data)) {
        return transactionsData.data;
      }
      return [];
    }, [transactionsData]);

      //debugging code
    useEffect(() => {
        if (transactions && transactions.length > 0) {
          const upgradeTransactions = transactions.filter(t => t.type === 'Upgrade');
          console.log('[AssetHistory] Total transactions:', transactions.length);
          console.log('[AssetHistory] Upgrade transactions:', upgradeTransactions.length);
          if (upgradeTransactions.length > 0) {
            console.log('[AssetHistory] Sample upgrade:', upgradeTransactions[0]);
          }
        }
      }, [transactions]);

    // Filter transactions locally for display with safety check
    const filteredTransactions = useMemo(() => {
      // Ensure transactions is an array before filtering
      if (!transactions || !Array.isArray(transactions)) {
        console.warn('Transactions is not an array:', transactions);
        return [];
      }

      try {
        return transactions.filter((transaction: TransactionWithRelations) => {
          // Ensure transaction exists
          if (!transaction) return false;
          
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch = 
              transaction.id?.toString().includes(searchLower) ||
              transaction.asset?.assetId?.toLowerCase().includes(searchLower) ||
              transaction.asset?.type?.toLowerCase().includes(searchLower) ||
              transaction.asset?.brand?.toLowerCase().includes(searchLower) ||
              transaction.employee?.englishName?.toLowerCase().includes(searchLower) ||
              transaction.employee?.arabicName?.toLowerCase().includes(searchLower) ||
              transaction.notes?.toLowerCase().includes(searchLower) ||
              transaction.conditionNotes?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
          }
          return true;
        });
      } catch (error) {
        console.error('Error filtering transactions:', error);
        return [];
      }
    }, [transactions, filters.search]);

   // Auto-refresh when component mounts or becomes visible
  useEffect(() => {
    const hasFilters = Object.values(filters).some(value => value);
    if (hasFilters) {
      refetch();
    }
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value
    }));
    setCurrentPage(1);
  };



  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      assetId: '',
      employeeId: '',
      dateFrom: '',
      dateTo: '',
    });
    setCurrentPage(1);
  };

      const TRANSACTION_BADGE_CONFIG = {
      'Check-In': { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      'Check-Out': { bg: 'bg-red-100', text: 'text-red-800', icon: '→' },
      'Maintenance': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🔧' },
      'Sale': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '💰' },
      'Retirement': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🗑️' },
      'Upgrade': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⬆' },
    };


      const getTransactionTypeBadge = (type: string) => {
        const config = TRANSACTION_BADGE_CONFIG[type];
        return config ? `${config.bg} ${config.text}` : 'bg-gray-100 text-gray-800';
      };

      const handleExport = () => {
      // Get the transactions to export (use filtered if available)
      const dataToExport = filteredTransactions || transactions || [];
      
      if (dataToExport.length === 0) {
        toast({
          title: translations.noDataToExport,
          variant: 'destructive',
        });
        return;
      }

      try {
        // CSV Headers - including ALL columns even hidden ones
        const headers = [
          translations.transactionID,
          translations.transactionType,
          translations.transactionDate,
          translations.assetId,
          translations.assetType,
          translations.assetBrand,
          translations.assetModel,
          translations.serialNumber,
          translations.employeeID,
          translations.employeeNameEnglish,
          translations.employeeNameArabic,
          translations.employeeDepartment,
          translations.notes,
          translations.conditionNotes,
          // Device Specs
          translations.deviceCondition,
          translations.operatingSystem,
          translations.processor,
          translations.ram,
          translations.storage,
          translations.location,
          translations.status,
        ];

        // Build CSV rows with all data
        const csvRows = [headers.join(',')];
        
        dataToExport.forEach((transaction: TransactionWithRelations) => {
          const row = [
            transaction.id || '',
            transaction.type || '',
            transaction.date || transaction.transactionDate ? 
              format(new Date(transaction.date || transaction.transactionDate!), 'yyyy-MM-dd HH:mm:ss') : '',
            transaction.asset?.assetId || '',
            transaction.asset?.type || '',
            transaction.asset?.brand || '',
            transaction.asset?.modelName || '',
            transaction.asset?.serialNumber || '',
            transaction.employee?.id || '',
            transaction.employee?.englishName || '',
            transaction.employee?.arabicName || '',
            transaction.employee?.department || '',
            `"${(transaction.notes || '').replace(/"/g, '""')}"`, // Escape quotes in notes
            `"${(transaction.conditionNotes || '').replace(/"/g, '""')}"`,
            // Device Specs
            transaction.deviceSpecs?.condition || transaction.asset?.condition || '',
            transaction.deviceSpecs?.operatingSystem || transaction.asset?.operatingSystem || '',
            transaction.deviceSpecs?.processor || transaction.asset?.processor || '',
            transaction.deviceSpecs?.ram || transaction.asset?.ram || '',
            transaction.deviceSpecs?.storage || transaction.asset?.storage || '',
            transaction.deviceSpecs?.location || transaction.asset?.location || '',
            transaction.deviceSpecs?.status || transaction.asset?.status || '',
          ];
          
          csvRows.push(row.join(','));
        });

        // Create and download CSV file
        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `asset-history-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: translations.exportSuccess,
          description: `${language === 'English' ? 'Exported' : 'تم تصدير'} ${dataToExport.length} ${translations.exportedTransactions}`,
        });
      } catch (error) {
        console.error('Export error:', error);
        toast({
          title: translations.exportError,
          variant: 'destructive',
        });
      }
    };

  return (
    <>
      <Helmet>
        <title>{translations.title} | SimpleIT</title>
        <meta name="description" content={translations.metaDescription} />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
            <p className="text-gray-600">{translations.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              {translations.clearFilters}
            </Button>
            <Button onClick={handleExport} className="gap-2">
              <FileDown className="h-4 w-4" />
              {translations.export}
            </Button>
          </div>
        </div>

        {/* Filter & Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {translations.filterSearch}
            </CardTitle>
            <CardDescription>
              {translations.filterSearchDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">{translations.search}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder={translations.search}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Transaction Type */}
              <div className="space-y-2">
                <Label>{translations.transactionType}</Label>
                <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="all">{translations.all}</SelectItem>
                    <SelectItem value="Check-In">{translations.checkIn}</SelectItem>
                    <SelectItem value="Check-Out">{translations.checkOut}</SelectItem>
                    <SelectItem value="Maintenance">{translations.maintenance}</SelectItem>
                    <SelectItem value="Sale">{translations.sale}</SelectItem>
                    <SelectItem value="Retirement">{translations.retirement}</SelectItem>
                    <SelectItem value="Upgrade">{translations.upgrade}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Searchable Asset Filter */}
              <div className="space-y-2">
                <Label>{translations.asset}</Label>
                <Popover open={assetSearchOpen} onOpenChange={setAssetSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={assetSearchOpen}
                      className="w-full justify-between font-normal"
                    >
                     {filters.assetId && filters.assetId !== 'all'
                        ? (() => {
                            const asset = assets?.find((asset: any) => asset.id.toString() === filters.assetId);
                            return asset ? `${asset.assetId} - ${asset.type}` : translations.all;
                          })()
                        : translations.all}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder={translations.searchAssets}
                        value={assetSearchValue}
                        onValueChange={setAssetSearchValue}
                      />
                      <CommandEmpty>{translations.noAssetsFound}</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            handleFilterChange('assetId', 'all');
                            setAssetSearchOpen(false);
                            setAssetSearchValue('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (!filters.assetId || filters.assetId === 'all') ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {translations.all}
                        </CommandItem>
                        {(assets || [])
                          .filter((asset: any) => {
                            const searchLower = assetSearchValue.toLowerCase();
                            return !assetSearchValue || 
                              asset.assetId?.toLowerCase().includes(searchLower) ||
                              asset.type?.toLowerCase().includes(searchLower) ||
                              asset.brand?.toLowerCase().includes(searchLower) ||
                              asset.modelName?.toLowerCase().includes(searchLower);
                          })
                          .map((asset: any) => (
                            <CommandItem
                              key={asset.id}
                              value={`${asset.assetId} ${asset.type} ${asset.brand || ''}`}
                              onSelect={() => {
                                handleFilterChange('assetId', asset.id.toString());
                                setAssetSearchOpen(false);
                                setAssetSearchValue('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.assetId === asset.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{asset.assetId} - {asset.type}</span>
                                {asset.brand && (
                                  <span className="text-xs text-muted-foreground">{asset.brand} {asset.modelName || ''}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

             {/* Searchable Employee Filter */}
              <div className="space-y-2">
                <Label>{translations.employee}</Label>
                <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeSearchOpen}
                      className="w-full justify-between font-normal"
                    >
                      {filters.employeeId && filters.employeeId !== 'all'
                        ? (() => {
                            const emp = employeesList?.find((e: any) => e.id.toString() === filters.employeeId);
                            return emp ? `${emp.englishName || emp.arabicName}` : translations.all;
                          })()
                        : translations.all}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder={translations.searchEmployees}
                        value={employeeSearchValue}
                        onValueChange={setEmployeeSearchValue}
                      />
                      <CommandEmpty>{translations.noEmployeesFound}</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            handleFilterChange('employeeId', 'all');
                            setEmployeeSearchOpen(false);
                            setEmployeeSearchValue('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (!filters.employeeId || filters.employeeId === 'all') ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {translations.all}
                        </CommandItem>
                        {(employeesList || [])
                          .filter((emp: any) => {
                            const searchLower = employeeSearchValue.toLowerCase();
                            return !employeeSearchValue || 
                              emp.englishName?.toLowerCase().includes(searchLower) ||
                              emp.arabicName?.toLowerCase().includes(searchLower) ||
                              emp.empId?.toLowerCase().includes(searchLower) ||
                              emp.department?.toLowerCase().includes(searchLower);
                          })
                          .map((emp: any) => (
                            <CommandItem
                              key={emp.id}
                              value={`${emp.englishName || ''} ${emp.arabicName || ''} ${emp.department || ''}`}
                              onSelect={() => {
                                handleFilterChange('employeeId', emp.id.toString());
                                setEmployeeSearchOpen(false);
                                setEmployeeSearchValue('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.employeeId === emp.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{emp.englishName || emp.arabicName}</span>
                                {emp.department && (
                                  <span className="text-xs text-muted-foreground">
                                    {emp.empId} • {emp.department}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label>{translations.dateFrom}</Label>
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFromSelected && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFromSelected ? format(dateFromSelected, "PPP") : translations.dateFrom}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFromSelected}
                      onSelect={(date) => {
                        setDateFromSelected(date);
                        handleFilterChange('dateFrom', date ? format(date, 'yyyy-MM-dd') : '');
                        setDateFromOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>{translations.dateTo}</Label>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateToSelected && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateToSelected ? format(dateToSelected, "PPP") : translations.dateTo}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateToSelected}
                      onSelect={(date) => {
                        setDateToSelected(date);
                        handleFilterChange('dateTo', date ? format(date, 'yyyy-MM-dd') : '');
                        setDateToOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>


          </CardContent>
        </Card>

        {/* Transaction History Data Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {translations.transactionHistory}
            </CardTitle>
            <CardDescription>
              {translations.transactionHistoryDescription}
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
              <div className="space-y-4">
                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{translations.id}</TableHead>
                        <TableHead>{translations.asset}</TableHead>
                        <TableHead>{translations.employee}</TableHead>
                        <TableHead>{translations.type}</TableHead>
                        <TableHead>{translations.date}</TableHead>
                        <TableHead>{translations.notes}</TableHead>
                        <TableHead>{translations.deviceSpecs}</TableHead>
                        <TableHead className="w-[100px]">{translations.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData?.transactions?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {translations.noTransactionRecords}
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions?.map((transaction: TransactionWithRelations) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">#{transaction.id}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{transaction.asset?.assetId}</div>
                              <div className="text-sm text-gray-500">
                                {transaction.asset?.type} {transaction.asset?.brand && `- ${transaction.asset.brand}`}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.employee ? (
                              <div className="space-y-1">
                                <div className="font-medium">{transaction.employee.englishName}</div>
                                <div className="text-sm text-gray-500">{transaction.employee.department}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTransactionTypeBadge(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.date || transaction.transactionDate 
                              ? format(new Date(transaction.date || transaction.transactionDate!), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const metadata = transaction.deviceSpecs as any;
                              
                              if (transaction.type === 'Sale' && metadata?.buyer) {
                                return (
                                  <div className="text-sm space-y-1">
                                    <p className="font-medium text-gray-900">{translations.buyer}: {metadata.buyer}</p>
                                    <p className="text-gray-600">{translations.price}: {formatCurrency (metadata.salePrice || metadata.totalAmount || 'N/A')}</p>
                                    {transaction.notes && <p className="text-gray-500 text-xs mt-1 truncate">{transaction.notes}</p>}
                                  </div>
                                );
                              }
                              
                              if (transaction.type === 'Retirement' && metadata?.retirementReason) {
                                return (
                                  <div className="text-sm space-y-1">
                                    <p className="font-medium text-gray-900">{translations.reason}: {metadata.retirementReason}</p>
                                    {metadata.notes && <p className="text-gray-500 text-xs mt-1 truncate">{metadata.notes}</p>}
                                  </div>
                                );
                              }
                              
                              if (transaction.type === 'Maintenance' && metadata?.maintenanceType) {
                                return (
                                  <div className="text-sm space-y-1">
                                    <p className="font-medium text-gray-900">{translations.typeLabel}: {metadata.maintenanceType}</p>
                                    {metadata.cost && <p className="text-gray-600">{translations.costLabel}: {formatCurrency(metadata.cost)}</p>}
                                    {metadata.provider && <p className="text-gray-600">{translations.providerLabel}: {metadata.provider}</p>}
                                    {metadata.status && <p className="text-gray-600">{translations.statusLabel}: {metadata.status}</p>}
                                  </div>
                                );
                              }
                              
                              // Default display for Check-In/Check-Out
                              return (
                                <div className="max-w-xs truncate" title={transaction.notes || transaction.conditionNotes}>
                                  <span className="text-sm text-gray-600">{transaction.notes || transaction.conditionNotes || '-'}</span>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {transaction.deviceSpecs ? (
                              <Badge variant="outline">
                                {translations.recorded}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {translations.notAvailable}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedTransaction(transaction)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                             <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{translations.transactionDetails}</DialogTitle>
                                <DialogDescription>
                                  {translations.completeTransactionInfo}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Transaction Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">{translations.transactionID}</Label>
                                    <p className="text-sm text-gray-600">#{transaction.id}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">{translations.type}</Label>
                                    <Badge className={getTransactionTypeBadge(transaction.type)}>
                                      {transaction.type}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">{translations.date}</Label>
                                    <p className="text-sm text-gray-600">
                                      {transaction.date || transaction.transactionDate 
                                        ? format(new Date(transaction.date || transaction.transactionDate!), 'MMM dd, yyyy HH:mm')
                                        : '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">{translations.employee}</Label>
                                    <p className="text-sm text-gray-600">
                                      {transaction.employee 
                                        ? `${transaction.employee.englishName || transaction.employee.arabicName || 'N/A'} - ${transaction.employee.department || 'N/A'}`
                                        : translations.notAssigned}
                                    </p>
                                  </div>
                                </div>

                                {/* Asset and Device Info Side by Side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* Asset Information */}
                                  <div>
                                    <h4 className="font-medium mb-3">{translations.assetInformation}</h4>
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.assetId}</Label>
                                        <p className="text-sm font-medium">{transaction.asset?.assetId || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.type}</Label>
                                        <p className="text-sm font-medium">{transaction.asset?.type || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.brandModel}</Label>
                                        <p className="text-sm font-medium">
                                          {transaction.asset?.brand || '-'} {transaction.asset?.modelName ? `- ${transaction.asset.modelName}` : ''}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.serialNumber}</Label>
                                        <p className="text-sm font-medium">{transaction.asset?.serialNumber || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.currentStatus}</Label>
                                        <Badge variant="outline">{transaction.asset?.status || '-'}</Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Device Specifications */}
                                  <div>
                                    <h4 className="font-medium mb-3">{translations.deviceSpecsAt} {transaction.type}</h4>
                                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.cpu}</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.cpu || transaction.asset?.cpu || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.ram}</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.ram || transaction.asset?.ram || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.storage}</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.storage || transaction.asset?.storage || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">{translations.deviceSpecs}</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.specs || transaction.asset?.specs || '-'}</p>
                                      </div>
                                      {transaction.asset?.operatingSystem && (
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.operatingSystem}</Label>
                                          <p className="text-sm font-medium">{transaction.asset.operatingSystem}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Notes - Full Width */}
                                {(transaction.notes || transaction.conditionNotes) && (
                                  <div>
                                    <h4 className="font-medium mb-3">{translations.notes}</h4>
                                    <div className="p-4 bg-amber-50 rounded-lg space-y-2">
                                      {transaction.conditionNotes && (
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.conditionNotes}</Label>
                                          <p className="text-sm">{transaction.conditionNotes}</p>
                                        </div>
                                      )}
                                      {transaction.notes && (
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.generalNotes}</Label>
                                          <p className="text-sm">{transaction.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Enhanced metadata display based on transaction type */}
                              {selectedTransaction && (() => {
                                const metadata = selectedTransaction.deviceSpecs as any;
                                
                                if (selectedTransaction.type === 'Sale' && metadata) {
                                  return (
                                    <div className="space-y-4">
                                      <h4 className="font-medium">{translations.saleDetails}</h4>
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.buyer}</Label>
                                          <p className="text-sm font-medium">{metadata.buyer || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.saleDate}</Label>
                                          <p className="text-sm font-medium">
                                            {metadata.saleDate ? format(new Date(metadata.saleDate), 'MMM dd, yyyy') : '-'}
                                          </p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.salePrice}</Label>
                                        <p className="text-gray-600">{translations.price}: {formatCurrency(metadata.salePrice || metadata.totalAmount || 0)}</p>
                                        </div>
                                        {metadata.notes && (
                                          <div className="col-span-2">
                                            <Label className="text-xs text-gray-500">{translations.generalNotes}</Label>
                                            <p className="text-sm">{metadata.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                if (selectedTransaction.type === 'Retirement' && metadata) {
                                  return (
                                    <div className="space-y-4">
                                      <h4 className="font-medium">{translations.retirementDetails}</h4>
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.retirementReason}</Label>
                                          <p className="text-sm font-medium">{metadata.retirementReason || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.retirementDate}</Label>
                                          <p className="text-sm font-medium">
                                            {metadata.retirementDate ? format(new Date(metadata.retirementDate), 'MMM dd, yyyy') : '-'}
                                          </p>
                                        </div>
                                        {metadata.notes && (
                                          <div className="col-span-2">
                                            <Label className="text-xs text-gray-500">{translations.notes}</Label>
                                            <p className="text-sm">{metadata.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                if (selectedTransaction.type === 'Maintenance' && metadata) {
                                  return (
                                    <div className="space-y-4">
                                      <h4 className="font-medium">{translations.maintenanceDetails}</h4>
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.maintenanceType}</Label>
                                          <p className="text-sm font-medium">{metadata.maintenanceType || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.status}</Label>
                                          <p className="text-sm font-medium">{metadata.status || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.maintenanceCost}</Label>
                                          <p className="text-sm font-medium">{formatCurrency(metadata.cost || 0)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.provider}</Label>
                                          <p className="text-sm font-medium">{metadata.provider || '-'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                if (selectedTransaction.type === 'Upgrade' && metadata) {
                                  return (
                                    <div className="space-y-4">
                                      <h4 className="font-medium">{translations.upgradeDetails}</h4>
                                      <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.upgradeTitle}</Label>
                                          <p className="text-sm font-medium">{metadata.title || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.upgradeCategory}</Label>
                                          <p className="text-sm font-medium">{metadata.category || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.upgradeType}</Label>
                                          <p className="text-sm font-medium">{metadata.upgradeType || '-'}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.upgradePriority}</Label>
                                          <Badge variant={
                                            metadata.priority === 'Critical' ? 'destructive' :
                                            metadata.priority === 'High' ? 'default' :
                                            metadata.priority === 'Medium' ? 'secondary' :
                                            'outline'
                                          }>
                                            {metadata.priority || translations.lowPriority}
                                          </Badge>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.upgradeStatus}</Label>
                                          <Badge variant={
                                            metadata.status === 'Completed' ? 'default' :
                                            metadata.status === 'In Progress' ? 'secondary' :
                                            metadata.status === 'Approved' ? 'outline' :
                                            'outline'
                                          }>
                                            {metadata.status || '-'}
                                          </Badge>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-gray-500">{translations.estimatedCost}</Label>
                                          <p className="text-sm font-medium">
                                            {metadata.estimatedCost 
                                              ? formatCurrency(metadata.estimatedCost)
                                              : '-'}
                                          </p>
                                        </div>
                                        {metadata.description && (
                                          <div className="col-span-2">
                                            <Label className="text-xs text-gray-500">{translations.upgradeDescription}</Label>
                                            <p className="text-sm">{metadata.description}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                
                                return null;
                              })()}

                            </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                

                {/* Pagination */}
                {transactionsData?.pagination && transactionsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {translations.showing} {((currentPage - 1) * pageSize) + 1} {translations.to} {Math.min(currentPage * pageSize, transactionsData.pagination.totalItems)} {translations.of} {transactionsData.pagination.totalItems} {translations.results}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1}
                      >
                        {translations.previous}
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        {translations.page} {currentPage} {translations.of} {transactionsData.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(transactionsData.pagination.totalPages, prev + 1))}
                        disabled={currentPage >= transactionsData.pagination.totalPages}
                      >
                        {translations.next}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-sm">{translations.show}</Label>
                  <Select value={pageSize.toString()} onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">{translations.perPage}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
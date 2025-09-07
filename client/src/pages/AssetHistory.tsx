import { useState, useEffect } from 'react';
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
import { Search, Calendar, User, Package, FileDown, Filter, Eye, Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    assetId: '',
    employeeId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);
  
  // States for searchable dropdowns
  const [assetSearchOpen, setAssetSearchOpen] = useState(false);
  const [assetSearchValue, setAssetSearchValue] = useState('');
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');
  
  // Enhanced translations with export messages
  const translations = {
    title: language === 'English' ? 'Asset History' : 'سجل الأصول',
    description: language === 'English' 
      ? 'Track and manage all asset check-in and check-out activities with detailed history and device specifications' 
      : 'تتبع وإدارة جميع أنشطة تسجيل الوصول والمغادرة للأصول مع سجل تفصيلي ومواصفات الجهاز',
    filterSearch: language === 'English' ? 'Filter & Search Asset History' : 'تصفية وبحث سجل الأصول',
    transactionHistory: language === 'English' ? 'Transaction History' : 'تاريخ المعاملات',
    search: language === 'English' ? 'Search transactions...' : 'البحث في المعاملات...',
    transactionType: language === 'English' ? 'Transaction Type' : 'نوع المعاملة',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    employee: language === 'English' ? 'Employee' : 'الموظف',
    dateFrom: language === 'English' ? 'Date From' : 'التاريخ من',
    dateTo: language === 'English' ? 'Date To' : 'التاريخ إلى',
    all: language === 'English' ? 'All' : 'الكل',
    checkIn: language === 'English' ? 'Check In' : 'تسجيل الدخول',
    checkOut: language === 'English' ? 'Check Out' : 'تسجيل الخروج',
    assignment: language === 'English' ? 'Assignment' : 'تخصيص',
    maintenance: language === 'English' ? 'Maintenance' : 'صيانة',
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
    searchAssets: language === 'English' ? 'Search assets...' : 'البحث عن الأصول...',
    searchEmployees: language === 'English' ? 'Search employees...' : 'البحث عن الموظفين...',
    selectAsset: language === 'English' ? 'Select asset...' : 'اختر أصل...',
    selectEmployee: language === 'English' ? 'Select employee...' : 'اختر موظف...',
    noAssetsFound: language === 'English' ? 'No assets found' : 'لم يتم العثور على أصول',
    noEmployeesFound: language === 'English' ? 'No employees found' : 'لم يتم العثور على موظفين',
    exportSuccess: language === 'English' ? 'Data exported successfully' : 'تم تصدير البيانات بنجاح',
    exportError: language === 'English' ? 'Failed to export data' : 'فشل تصدير البيانات',
    noDataToExport: language === 'English' ? 'No data to export' : 'لا توجد بيانات للتصدير',
    department: language === 'English' ? 'Department' : 'القسم',
  };

  // Fetch transaction history
  const { data: transactionsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/asset-transactions', filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
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
      return {
        transactions: result.data || result,
        pagination: result.pagination || { 
          totalItems: Array.isArray(result) ? result.length : 0, 
          totalPages: 1, 
          currentPage: 1, 
          itemsPerPage: pageSize 
        }
      };
    },
  });

  // Fetch assets for searchable filter
  const { data: assetsResponse } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: async () => {
      const response = await fetch('/api/assets', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    }
  });
  const assets = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []);

  // Fetch employees for searchable filter
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    }
  });

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination;

  // Filter transactions locally for display
  const filteredTransactions = transactions.filter((transaction: TransactionWithRelations) => {
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
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

  // Enhanced Export Function with full data
  const handleExport = () => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      toast({
        title: translations.noDataToExport,
        variant: 'destructive',
      });
      return;
    }

    try {
      // CSV Headers - including hidden columns
      const headers = [
        'Transaction ID',
        'Transaction Type',
        'Transaction Date',
        'Asset ID',
        'Asset Type',
        'Asset Brand',
        'Asset Model',
        'Serial Number',
        'Employee ID',
        'Employee Name (English)',
        'Employee Name (Arabic)',
        'Employee Department',
        'Notes',
        'Condition Notes',
        // Device Specs
        'Device Condition',
        'Operating System',
        'Processor',
        'RAM',
        'Storage',
        'Location',
        'Status',
      ];

      // Build CSV rows with all data
      const csvRows = [headers.join(',')];
      
      filteredTransactions.forEach((transaction: TransactionWithRelations) => {
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
        description: `Exported ${filteredTransactions.length} transactions`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: translations.exportError,
        variant: 'destructive',
      });
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'Check In':
        return 'bg-green-100 text-green-800';
      case 'Check Out':
        return 'bg-blue-100 text-blue-800';
      case 'Assignment':
        return 'bg-purple-100 text-purple-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Helmet>
        <title>{translations.title}</title>
        <meta name="description" content={translations.metaDescription} />
      </Helmet>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{translations.title}</h1>
          <p className="text-muted-foreground mt-1">{translations.description}</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <FileDown className="h-4 w-4" />
          {translations.export}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {translations.filterSearch}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                <SelectContent>
                  <SelectItem value="all">{translations.all}</SelectItem>
                  <SelectItem value="Check In">{translations.checkIn}</SelectItem>
                  <SelectItem value="Check Out">{translations.checkOut}</SelectItem>
                  <SelectItem value="Assignment">{translations.assignment}</SelectItem>
                  <SelectItem value="Maintenance">{translations.maintenance}</SelectItem>
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
                      ? assets.find((asset: any) => asset.id.toString() === filters.assetId)?.assetId +
                        ' - ' + assets.find((asset: any) => asset.id.toString() === filters.assetId)?.type
                      : translations.all}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
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
                            filters.assetId === 'all' ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {translations.all}
                      </CommandItem>
                      {assets
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
                          const emp = employees.find((e: any) => e.id.toString() === filters.employeeId);
                          return emp ? `${emp.englishName || emp.arabicName}` : translations.all;
                        })()
                      : translations.all}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
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
                            filters.employeeId === 'all' ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {translations.all}
                      </CommandItem>
                      {employees
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
              <Label htmlFor="dateFrom">{translations.dateFrom}</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label htmlFor="dateTo">{translations.dateTo}</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClearFilters}>
              {translations.clearFilters}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{translations.transactionHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{translations.id}</TableHead>
                    <TableHead>{translations.type}</TableHead>
                    <TableHead>{translations.asset}</TableHead>
                    <TableHead>{translations.employee}</TableHead>
                    <TableHead>{translations.date}</TableHead>
                    <TableHead>{translations.notes}</TableHead>
                    <TableHead>{translations.deviceSpecs}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: TransactionWithRelations) => (
                    <TableRow key={transaction.id}>
                      <TableCell>#{transaction.id}</TableCell>
                      <TableCell>
                        <Badge className={getTransactionTypeBadge(transaction.type)}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.asset ? (
                          <div>
                            <div className="font-medium">{transaction.asset.assetId}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.asset.type} {transaction.asset.brand && `- ${transaction.asset.brand}`}
                            </div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.employee ? (
                          <div>
                            <div className="font-medium">
                              {transaction.employee.englishName || transaction.employee.arabicName}
                            </div>
                            {transaction.employee.department && (
                              <div className="text-sm text-muted-foreground">
                                {transaction.employee.department}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.date || transaction.transactionDate
                          ? format(new Date(transaction.date || transaction.transactionDate!), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={transaction.notes || transaction.conditionNotes}>
                          {transaction.notes || transaction.conditionNotes || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.deviceSpecs ? (
                          <Badge variant="outline">Recorded</Badge>
                        ) : (
                          <Badge variant="secondary">Not Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} items)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Complete transaction information and device specifications
              </DialogDescription>
            </DialogHeader>
            {/* Add the full transaction details view here */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
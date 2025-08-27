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
import { Search, Calendar, User, Package, FileDown, Filter, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
            transactions: result.data || result,
            pagination: result.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, itemsPerPage: pageSize }
          };
        },
        staleTime: 0, // Consider data immediately stale
        gcTime: 0, // Don't cache the data
        refetchOnWindowFocus: true, // Refetch when window gains focus
        refetchOnMount: 'always' // Always refetch when component mounts
      });

  // Fetch assets for filter dropdown
  const { data: assets } = useQuery({
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

   // Auto-refresh when component mounts or becomes visible
  useEffect(() => {
    refetch();
  }, []); // Refetch on component mount

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

  const getTransactionTypeBadge = (type: string) => {
    const colors = {
      'Check In': 'bg-green-100 text-green-800',
      'Check Out': 'bg-red-100 text-red-800',
      'Assignment': 'bg-blue-100 text-blue-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800',
      'Transfer': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
            <Button variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
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
              Filter and search through asset transaction history with device specifications
            </CardDescription>
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

              {/* Asset Filter */}
              <div className="space-y-2">
                <Label>{translations.asset}</Label>
                <Select value={filters.assetId || 'all'} onValueChange={(value) => handleFilterChange('assetId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.all}</SelectItem>
                    {assets?.map((asset: Asset) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.assetId} - {asset.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Filter */}
              <div className="space-y-2">
                <Label>{translations.employee}</Label>
                <Select value={filters.employeeId || 'all'} onValueChange={(value) => handleFilterChange('employeeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={translations.all} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations.all}</SelectItem>
                    {employees?.map((employee: Employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.englishName || employee.arabicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              Complete history of asset transactions with device specifications at time of change
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
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData?.transactions?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {language === 'English' ? 'No transaction records found' : 'لم يتم العثور على سجلات المعاملات'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactionsData?.transactions?.map((transaction: TransactionWithRelations) => (
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
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {transaction.date || transaction.transactionDate 
                                ? format(new Date(transaction.date || transaction.transactionDate!), 'MMM dd, yyyy')
                                : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={transaction.notes || transaction.conditionNotes}>
                              {transaction.notes || transaction.conditionNotes || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.deviceSpecs ? (
                              <Badge variant="outline">
                                Recorded
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Not Available
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
                                <DialogTitle>Transaction Details</DialogTitle>
                                <DialogDescription>
                                  Complete transaction information and device specifications
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Transaction Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Transaction ID</Label>
                                    <p className="text-sm text-gray-600">#{transaction.id}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Type</Label>
                                    <Badge className={getTransactionTypeBadge(transaction.type)}>
                                      {transaction.type}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Date</Label>
                                    <p className="text-sm text-gray-600">
                                      {transaction.date || transaction.transactionDate 
                                        ? format(new Date(transaction.date || transaction.transactionDate!), 'MMM dd, yyyy HH:mm')
                                        : '-'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Employee</Label>
                                    <p className="text-sm text-gray-600">
                                      {transaction.employee 
                                        ? `${transaction.employee.englishName || transaction.employee.arabicName || 'N/A'} - ${transaction.employee.department || 'N/A'}`
                                        : 'Not assigned'}
                                    </p>
                                  </div>
                                </div>

                                {/* Asset and Device Info Side by Side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* Asset Information */}
                                  <div>
                                    <h4 className="font-medium mb-3">Asset Information</h4>
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                      <div>
                                        <Label className="text-xs text-gray-500">Asset ID</Label>
                                        <p className="text-sm font-medium">{transaction.asset?.assetId || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Type</Label>
                                        <p className="text-sm font-medium">{transaction.asset?.type || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Brand & Model</Label>
                                        <p className="text-sm font-medium">
                                          {transaction.asset?.brand || '-'} {transaction.asset?.modelName ? `- ${transaction.asset.modelName}` : ''}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Serial Number</Label>
                                        <p className="text-sm font-medium">{transaction.asset?.serialNumber || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Current Status</Label>
                                        <Badge variant="outline">{transaction.asset?.status || '-'}</Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Device Specifications */}
                                  <div>
                                    <h4 className="font-medium mb-3">Device Specs at {transaction.type}</h4>
                                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                                      <div>
                                        <Label className="text-xs text-gray-500">CPU</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.cpu || transaction.asset?.cpu || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">RAM</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.ram || transaction.asset?.ram || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Storage</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.storage || transaction.asset?.storage || '-'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-gray-500">Specifications</Label>
                                        <p className="text-sm font-medium">{transaction.deviceSpecs?.specs || transaction.asset?.specs || '-'}</p>
                                      </div>
                                      {transaction.asset?.operatingSystem && (
                                        <div>
                                          <Label className="text-xs text-gray-500">Operating System</Label>
                                          <p className="text-sm font-medium">{transaction.asset.operatingSystem}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Notes - Full Width */}
                                {(transaction.notes || transaction.conditionNotes) && (
                                  <div>
                                    <h4 className="font-medium mb-3">Notes</h4>
                                    <div className="p-4 bg-amber-50 rounded-lg space-y-2">
                                      {transaction.conditionNotes && (
                                        <div>
                                          <Label className="text-xs text-gray-500">Condition Notes</Label>
                                          <p className="text-sm">{transaction.conditionNotes}</p>
                                        </div>
                                      )}
                                      {transaction.notes && (
                                        <div>
                                          <Label className="text-xs text-gray-500">General Notes</Label>
                                          <p className="text-sm">{transaction.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
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
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, transactionsData.pagination.totalItems)} of {transactionsData.pagination.totalItems} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage <= 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Page {currentPage} of {transactionsData.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(transactionsData.pagination.totalPages, prev + 1))}
                        disabled={currentPage >= transactionsData.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="pageSize" className="text-sm">Show:</Label>
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
                  <span className="text-sm text-gray-500">per page</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
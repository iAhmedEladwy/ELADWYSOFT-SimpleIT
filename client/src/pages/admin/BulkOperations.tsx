import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  RefreshCw, 
  User,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { RoleGuard } from '@/components/auth/RoleGuard';
import NotFound from '@/pages/not-found';
import { Link } from 'wouter';

interface BulkActionHistoryItem {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number | null;
  details: {
    operation: string;
    assetIds?: number[];
    succeeded?: number;
    failed?: number;
    errors?: string[];
    [key: string]: any;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function BulkOperations() {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const translations = {
    title: language === 'English' ? 'Bulk Operations' : 'العمليات المجمعة',
    description: language === 'English' ? 'View and monitor all bulk operations performed in the system' : 'عرض ومراقبة جميع العمليات المجمعة المنفذة في النظام',
    backToAdmin: language === 'English' ? 'Back to Admin Console' : 'العودة لوحدة التحكم الإدارية',
    search: language === 'English' ? 'Search operations...' : 'البحث في العمليات...',
    filterByAction: language === 'English' ? 'Filter by Action' : 'تصفية حسب الإجراء',
    filterByStatus: language === 'English' ? 'Filter by Status' : 'تصفية حسب الحالة',
    filterByDate: language === 'English' ? 'Filter by Date' : 'تصفية حسب التاريخ',
    allActions: language === 'English' ? 'All Actions' : 'جميع الإجراءات',
    allStatuses: language === 'English' ? 'All Statuses' : 'جميع الحالات',
    allDates: language === 'English' ? 'All Dates' : 'جميع التواريخ',
    last7Days: language === 'English' ? 'Last 7 Days' : 'آخر 7 أيام',
    last30Days: language === 'English' ? 'Last 30 Days' : 'آخر 30 يوم',
    last90Days: language === 'English' ? 'Last 90 Days' : 'آخر 90 يوم',
    export: language === 'English' ? 'Export' : 'تصدير',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    noData: language === 'English' ? 'No bulk operations found' : 'لم يتم العثور على عمليات مجمعة',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    user: language === 'English' ? 'User' : 'المستخدم',
    action: language === 'English' ? 'Action' : 'الإجراء',
    entity: language === 'English' ? 'Entity' : 'الكيان',
    details: language === 'English' ? 'Details' : 'التفاصيل',
    timestamp: language === 'English' ? 'Timestamp' : 'الوقت',
    status: language === 'English' ? 'Status' : 'الحالة',
    success: language === 'English' ? 'Success' : 'نجح',
    partial: language === 'English' ? 'Partial' : 'جزئي',
    failed: language === 'English' ? 'Failed' : 'فشل',
    assets: language === 'English' ? 'assets' : 'أصول',
    succeeded: language === 'English' ? 'succeeded' : 'نجح',
    failedCount: language === 'English' ? 'failed' : 'فشل',
    errors: language === 'English' ? 'errors' : 'أخطاء',
    noAccess: language === 'English' ? 'You do not have permission to view this page' : 'ليس لديك صلاحية لعرض هذه الصفحة',
    id: language === 'English' ? 'ID' : 'المعرف',
  };

  // Check if user has admin access
  if (!hasAccess(3)) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {translations.noAccess}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch bulk action history
  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/bulk-action-history', { searchTerm, actionFilter, statusFilter, dateFilter, currentPage, itemsPerPage }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFilter !== 'all' && { dateRange: dateFilter }),
      });
      
      const response = await apiRequest(`/api/bulk-action-history?${params}`);
      return response;
    },
    staleTime: 30000, // 30 seconds
  });

  const getStatusBadge = (item: BulkActionHistoryItem) => {
    const { succeeded = 0, failed = 0 } = item.details;
    
    if (failed === 0) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{translations.success}</Badge>;
    } else if (succeeded > 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />{translations.partial}</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{translations.failed}</Badge>;
    }
  };

  const getActionSummary = (item: BulkActionHistoryItem) => {
    const { operation, assetIds = [], succeeded = 0, failed = 0 } = item.details;
    
    if (assetIds.length > 0) {
      return `${operation} ${assetIds.length} ${translations.assets} (${succeeded} ${translations.succeeded}, ${failed} ${translations.failedCount})`;
    }
    
    return operation;
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...(searchTerm && { search: searchTerm }),
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFilter !== 'all' && { dateRange: dateFilter }),
      });
      
      const response = await fetch(`/api/bulk-action-history?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-operations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const PaginationControls = () => {
    if (!history?.pagination) return null;
    
    const { currentPage: page, totalPages, totalItems } = history.pagination;
    const startItem = (page - 1) * itemsPerPage + 1;
    const endItem = Math.min(page * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {language === 'English' 
            ? `Showing ${startItem}-${endItem} of ${totalItems} operations`
            : `عرض ${startItem}-${endItem} من ${totalItems} عملية`
          }
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            {language === 'English' ? `Page ${page} of ${totalPages}` : `صفحة ${page} من ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']} fallback={<NotFound />}>
      <div className="container mx-auto py-6 space-y-6">
        <Helmet>
          <title>{translations.title}</title>
          <meta name="description" content={translations.description} />
        </Helmet>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin-console">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>{translations.backToAdmin}</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
              <p className="text-muted-foreground">{translations.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {translations.export}
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {translations.refresh}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-4 h-4 mr-2" />
              {language === 'English' ? 'Filters' : 'المرشحات'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={translations.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.filterByAction} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allActions}</SelectItem>
                  <SelectItem value="Bulk Update">{language === 'English' ? 'Status Change' : 'تغيير الحالة'}</SelectItem>
                  <SelectItem value="Bulk Assign">{language === 'English' ? 'Assignment' : 'التعيين'}</SelectItem>
                  <SelectItem value="Bulk Delete">{language === 'English' ? 'Deletion' : 'الحذف'}</SelectItem>
                  <SelectItem value="Bulk Maintenance Schedule">{language === 'English' ? 'Maintenance' : 'الصيانة'}</SelectItem>
                  <SelectItem value="Bulk Sell">{language === 'English' ? 'Sell' : 'البيع'}</SelectItem>
                  <SelectItem value="Bulk Retire">{language === 'English' ? 'Retire' : 'التقاعد'}</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.filterByStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allStatuses}</SelectItem>
                  <SelectItem value="success">{translations.success}</SelectItem>
                  <SelectItem value="partial">{translations.partial}</SelectItem>
                  <SelectItem value="failed">{translations.failed}</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.filterByDate} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allDates}</SelectItem>
                  <SelectItem value="7d">{translations.last7Days}</SelectItem>
                  <SelectItem value="30d">{translations.last30Days}</SelectItem>
                  <SelectItem value="90d">{translations.last90Days}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <Alert className="m-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'English' ? 'Failed to load bulk operations' : 'فشل في تحميل العمليات المجمعة'}
                </AlertDescription>
              </Alert>
            ) : !history?.data?.length ? (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">{translations.noData}</h3>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translations.user}</TableHead>
                      <TableHead>{translations.action}</TableHead>
                      <TableHead>{translations.entity}</TableHead>
                      <TableHead>{translations.details}</TableHead>
                      <TableHead>{translations.status}</TableHead>
                      <TableHead>{translations.timestamp}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.map((item: BulkActionHistoryItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-muted-foreground" />
                            {item.userName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.entityType}</div>
                            {item.entityId && (
                              <div className="text-muted-foreground">{translations.id}: {item.entityId}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-xs">
                            <div className="font-medium">{getActionSummary(item)}</div>
                            {item.details.errors?.length > 0 && (
                              <div className="text-red-600 mt-1">
                                {item.details.errors.length} {translations.errors}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="p-4 border-t">
                  <PaginationControls />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}

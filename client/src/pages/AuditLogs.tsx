import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Helmet } from "react-helmet-async";
import { 
  FileText, 
  AlertTriangle,
  Download,
  Search,
  Trash2,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AuditLogTable from '@/components/audit/AuditLogTable';
import AuditLogFilter from '@/components/audit/AuditLogFilter';
import { useAuth } from '@/lib/authContext';

export default function AuditLogs() {
  const { hasAccess } = useAuth();
  const { language } = useLanguage();
  
  const translations = {
    auditLogs: language === 'English' ? 'Audit Logs' : 'سجلات التدقيق',
    viewSearchActivity: language === 'English' ? 'View and search all system activity and user actions' : 'عرض والبحث في جميع أنشطة النظام وإجراءات المستخدمين',
    clearLogs: language === 'English' ? 'Clear Logs' : 'مسح السجلات',
    exportCsv: language === 'English' ? 'Export CSV' : 'تصدير CSV',
    clearAuditLogs: language === 'English' ? 'Clear Audit Logs' : 'مسح سجلات التدقيق',
    actionCannotBeUndone: language === 'English' ? 'This action cannot be undone. Please select which logs to clear.' : 'لا يمكن التراجع عن هذا الإجراء. يرجى اختيار السجلات المراد مسحها.',
    timePeriod: language === 'English' ? 'Time Period' : 'الفترة الزمنية',
    selectTimePeriod: language === 'English' ? 'Select time period' : 'اختر الفترة الزمنية',
    allLogs: language === 'English' ? 'All logs' : 'جميع السجلات',
    olderThan1Week: language === 'English' ? 'Older than 1 week' : 'أقدم من أسبوع واحد',
    olderThan1Month: language === 'English' ? 'Older than 1 month' : 'أقدم من شهر واحد',
    olderThan1Year: language === 'English' ? 'Older than 1 year' : 'أقدم من سنة واحدة',
    entityType: language === 'English' ? 'Entity Type (Optional)' : 'نوع الكيان (اختياري)',
    allEntityTypes: language === 'English' ? 'All entity types' : 'جميع أنواع الكيانات',
    user: language === 'English' ? 'User' : 'مستخدم',
    employee: language === 'English' ? 'Employee' : 'موظف',
    asset: language === 'English' ? 'Asset' : 'أصل',
    ticket: language === 'English' ? 'Ticket' : 'تذكرة',
    report: language === 'English' ? 'Report' : 'تقرير',
    system: language === 'English' ? 'System' : 'نظام',
    action: language === 'English' ? 'Action (Optional)' : 'الإجراء (اختياري)',
    allActions: language === 'English' ? 'All actions' : 'جميع الإجراءات',
    create: language === 'English' ? 'Create' : 'إنشاء',
    update: language === 'English' ? 'Update' : 'تحديث',
    delete: language === 'English' ? 'Delete' : 'حذف',
    login: language === 'English' ? 'Login' : 'تسجيل دخول',
    logout: language === 'English' ? 'Logout' : 'تسجيل خروج',
    view: language === 'English' ? 'View' : 'عرض',
    export: language === 'English' ? 'Export' : 'تصدير',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    clearing: language === 'English' ? 'Clearing...' : 'جاري المسح...',
    accessRestricted: language === 'English' ? 'Access Restricted' : 'الوصول مقيد',
    noPermissionAuditLogs: language === 'English' ? 'You do not have permission to view the audit logs. This feature requires administrator access.' : 'ليس لديك صلاحية لعرض سجلات التدقيق. تتطلب هذه الميزة وصول المسؤول.',
    errorLoadingAuditLogs: language === 'English' ? 'Error Loading Audit Logs' : 'خطأ في تحميل سجلات التدقيق',
    failedToLoadData: language === 'English' ? 'Failed to load the audit log data' : 'فشل في تحميل بيانات سجل التدقيق',
    tryAgain: language === 'English' ? 'Try Again' : 'المحاولة مرة أخرى',
    showing: language === 'English' ? 'Showing' : 'عرض',
    of: language === 'English' ? 'of' : 'من',
    entries: language === 'English' ? 'entries' : 'إدخالات',
    logsCleared: language === 'English' ? 'Logs cleared' : 'تم مسح السجلات',
    successfullyCleared: language === 'English' ? 'Successfully cleared' : 'تم المسح بنجاح',
    logEntries: language === 'English' ? 'log entries' : 'إدخالات السجل',
    error: language === 'English' ? 'Error' : 'خطأ',
    failedToClearLogs: language === 'English' ? 'Failed to clear logs' : 'فشل في مسح السجلات',
    auditLogsTitle: language === 'English' ? 'Audit Logs | SimpleIT' : 'سجلات التدقيق | SimpleIT',
    auditLogsDescription: language === 'English' ? 'View and search system audit logs. Track user actions and security events.' : 'عرض والبحث في سجلات تدقيق النظام. تتبع إجراءات المستخدم والأحداث الأمنية.',
    id: language === 'English' ? 'ID' : 'المعرف',
    timestamp: language === 'English' ? 'Timestamp' : 'الوقت',
    details: language === 'English' ? 'Details' : 'التفاصيل',
  };
  
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clearOptions, setClearOptions] = useState<{
    timeframe: string;
    entityType: string;
    action: string;
  }>({
    timeframe: 'all',
    entityType: '',
    action: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  if (filters.filter) queryParams.append('filter', filters.filter);
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.entityType) queryParams.append('entityType', filters.entityType);
  
  if (filters.startDate) {
    queryParams.append('startDate', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    queryParams.append('endDate', filters.endDate.toISOString());
  }
  
  // Define types for our API response
  interface AuditLogResponse {
    data: Array<{
      id: number;
      createdAt: string;
      action: string;
      entityType: string;
      entityId?: number;
      details?: any;
      user?: {
        id: number;
        username: string;
      };
      userId?: number;
    }>;
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    };
  }

  // Fetch audit logs with filters
  const {
    data = { data: [], pagination: { totalItems: 0, totalPages: 1, currentPage: 1, pageSize: limit } } as AuditLogResponse,
    isLoading,
    isError,
    error
  } = useQuery<AuditLogResponse>({
    queryKey: ['/api/audit-logs', page, limit, filters],
    enabled: hasAccess(3), // Only accessible to level 3 users
  });
  
  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async (options: any) => {
      const response = await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(options),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to clear logs');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: translations.logsCleared,
        description: data.message || `${translations.successfullyCleared} ${data.deletedCount} ${translations.logEntries}`,
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || translations.failedToClearLogs,
        variant: 'destructive'
      });
    }
  });
  
  // Handle clear logs
  const handleClearLogs = () => {
    const options: any = {};
    
    // Set olderThan date based on timeframe selection
    if (clearOptions.timeframe !== 'all') {
      if (clearOptions.timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        options.olderThan = weekAgo.toISOString();
      } else if (clearOptions.timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        options.olderThan = monthAgo.toISOString();
      } else if (clearOptions.timeframe === 'year') {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        options.olderThan = yearAgo.toISOString();
      }
    }
    
    // Add entity type and action filters if selected
    if (clearOptions.entityType && clearOptions.entityType !== '') {
      options.entityType = clearOptions.entityType;
    }
    
    if (clearOptions.action && clearOptions.action !== '') {
      options.action = clearOptions.action;
    }
    
    clearLogsMutation.mutate(options);
  };

  // Fetch users for filtering
  const { data: users = [] } = useQuery<Array<{ id: number; username: string }>>({
    queryKey: ['/api/users'],
    enabled: hasAccess(3),
  });
  
  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const exportToCSV = () => {
    if (!data || !data.data) return;
    
    const headers = [
      translations.id || 'ID', 
      translations.timestamp || 'Timestamp', 
      translations.user || 'User', 
      translations.action || 'Action', 
      translations.entityType || 'Entity Type', 
      'Entity ID', 
      translations.details || 'Details'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.data.map((log: any) => [
        log.id,
        new Date(log.createdAt).toISOString(),
        log.user ? log.user.username : translations.system || 'System',
        log.action,
        log.entityType,
        log.entityId || '',
        JSON.stringify(log.details || '').replace(/,/g, ';').replace(/"/g, '""')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasAccess(3)) {
    return (
      <Card className="mt-6">
        <CardHeader className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <CardTitle>{translations.accessRestricted}</CardTitle>
          <CardDescription>
            {translations.noPermissionAuditLogs}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Helmet>
        <title>{translations.auditLogsTitle}</title>
        <meta name="description" content={translations.auditLogsDescription} />
      </Helmet>
      
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{translations.auditLogs}</h1>
            <p className="text-muted-foreground">
              {translations.viewSearchActivity}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {hasAccess(3) && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="mt-4 sm:mt-0"
                    disabled={isLoading || isError || !data?.data?.length}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {translations.clearLogs}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                      {translations.clearAuditLogs}
                    </DialogTitle>
                    <DialogDescription>
                      {translations.actionCannotBeUndone}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeframe">{translations.timePeriod}</Label>
                      <Select
                        value={clearOptions.timeframe}
                        onValueChange={(value: any) => setClearOptions({...clearOptions, timeframe: value})}
                      >
                        <SelectTrigger id="timeframe">
                          <SelectValue placeholder={translations.selectTimePeriod} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{translations.allLogs}</SelectItem>
                          <SelectItem value="week">{translations.olderThan1Week}</SelectItem>
                          <SelectItem value="month">{translations.olderThan1Month}</SelectItem>
                          <SelectItem value="year">{translations.olderThan1Year}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="entityType">{translations.entityType}</Label>
                      <Select
                        value={clearOptions.entityType}
                        onValueChange={(value: any) => setClearOptions({...clearOptions, entityType: value})}
                      >
                        <SelectTrigger id="entityType">
                          <SelectValue placeholder={translations.allEntityTypes} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{translations.allEntityTypes}</SelectItem>
                          <SelectItem value="USER">{translations.user}</SelectItem>
                          <SelectItem value="EMPLOYEE">{translations.employee}</SelectItem>
                          <SelectItem value="ASSET">{translations.asset}</SelectItem>
                          <SelectItem value="TICKET">{translations.ticket}</SelectItem>
                          <SelectItem value="REPORT">{translations.report}</SelectItem>
                          <SelectItem value="SYSTEM">{translations.system}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="action">{translations.action}</Label>
                      <Select
                        value={clearOptions.action}
                        onValueChange={(value: any) => setClearOptions({...clearOptions, action: value})}
                      >
                        <SelectTrigger id="action">
                          <SelectValue placeholder={translations.allActions} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{translations.allActions}</SelectItem>
                          <SelectItem value="CREATE">{translations.create}</SelectItem>
                          <SelectItem value="UPDATE">{translations.update}</SelectItem>
                          <SelectItem value="DELETE">{translations.delete}</SelectItem>
                          <SelectItem value="LOGIN">{translations.login}</SelectItem>
                          <SelectItem value="LOGOUT">{translations.logout}</SelectItem>
                          <SelectItem value="VIEW">{translations.view}</SelectItem>
                          <SelectItem value="EXPORT">{translations.export}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      {translations.cancel}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleClearLogs}
                      disabled={clearLogsMutation.isPending}
                    >
                      {clearLogsMutation.isPending ? translations.clearing : translations.clearLogs}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              className="mt-4 sm:mt-0"
              disabled={isLoading || isError || !data?.data?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              {translations.exportCsv}
            </Button>
          </div>
        </div>

        <AuditLogFilter 
          onFilter={handleFilter} 
          users={users} 
          isLoading={isLoading}
        />

        {isError ? (
          <Card className="my-6">
            <CardHeader className="text-center">
              <CardTitle className="text-red-500">{translations.errorLoadingAuditLogs}</CardTitle>
              <CardDescription>
                {(error as any)?.message || translations.failedToLoadData}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                {translations.tryAgain}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <AuditLogTable logs={data?.data || []} isLoading={isLoading} />
                
                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(page - 1, 1))}
                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {[...Array(data.pagination.totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Show first page, last page, and pages around current
                          if (
                            pageNum === 1 || 
                            pageNum === data.pagination.totalPages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={page === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          // Show ellipsis between non-consecutive page numbers
                          if (
                            (pageNum === 2 && page > 3) ||
                            (pageNum === data.pagination.totalPages - 1 && page < data.pagination.totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(page + 1, data.pagination.totalPages))}
                            className={page === data.pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                
                <div className="mt-6 text-sm text-center text-muted-foreground">
                  {data?.pagination && (
                    <>
                      {translations.showing} {(page - 1) * limit + 1}-
                      {Math.min(page * limit, data.pagination.totalItems)} {translations.of} {data.pagination.totalItems} {translations.entries}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
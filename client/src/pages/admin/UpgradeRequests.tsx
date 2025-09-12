import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  RefreshCw, 
  ArrowLeft,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { RoleGuard } from '@/components/auth/RoleGuard';
import NotFound from '@/pages/not-found';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface UpgradeRequest {
  id: number;
  assetId: number;
  assetName: string;
  requestedBy: string;
  approvedBy: string | null;
  currentSpecs: string;
  requestedSpecs: string;
  reason: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  estimatedCost: number;
  requestedDate: string;
  approvedDate: string | null;
  completedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function UpgradeRequests() {
  const { language } = useLanguage();
  const { hasAccess } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'Approved' | 'Rejected' | 'In Progress' | 'Completed'>('Approved');
  const [statusNotes, setStatusNotes] = useState('');

  const translations = {
    title: language === 'English' ? 'Upgrade Requests' : 'طلبات الترقية',
    description: language === 'English' ? 'Manage asset upgrade requests and approvals' : 'إدارة طلبات ترقية الأصول والموافقات',
    backToAdmin: language === 'English' ? 'Back to Admin Console' : 'العودة لوحدة التحكم الإدارية',
    search: language === 'English' ? 'Search requests...' : 'البحث في الطلبات...',
    filterByStatus: language === 'English' ? 'Filter by Status' : 'تصفية حسب الحالة',
    filterByPriority: language === 'English' ? 'Filter by Priority' : 'تصفية حسب الأولوية',
    allStatuses: language === 'English' ? 'All Statuses' : 'جميع الحالات',
    allPriorities: language === 'English' ? 'All Priorities' : 'جميع الأولويات',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    noData: language === 'English' ? 'No upgrade requests found' : 'لم يتم العثور على طلبات ترقية',
    loading: language === 'English' ? 'Loading...' : 'جاري التحميل...',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    requestedBy: language === 'English' ? 'Requested By' : 'طلب بواسطة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    requestedDate: language === 'English' ? 'Requested Date' : 'تاريخ الطلب',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    pending: language === 'English' ? 'Pending' : 'معلق',
    approved: language === 'English' ? 'Approved' : 'موافق عليه',
    rejected: language === 'English' ? 'Rejected' : 'مرفوض',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'عالي',
    critical: language === 'English' ? 'Critical' : 'حرج',
    editStatus: language === 'English' ? 'Edit Status' : 'تعديل الحالة',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    updateStatus: language === 'English' ? 'Update Status' : 'تحديث الحالة',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    statusUpdated: language === 'English' ? 'Status updated successfully' : 'تم تحديث الحالة بنجاح',
    updateFailed: language === 'English' ? 'Failed to update status' : 'فشل في تحديث الحالة',
    noAccess: language === 'English' ? 'You do not have permission to view this page' : 'ليس لديك صلاحية لعرض هذه الصفحة',
  };

  // Check if user has access
  if (!hasAccess(2)) {
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

  // Fetch upgrade requests
  const { data: requests, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/asset-upgrades', { searchTerm, statusFilter, priorityFilter, currentPage, itemsPerPage }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      });
      
      const response = await apiRequest(`/api/asset-upgrades?${params}`);
      return response;
    },
    staleTime: 30000, // 30 seconds
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return apiRequest(`/api/asset-upgrades/${id}/status`, 'PUT', { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/asset-upgrades'] });
      toast({
        title: translations.statusUpdated,
        description: language === 'English' ? 'The upgrade request status has been updated' : 'تم تحديث حالة طلب الترقية',
      });
      setShowStatusDialog(false);
      setSelectedRequest(null);
      setStatusNotes('');
    },
    onError: () => {
      toast({
        title: translations.updateFailed,
        description: language === 'English' ? 'Failed to update the upgrade request status' : 'فشل في تحديث حالة طلب الترقية',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pending': { variant: 'secondary' as const, icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      'Approved': { variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      'Rejected': { variant: 'destructive' as const, icon: XCircle, color: 'bg-red-100 text-red-800' },
      'In Progress': { variant: 'secondary' as const, icon: Clock, color: 'bg-blue-100 text-blue-800' },
      'Completed': { variant: 'default' as const, icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {translations[status.toLowerCase().replace(' ', '') as keyof typeof translations] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'Low': { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
      'Medium': { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'High': { variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' },
      'Critical': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig['Low'];

    return (
      <Badge variant={config.variant} className={config.color}>
        {translations[priority.toLowerCase() as keyof typeof translations] || priority}
      </Badge>
    );
  };

  const handleStatusUpdate = () => {
    if (selectedRequest) {
      updateStatusMutation.mutate({
        id: selectedRequest.id,
        status: newStatus,
        notes: statusNotes,
      });
    }
  };

  const openStatusDialog = (request: UpgradeRequest) => {
    if (request.status === 'Approved') {
      toast({
        title: language === 'English' ? 'Cannot modify approved request' : 'لا يمكن تعديل طلب موافق عليه',
        description: language === 'English' ? 'This request has already been approved' : 'هذا الطلب موافق عليه بالفعل',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRequest(request);
    setNewStatus('Approved');
    setStatusNotes('');
    setShowStatusDialog(true);
  };

  const PaginationControls = () => {
    if (!requests?.pagination) return null;
    
    const { currentPage: page, totalPages, totalItems } = requests.pagination;
    const startItem = (page - 1) * itemsPerPage + 1;
    const endItem = Math.min(page * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {language === 'English' 
            ? `Showing ${startItem}-${endItem} of ${totalItems} requests`
            : `عرض ${startItem}-${endItem} من ${totalItems} طلب`
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
    <RoleGuard allowedRoles={['admin', 'manager']} fallback={<NotFound />}>
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
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            {translations.refresh}
          </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.filterByStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allStatuses}</SelectItem>
                  <SelectItem value="Pending">{translations.pending}</SelectItem>
                  <SelectItem value="Approved">{translations.approved}</SelectItem>
                  <SelectItem value="Rejected">{translations.rejected}</SelectItem>
                  <SelectItem value="In Progress">{translations.inProgress}</SelectItem>
                  <SelectItem value="Completed">{translations.completed}</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.filterByPriority} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allPriorities}</SelectItem>
                  <SelectItem value="Low">{translations.low}</SelectItem>
                  <SelectItem value="Medium">{translations.medium}</SelectItem>
                  <SelectItem value="High">{translations.high}</SelectItem>
                  <SelectItem value="Critical">{translations.critical}</SelectItem>
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
                  {language === 'English' ? 'Failed to load upgrade requests' : 'فشل في تحميل طلبات الترقية'}
                </AlertDescription>
              </Alert>
            ) : !requests?.data?.length ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">{translations.noData}</h3>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translations.asset}</TableHead>
                      <TableHead>{translations.requestedBy}</TableHead>
                      <TableHead>{translations.priority}</TableHead>
                      <TableHead>{translations.status}</TableHead>
                      <TableHead>{translations.requestedDate}</TableHead>
                      <TableHead>{translations.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.data.map((request: UpgradeRequest) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium">{request.assetName}</div>
                          <div className="text-sm text-muted-foreground">ID: {request.assetId}</div>
                        </TableCell>
                        <TableCell>{request.requestedBy}</TableCell>
                        <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(request.requestedDate), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openStatusDialog(request)}
                              disabled={request.status === 'Approved'}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              {translations.editStatus}
                            </Button>
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

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translations.editStatus}</DialogTitle>
              <DialogDescription>
                {language === 'English' 
                  ? `Update the status for upgrade request: ${selectedRequest?.assetName}`
                  : `تحديث حالة طلب الترقية: ${selectedRequest?.assetName}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">{translations.status}</Label>
                <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">{translations.approved}</SelectItem>
                    <SelectItem value="Rejected">{translations.rejected}</SelectItem>
                    <SelectItem value="In Progress">{translations.inProgress}</SelectItem>
                    <SelectItem value="Completed">{translations.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">{translations.notes}</Label>
                <Textarea
                  id="notes"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder={language === 'English' ? 'Add notes about this status change...' : 'أضف ملاحظات حول تغيير الحالة...'}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                {translations.cancel}
              </Button>
              <Button 
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 
                  (language === 'English' ? 'Updating...' : 'جاري التحديث...') : 
                  translations.updateStatus
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}

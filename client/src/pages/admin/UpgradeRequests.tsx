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
  Eye,
  FileText
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
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'Approved' | 'Rejected' | 'In Progress' | 'Completed'>('Approved');
  const [statusNotes, setStatusNotes] = useState('');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [decision, setDecision] = useState<string>('');
  const [reviewNote, setReviewNote] = useState('');

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
    reviewRequest: language === 'English' ?'مراجعة الطلب' : 'مراجعة الطلب',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    updateStatus: language === 'English' ? 'Update Status' : 'تحديث الحالة',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    notes: language === 'English' ? 'Notes' : 'ملاحظات',
    statusUpdated: language === 'English' ? 'Status updated successfully' : 'تم تحديث الحالة بنجاح',
    updateFailed: language === 'English' ? 'Failed to update status' : 'فشل في تحديث الحالة',
    noAccess: language === 'English' ? 'You do not have permission to view this page' : 'ليس لديك صلاحية لعرض هذه الصفحة',
    editStatus: language === 'English' ? 'Edit Status' : 'تعديل الحالة',
    reviewRequest: language === 'English' ? 'Review Request' : 'مراجعة الطلب',
    requestDetails: language === 'English' ? 'Request Details' : 'تفاصيل الطلب',
    decision: language === 'English' ? 'Decision' : 'القرار',
    reviewNote: language === 'English' ? 'Review Note' : 'ملاحظة المراجعة',
    approve: language === 'English' ? 'Approve' : 'موافقة',
    reject: language === 'English' ? 'Reject' : 'رفض',
    keepPending: language === 'English' ? 'Keep Pending' : 'إبقاء معلق',
    submitDecision: language === 'English' ? 'Submit Decision' : 'إرسال القرار',
    selectDecision: language === 'English' ? 'Select a decision' : 'اختر قرارًا',
    addReviewNote: language === 'English' ? 'Add a note about your decision...' : 'أضف ملاحظة حول قرارك...',
    requestId: language === 'English' ? 'Request ID' : 'رقم الطلب',
    employee: language === 'English' ? 'Employee' : 'الموظف',
    department: language === 'English' ? 'Department' : 'القسم',
    requestDate: language === 'English' ? 'Request Date' : 'تاريخ الطلب',
    currentAsset: language === 'English' ? 'Current Asset' : 'الأصل الحالي',
    requestedAsset: language === 'English' ? 'Requested Asset' : 'الأصل المطلوب',
    reason: language === 'English' ? 'Reason' : 'السبب',
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
  const { data: rawRequests, isLoading, error, refetch } = useQuery({
  queryKey: ['/api/upgrades', { searchTerm, statusFilter, priorityFilter }],
  queryFn: async () => {
    const params = new URLSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
    });
    
    const response = await apiRequest(`/api/upgrades?${params}`);
    
    // Map the response to match the expected interface
    return response.map((item: any) => ({
      id: item.id,
      assetId: item.asset_id,
      assetName: item.assetInfo?.assetId || item.asset_asset_id || '',
      requestedBy: item.createdByName || item.created_by_name || '',
      approvedBy: item.approvedByName || item.approved_by_name || null,
      currentSpecs: `${item.assetInfo?.type || ''} - ${item.assetInfo?.brand || ''} ${item.assetInfo?.modelName || ''}`,
      requestedSpecs: item.upgrade_type || item.upgradeType || '',
      reason: item.justification || '',
      priority: item.priority || 'Medium',
      status: item.status || 'Pending',
      estimatedCost: item.estimated_cost || item.estimatedCost || 0,
      requestedDate: item.created_at || item.createdAt,
      approvedDate: item.approval_date || item.approvalDate || null,
      completedDate: null,
      notes: item.notes || null,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
    }));
  },
  staleTime: 30000,
});

  const requests = rawRequests || [];


  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return apiRequest(`/api/upgrades/${id}/status`, 'PUT', { status, notes });
    },
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/upgrades', { searchTerm, statusFilter, priorityFilter }] });
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

  const ReviewRequestDialog = () => {
  if (!selectedRequest) return null;

  const handleSubmitDecision = async () => {
    try {
      const response = await fetch(`/api/upgrade-requests/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: decision,
          note: reviewNote 
        })
      });

      if (response.ok) {
        toast.success(`Request ${decision.toLowerCase()} successfully`);
        setShowReviewDialog(false);
        setSelectedRequest(null);
        setDecision('');
        setReviewNote('');
        refetch(); // Refresh the list
      }
    } catch (error) {
      toast.error('Failed to update request status');
    }

    const ReviewRequestDialog = () => {
  if (!selectedRequest) return null;

  const canReview = user?.role === 'admin' || user?.role === 'it_staff';
  
  if (!canReview) {
    return (
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.accessDenied}</DialogTitle>
          </DialogHeader>
          <p>{translations.noPermission}</p>
          <DialogFooter>
            <Button onClick={() => setShowReviewDialog(false)}>{translations.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmitDecision = async () => {
    try {
      const response = await fetch(`/api/upgrade-requests/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status: decision,
          note: reviewNote,
          reviewedBy: user?.id,
          reviewedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success(
          decision === 'Approved' ? translations.requestApproved :
          decision === 'Rejected' ? translations.requestRejected :
          translations.requestUpdated
        );
        setShowReviewDialog(false);
        setSelectedRequest(null);
        setDecision('');
        setReviewNote('');
        queryClient.invalidateQueries({ queryKey: ['/api/upgrade-requests'] });
      } else {
        const error = await response.json();
        toast.error(error.message || translations.updateFailed);
      }
    } catch (error) {
      toast.error(translations.updateFailed);
    }
  };

    return (
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.reviewRequest}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Request Details */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">{translations.requestDetails}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">{translations.requestId}:</span> #{selectedRequest?.id}
                </div>
                <div>
                  <span className="font-medium">{translations.status}:</span>
                  <Badge className="ml-2" variant={
                    selectedRequest?.status === 'Approved' ? 'success' :
                    selectedRequest?.status === 'Rejected' ? 'destructive' : 
                    'default'
                  }>
                    {selectedRequest?.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">{translations.employee}:</span> {selectedRequest?.employeeName}
                </div>
                <div>
                  <span className="font-medium">{translations.department}:</span> {selectedRequest?.department}
                </div>
                <div>
                  <span className="font-medium">{translations.requestDate}:</span> {
                    selectedRequest?.requestDate ? 
                    new Date(selectedRequest.requestDate).toLocaleDateString() : 
                    'N/A'
                  }
                </div>
                <div className="col-span-2">
                  <span className="font-medium">{translations.currentAsset}:</span> {selectedRequest?.currentAsset}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">{translations.requestedAsset}:</span> {selectedRequest?.requestedAsset}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">{translations.reason}:</span>
                  <p className="mt-1 text-gray-600">{selectedRequest?.reason}</p>
                </div>
              </div>
            </div>

            {/* Decision Selection */}
            <div className="space-y-2">
              <Label>{translations.decision} *</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.selectDecision} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      {translations.approve}
                    </div>
                  </SelectItem>
                  <SelectItem value="Rejected">
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      {translations.reject}
                    </div>
                  </SelectItem>
                  <SelectItem value="Pending">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                      {translations.keepPending}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Review Note */}
            <div className="space-y-2">
              <Label>{translations.reviewNote} *</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={translations.addReviewNote}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReviewDialog(false);
                setDecision('');
                setReviewNote('');
              }}
            >
              {translations.cancel}
            </Button>
            <Button 
              onClick={handleSubmitDecision}
              disabled={!decision || !reviewNote.trim()}
            >
              {translations.submitDecision}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
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
            ) : !rawRequests?.length ? (
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
                    {rawRequests?.map((request: UpgradeRequest) => (
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
                              {translations.reviewRequest}
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
              <DialogTitle>{translations.reviewRequest}</DialogTitle>
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
         {(user?.role === 'admin' || user?.role === 'it_staff') && (
            <Button 
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(request);
                setShowReviewDialog(true);
              }}
            >
              <FileText className="w-4 h-4 mr-1" />
              {translations.reviewRequest}
            </Button>
          )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
           <ReviewRequestDialog />
      </div>
    </RoleGuard>
  );
}

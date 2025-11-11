import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Wrench,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';

interface UpgradeRequest {
  id: number;
  assetId: number;
  assetName: string;
  title: string;
  description: string;
  category: string;
  upgradeType: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled';
  scheduledDate: string;
  justification: string;
  estimatedCost?: number;
  purchaseRequired: boolean;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvalDate?: string;
  assetInfo?: {
    assetId: string;
    type: string;
    brand: string;
    modelName?: string;
  };
  assignedEmployee?: {
    name: string;
    employeeId: string;
    department: string;
  } | null;
}

export default function UpgradeRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Dialog states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [decision, setDecision] = useState<string>('');
  const [reviewNote, setReviewNote] = useState('');

  // Translations
  const translations = {
    upgradeRequests: language === 'English' ? 'Upgrade Requests' : 'طلبات الترقية',
    search: language === 'English' ? 'Search' : 'بحث',
    searchPlaceholder: language === 'English' ? 'Search by asset or title...' : 'البحث بالأصل أو العنوان...',
    allStatuses: language === 'English' ? 'All Statuses' : 'جميع الحالات',
    allPriorities: language === 'English' ? 'All Priorities' : 'جميع الأولويات',
    pending: language === 'English' ? 'Pending' : 'معلق',
    approved: language === 'English' ? 'Approved' : 'موافق عليه',
    rejected: language === 'English' ? 'Rejected' : 'مرفوض',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'عالي',
    reviewRequest: language === 'English' ? 'Review Request' : 'مراجعة الطلب',
    requestDetails: language === 'English' ? 'Request Details' : 'تفاصيل الطلب',
    decision: language === 'English' ? 'Decision' : 'القرار',
    reviewNote: language === 'English' ? 'Review Note' : 'ملاحظة المراجعة',
    draft: language === 'English' ? 'Draft' : 'مسودة',
    pendingApproval: language === 'English' ? 'Pending Approval' : 'في انتظار الموافقة',
    approve: language === 'English' ? 'Approve' : 'موافقة',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    completed: language === 'English' ? 'Completed' : 'مكتمل',
    cancelled: language === 'English' ? 'Cancelled' : 'ملغى',
    submitDecision: language === 'English' ? 'Submit Decision' : 'إرسال القرار',
    selectDecision: language === 'English' ? 'Select a decision' : 'اختر قرارًا',
    addReviewNote: language === 'English' ? 'Add a note about your decision...' : 'أضف ملاحظة حول قرارك...',
    requestId: language === 'English' ? 'Request ID' : 'رقم الطلب',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    title: language === 'English' ? 'Title' : 'العنوان',
    category: language === 'English' ? 'Category' : 'الفئة',
    upgradeType: language === 'English' ? 'Upgrade Type' : 'نوع الترقية',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    scheduledDate: language === 'English' ? 'Scheduled Date' : 'التاريخ المجدول',
    createdBy: language === 'English' ? 'Created By' : 'أنشئ بواسطة',
    assignedEmployee: language === 'English' ? 'Assigned Employee' : 'الموظف المعين',
    department: language === 'English' ? 'Department' : 'القسم',
    notAssigned: language === 'English' ? 'Not Assigned' : 'غير معين',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    noRequests: language === 'English' ? 'No upgrade requests found' : 'لا توجد طلبات ترقية',
    loading: language === 'English' ? 'Loading...' : 'جار التحميل...',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    export: language === 'English' ? 'Export' : 'تصدير',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    justification: language === 'English' ? 'Justification' : 'المبرر',
    estimatedCost: language === 'English' ? 'Estimated Cost' : 'التكلفة المقدرة',
    purchaseRequired: language === 'English' ? 'Purchase Required' : 'يتطلب شراء',
    yes: language === 'English' ? 'Yes' : 'نعم',
    no: language === 'English' ? 'No' : 'لا',
    page: language === 'English' ? 'Page' : 'صفحة',
    of: language === 'English' ? 'of' : 'من',
    total: language === 'English' ? 'Total' : 'المجموع',
    requests: language === 'English' ? 'requests' : 'طلبات',
    hardware: language === 'English' ? 'Hardware' : 'أجهزة',
    software: language === 'English' ? 'Software' : 'برمجيات',
    requestApproved: language === 'English' ? 'Request approved successfully' : 'تمت الموافقة على الطلب بنجاح',
    requestUpdated: language === 'English' ? 'Request status updated successfully' : 'تم تحديث حالة الطلب بنجاح',
    updateFailed: language === 'English' ? 'Failed to update request' : 'فشل تحديث الطلب',
  };

  // Fetch upgrade requests
  const { data: rawRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/upgrades'],
    queryFn: async () => {
      const response = await apiRequest('/api/upgrades');
      return response.map((item: any) => ({
        id: item.id,
        assetId: item.asset_id || item.assetId,
        assetName: item.assetInfo?.assetId || item.asset_asset_id || '',
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        upgradeType: item.upgrade_type || item.upgradeType || '',
        priority: item.priority || 'Medium',
        status: item.status || 'Pending Approval',
        scheduledDate: item.scheduled_date || item.scheduledDate || '',
        justification: item.justification || '',
        estimatedCost: item.estimated_cost || item.estimatedCost || 0,
        purchaseRequired: item.purchase_required || item.purchaseRequired || false,
        createdBy: item.createdByName || item.created_by_name || '',
        createdAt: item.created_at || item.createdAt || '',
        approvedBy: item.approvedByName || item.approved_by_name || null,
        approvalDate: item.approval_date || item.approvalDate || null,
        assetInfo: item.assetInfo || {
          assetId: item.asset_asset_id || '',
          type: item.asset_type || '',
          brand: item.asset_brand || '',
          modelName: item.asset_model_name || ''
        },
        assignedEmployee: item.assignedEmployee || null,
        // Map for backward compatibility with original interface
        employeeName: item.createdByName || item.created_by_name || '',
        employeeCode: '',  // Not available in current backend
        department: '',     // Not available in current backend
        currentAsset: `${item.assetInfo?.type || ''} - ${item.assetInfo?.brand || ''} ${item.assetInfo?.modelName || ''}`.trim(),
        requestedAsset: item.upgrade_type || item.upgradeType || '',
        reason: item.justification || '',
        requestDate: item.created_at || item.createdAt || '',
        reviewedByName: item.approvedByName || item.approved_by_name || null,
        reviewedAt: item.approval_date || item.approvalDate || null,
        reviewNote: item.notes || ''
      }));
    },
    staleTime: 30000,
  });

  // Filter and search logic
  const filteredRequests = rawRequests.filter((request: UpgradeRequest) => {
    const matchesSearch = searchTerm === '' ||
      request.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.upgradeType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  // Update status mutation with transaction creation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      // Update the status - backend automatically creates asset transaction records
      // for status changes to 'Approved', 'Completed', or 'Cancelled'
      const response = await apiRequest(`/api/upgrades/${id}/status`, 'POST', { status, notes });
      
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: variables.status === 'Approved' 
          ? translations.requestApproved 
          : translations.requestUpdated,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/upgrades'] });
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setDecision('');
      setReviewNote('');
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message || translations.updateFailed,
        variant: 'destructive',
      });
    },
  });

  // Handle review submission
  const handleSubmitDecision = () => {
    if (!selectedRequest || !decision || !reviewNote.trim()) return;

    updateStatusMutation.mutate({
      id: selectedRequest.id,
      status: decision,
      notes: reviewNote,
    });
  };

  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Request ID', 'Asset', 'Title', 'Category', 'Type', 'Priority', 'Status', 'Scheduled Date', 'Created By'].join(','),
      ...filteredRequests.map(req => [
        req.id,
        `"${req.assetName}"`,
        `"${req.title}"`,
        req.category,
        req.upgradeType,
        req.priority,
        req.status,
        req.scheduledDate ? format(new Date(req.scheduledDate), 'yyyy-MM-dd') : '',
        `"${req.createdBy}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upgrade-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Completed': return 'success';
      case 'Pending Approval': return 'warning';  // Yellow/orange for waiting states
      case 'In Progress': return 'secondary';     // Gray for active work
      case 'Rejected':
      case 'Cancelled': return 'destructive';    // Red for negative states
      case 'Draft': return 'outline';            // Outline for draft state
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "warning" => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'In Progress': return <Wrench className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Cancelled': return <Ban className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">{translations.upgradeRequests}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {translations.refresh}
              </Button>
              {filteredRequests.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  {translations.export}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder={translations.searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={translations.allStatuses} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allStatuses}</SelectItem>
                  <SelectItem value="Draft">{translations.draft}</SelectItem>
                  <SelectItem value="Pending Approval">{translations.pendingApproval}</SelectItem>
                  <SelectItem value="Approved">{translations.approved}</SelectItem>
                  <SelectItem value="In Progress">{translations.inProgress}</SelectItem>
                  <SelectItem value="Completed">{translations.completed}</SelectItem>
                  <SelectItem value="Cancelled">{translations.cancelled}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={translations.allPriorities} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allPriorities}</SelectItem>
                  <SelectItem value="Low">{translations.low}</SelectItem>
                  <SelectItem value="Medium">{translations.medium}</SelectItem>
                  <SelectItem value="High">{translations.high}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translations.requestId}</TableHead>
                  <TableHead>{translations.asset}</TableHead>
                  <TableHead>{translations.title}</TableHead>
                  <TableHead>{translations.category}</TableHead>
                  <TableHead>{translations.upgradeType}</TableHead>
                  <TableHead>{translations.priority}</TableHead>
                  <TableHead>{translations.status}</TableHead>
                  <TableHead>{translations.assignedEmployee}</TableHead>
                  <TableHead>{translations.scheduledDate}</TableHead>
                  <TableHead>{translations.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        {translations.loading}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">{translations.noRequests}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">#{request.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{request.assetName}</span>
                          {request.assetInfo && (
                            <span className="text-xs text-gray-500">
                              {request.assetInfo.type} - {request.assetInfo.brand}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={request.title}>
                          {request.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={request.category === 'Hardware' ? 'bg-blue-50' : 'bg-green-50'}>
                          {request.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={request.upgradeType}>
                          {request.upgradeType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.assignedEmployee ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{request.assignedEmployee.name}</span>
                            <span className="text-xs text-gray-500">{request.assignedEmployee.department}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">{translations.notAssigned}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.scheduledDate ? format(new Date(request.scheduledDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowReviewDialog(true);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            {translations.reviewRequest}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                {translations.page} {currentPage} {translations.of} {totalPages} | {translations.total}: {filteredRequests.length} {translations.requests}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{translations.reviewRequest}</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">{translations.requestDetails}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">{translations.requestId}:</span>
                    <span className="ml-2">#{selectedRequest.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.status}:</span>
                    <Badge className="ml-2" variant={getStatusBadgeVariant(selectedRequest.status)}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.asset}:</span>
                    <span className="ml-2">{selectedRequest.assetName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.category}:</span>
                    <span className="ml-2">{selectedRequest.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.upgradeType}:</span>
                    <span className="ml-2">{selectedRequest.upgradeType}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.priority}:</span>
                    <Badge className="ml-2" variant={getPriorityBadgeVariant(selectedRequest.priority)}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.scheduledDate}:</span>
                    <span className="ml-2">
                      {selectedRequest.scheduledDate
                        ? format(new Date(selectedRequest.scheduledDate), 'MMM dd, yyyy')
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.estimatedCost}:</span>
                    <span className="ml-2">
                      {selectedRequest.estimatedCost ? `$${selectedRequest.estimatedCost}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{translations.assignedEmployee}:</span>
                    <span className="ml-2">
                      {selectedRequest.assignedEmployee
                        ? `${selectedRequest.assignedEmployee.name} (${selectedRequest.assignedEmployee.department})`
                        : translations.notAssigned}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">{translations.title}:</span>
                    <p className="mt-1">{selectedRequest.title}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">{translations.justification}:</span>
                    <p className="mt-1 text-gray-700 bg-white p-2 rounded border">
                      {selectedRequest.justification}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decision Selection */}
              <div className="space-y-2">
                <Label htmlFor="decision">{translations.decision} *</Label>
                <Select value={decision} onValueChange={setDecision}>
                  <SelectTrigger id="decision">
                    <SelectValue placeholder={translations.selectDecision} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        {translations.approve}
                      </div>
                    </SelectItem>
                    <SelectItem value="In Progress">
                      <div className="flex items-center">
                        <Wrench className="w-4 h-4 mr-2 text-blue-600" />
                        {translations.inProgress}
                      </div>
                    </SelectItem>
                    <SelectItem value="Completed">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        {translations.completed}
                      </div>
                    </SelectItem>
                    <SelectItem value="Cancelled">
                      <div className="flex items-center">
                        <Ban className="w-4 h-4 mr-2 text-red-600" />
                        {translations.cancelled}
                      </div>
                    </SelectItem>
                    <SelectItem value="Pending Approval">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                        {translations.pendingApproval}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Review Note */}
              <div className="space-y-2">
                <Label htmlFor="reviewNote">{translations.reviewNote} *</Label>
                <Textarea
                  id="reviewNote"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={translations.addReviewNote}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  This note will be recorded in the upgrade history.
                </p>
              </div>
            </div>
          )}

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
    </div>
  );
}
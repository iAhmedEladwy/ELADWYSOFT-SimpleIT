import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  DialogDescription,
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
import {
  Search,
  Filter,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Package,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

interface UpgradeRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  department: string;
  currentAssetId: number;
  currentAsset: string;
  requestedAssetId: number;
  requestedAsset: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High';
  requestDate: string;
  reviewedBy?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UpgradeRequests() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  // Dialog states
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null);
  const [decision, setDecision] = useState<string>('');
  const [reviewNote, setReviewNote] = useState('');
  
  // Get user info and language preference
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    staleTime: Infinity,
  });
  
  const language = user?.language || 'English';
  
  // Translations
  const translations = {
    upgradeRequests: language === 'English' ? 'Upgrade Requests' : 'طلبات الترقية',
    search: language === 'English' ? 'Search' : 'بحث',
    searchPlaceholder: language === 'English' ? 'Search by employee or asset...' : 'البحث بالموظف أو الأصل...',
    filter: language === 'English' ? 'Filter' : 'تصفية',
    allStatuses: language === 'English' ? 'All Statuses' : 'جميع الحالات',
    allPriorities: language === 'English' ? 'All Priorities' : 'جميع الأولويات',
    allDepartments: language === 'English' ? 'All Departments' : 'جميع الأقسام',
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
    status: language === 'English' ? 'Status' : 'الحالة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    noRequests: language === 'English' ? 'No upgrade requests found' : 'لا توجد طلبات ترقية',
    loading: language === 'English' ? 'Loading...' : 'جار التحميل...',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    export: language === 'English' ? 'Export' : 'تصدير',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    accessDenied: language === 'English' ? 'Access Denied' : 'الوصول مرفوض',
    noPermission: language === 'English' ? 'You don\'t have permission to review upgrade requests.' : 'ليس لديك صلاحية لمراجعة طلبات الترقية.',
    close: language === 'English' ? 'Close' : 'إغلاق',
    requestApproved: language === 'English' ? 'Request approved successfully' : 'تمت الموافقة على الطلب بنجاح',
    requestRejected: language === 'English' ? 'Request rejected successfully' : 'تم رفض الطلب بنجاح',
    requestUpdated: language === 'English' ? 'Request updated successfully' : 'تم تحديث الطلب بنجاح',
    updateFailed: language === 'English' ? 'Failed to update request' : 'فشل تحديث الطلب',
    reviewedBy: language === 'English' ? 'Reviewed By' : 'تمت المراجعة بواسطة',
    reviewedAt: language === 'English' ? 'Reviewed At' : 'تاريخ المراجعة',
    previousReviewNote: language === 'English' ? 'Previous Review Note' : 'ملاحظة المراجعة السابقة',
    page: language === 'English' ? 'Page' : 'صفحة',
    of: language === 'English' ? 'of' : 'من',
    total: language === 'English' ? 'Total' : 'المجموع',
    requests: language === 'English' ? 'requests' : 'طلبات',
  };
  
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

// Rename the variable to use the mapped data
const requests = rawRequests || [];
  
  // Fetch departments for filter
  const { data: departments = [] } = useQuery<string[]>({
    queryKey: ['/api/departments'],
    staleTime: 10 * 60 * 1000,
  });
  
  // Filter and search logic
  const filteredRequests = requests.filter((request) => {
    const matchesSearch = searchTerm === '' || 
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.currentAsset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedAsset.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || request.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });
  
  // Pagination
//  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
//  const startIndex = (currentPage - 1) * itemsPerPage;
//  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  
  // Review Dialog Component
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
        const response = await fetch(`/api/upgrades/${selectedRequest.id}/status`, {
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
          queryClient.invalidateQueries({ queryKey: ['/api/upgrades'] });
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
              <h3 className="font-semibold mb-3">{translations.requestDetails}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">{translations.requestId}:</span>
                  <span className="ml-2">#{selectedRequest?.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{translations.status}:</span>
                  <Badge className="ml-2" variant={
                    selectedRequest?.status === 'Approved' ? 'success' :
                    selectedRequest?.status === 'Rejected' ? 'destructive' : 
                    'default'
                  }>
                    {selectedRequest?.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{translations.employee}:</span>
                  <span className="ml-2">{selectedRequest?.employeeName} ({selectedRequest?.employeeCode})</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{translations.department}:</span>
                  <span className="ml-2">{selectedRequest?.department}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{translations.requestDate}:</span>
                  <span className="ml-2">
                    {selectedRequest?.requestDate ? 
                      format(new Date(selectedRequest.requestDate), 'MMM dd, yyyy') : 
                      'N/A'
                    }
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{translations.priority}:</span>
                  <Badge className="ml-2" variant={
                    selectedRequest?.priority === 'High' ? 'destructive' :
                    selectedRequest?.priority === 'Medium' ? 'warning' : 
                    'secondary'
                  }>
                    {selectedRequest?.priority}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">{translations.currentAsset}:</span>
                  <span className="ml-2">{selectedRequest?.currentAsset}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">{translations.requestedAsset}:</span>
                  <span className="ml-2">{selectedRequest?.requestedAsset}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">{translations.reason}:</span>
                  <p className="mt-1 text-gray-700 bg-white p-2 rounded border">{selectedRequest?.reason}</p>
                </div>
                {selectedRequest?.reviewNote && (
                  <div className="col-span-2 mt-2 pt-2 border-t">
                    <span className="font-medium text-gray-600">{translations.previousReviewNote}:</span>
                    <p className="mt-1 text-gray-700 bg-white p-2 rounded border">{selectedRequest?.reviewNote}</p>
                    {selectedRequest?.reviewedByName && (
                      <p className="text-xs text-gray-500 mt-1">
                        {translations.reviewedBy}: {selectedRequest.reviewedByName} | 
                        {translations.reviewedAt}: {selectedRequest.reviewedAt ? format(new Date(selectedRequest.reviewedAt), 'MMM dd, yyyy HH:mm') : ''}
                      </p>
                    )}
                  </div>
                )}
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
                This note will be visible to the employee and stored in the request history.
              </p>
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
  
  // Export function
  const handleExport = () => {
    const csvContent = [
      ['Request ID', 'Employee', 'Department', 'Current Asset', 'Requested Asset', 'Reason', 'Status', 'Priority', 'Request Date'].join(','),
      ...filteredRequests.map(req => [
        req.id,
        `"${req.employeeName}"`,
        req.department,
        `"${req.currentAsset}"`,
        `"${req.requestedAsset}"`,
        `"${req.reason.replace(/"/g, '""')}"`,
        req.status,
        req.priority,
        format(new Date(req.requestDate), 'yyyy-MM-dd')
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
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'destructive';
      default: return 'default';
    }
  };
  
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'warning';
      default: return 'secondary';
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
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={translations.allStatuses} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allStatuses}</SelectItem>
                  <SelectItem value="Pending">{translations.pending}</SelectItem>
                  <SelectItem value="Approved">{translations.approved}</SelectItem>
                  <SelectItem value="Rejected">{translations.rejected}</SelectItem>
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
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={translations.allDepartments} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{translations.allDepartments}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
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
                  <TableHead>{translations.employee}</TableHead>
                  <TableHead>{translations.department}</TableHead>
                  <TableHead>{translations.currentAsset}</TableHead>
                  <TableHead>{translations.requestedAsset}</TableHead>
                  <TableHead>{translations.reason}</TableHead>
                  <TableHead>{translations.status}</TableHead>
                  <TableHead>{translations.priority}</TableHead>
                  <TableHead>{translations.requestDate}</TableHead>
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
                        <div>
                          <div className="font-medium">{request.employeeName}</div>
                          <div className="text-sm text-gray-500">{request.employeeCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.department}</TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={request.currentAsset}>
                          {request.currentAsset}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px]">
                        <div className="truncate" title={request.requestedAsset}>
                          {request.requestedAsset}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.requestDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
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
      <ReviewRequestDialog />
    </div>
  );
}
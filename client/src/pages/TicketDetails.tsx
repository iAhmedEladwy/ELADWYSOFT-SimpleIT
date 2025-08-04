import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Edit2, 
  Save, 
  X, 
  AlertCircle, 
  Timer, 
  CheckCircle, 
  XCircle,
  User,
  Monitor,
  Clock,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function TicketDetails() {
  const [, params] = useRoute('/tickets/:id');
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  const ticketId = params?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Translations
  const translations = {
    backToTickets: language === 'English' ? 'Back to Tickets' : 'العودة للتذاكر',
    ticketDetails: language === 'English' ? 'Ticket Details' : 'تفاصيل التذكرة',
    edit: language === 'English' ? 'Edit' : 'تعديل',
    save: language === 'English' ? 'Save Changes' : 'حفظ التغييرات',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    ticketId: language === 'English' ? 'Ticket ID' : 'رقم التذكرة',
    summary: language === 'English' ? 'Summary' : 'الملخص',
    description: language === 'English' ? 'Description' : 'الوصف',
    requestType: language === 'English' ? 'Request Type' : 'نوع الطلب',
    category: language === 'English' ? 'Category' : 'الفئة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    submittedBy: language === 'English' ? 'Submitted By' : 'مُقدم من',
    assignedTo: language === 'English' ? 'Assigned To' : 'مُكلف إلى',
    relatedAsset: language === 'English' ? 'Related Asset' : 'الأصل المرتبط',
    timeSpent: language === 'English' ? 'Time Spent (hours)' : 'الوقت المستغرق (ساعات)',
    createdAt: language === 'English' ? 'Created' : 'تاريخ الإنشاء',
    updatedAt: language === 'English' ? 'Last Updated' : 'آخر تحديث',
    resolution: language === 'English' ? 'Resolution' : 'الحل',
    resolutionNotes: language === 'English' ? 'Resolution Notes' : 'ملاحظات الحل',
    ticketNotFound: language === 'English' ? 'Ticket not found' : 'التذكرة غير موجودة',
    ticketUpdated: language === 'English' ? 'Ticket updated successfully' : 'تم تحديث التذكرة بنجاح',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
    unassigned: language === 'English' ? 'Unassigned' : 'غير مُكلف',
  };

  // Fetch ticket details
  const { 
    data: ticket, 
    isLoading: ticketLoading,
    error: ticketError 
  } = useQuery({
    queryKey: ['/api/tickets', ticketId],
    queryFn: () => apiRequest(`/api/tickets/${ticketId}`, 'GET'),
    enabled: !!ticketId,
  });

  // Fetch employees for submitter/assignee info
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 10,
  });

  // Fetch assets for related asset info
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 1000 * 60 * 10,
  });

  // Fetch users for assignee info
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 10,
    enabled: hasAccess(2),
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (updates: any) => {
      return apiRequest(`/api/tickets/${ticketId}`, 'PATCH', updates);
    },
    onSuccess: () => {
      toast({ title: translations.ticketUpdated });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message || 'Failed to update ticket',
        variant: 'destructive',
      });
    },
  });

  // Initialize edit form when ticket loads
  useEffect(() => {
    if (ticket && !isEditing) {
      setEditForm({
        summary: ticket.summary || '',
        description: ticket.description || '',
        requestType: ticket.requestType || 'Hardware',
        category: ticket.category || 'Incident',
        priority: ticket.priority || 'Medium',
        status: ticket.status || 'Open',
        assignedToId: ticket.assignedToId?.toString() || '',
        timeSpent: ticket.timeSpent || 0,
        resolution: ticket.resolution || '',
        resolutionNotes: ticket.resolutionNotes || '',
      });
    }
  }, [ticket, isEditing]);

  const handleSave = () => {
    if (!ticket) return;

    const updates: any = {};
    
    // Only include changed fields
    if (editForm.summary !== ticket.summary) {
      updates.summary = editForm.summary;
    }
    if (editForm.description !== ticket.description) {
      updates.description = editForm.description;
    }
    if (editForm.requestType !== ticket.requestType) {
      updates.requestType = editForm.requestType;
    }
    if (editForm.category !== ticket.category) {
      updates.category = editForm.category;
    }
    if (editForm.priority !== ticket.priority) {
      updates.priority = editForm.priority;
    }
    if (editForm.status !== ticket.status) {
      updates.status = editForm.status;
    }
    if (editForm.assignedToId !== (ticket.assignedToId?.toString() || '')) {
      updates.assignedToId = editForm.assignedToId ? parseInt(editForm.assignedToId) : null;
    }
    if (editForm.timeSpent !== ticket.timeSpent) {
      updates.timeSpent = parseFloat(editForm.timeSpent) || 0;
    }
    if (editForm.resolution !== (ticket.resolution || '')) {
      updates.resolution = editForm.resolution;
    }
    if (editForm.resolutionNotes !== (ticket.resolutionNotes || '')) {
      updates.resolutionNotes = editForm.resolutionNotes;
    }

    if (Object.keys(updates).length > 0) {
      updateTicketMutation.mutate(updates);
    } else {
      setIsEditing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'In Progress':
        return <Timer className="h-4 w-4 text-yellow-500" />;
      case 'Resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (ticketLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {translations.ticketNotFound}
          </h2>
          <Button onClick={() => navigate('/tickets')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.backToTickets}
          </Button>
        </div>
      </div>
    );
  }

  const submittedByEmployee = (employees as any[]).find((e: any) => e.id === ticket.submittedById);
  const assignedToUser = (users as any[]).find((u: any) => u.id === ticket.assignedToId);
  const relatedAsset = (assets as any[]).find((a: any) => a.id === ticket.relatedAssetId);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/tickets')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {translations.backToTickets}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {translations.ticketDetails}
            </h1>
            <p className="text-gray-600">{ticket.ticketId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              {translations.edit}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                {translations.cancel}
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={updateTicketMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {translations.save}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>{translations.summary}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>{translations.summary}</Label>
                    <Input
                      value={editForm.summary}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, summary: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>{translations.description}</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                      rows={6}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{ticket.summary}</h3>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">{translations.description}</Label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution Section */}
          {(ticket.status === 'Resolved' || ticket.status === 'Closed' || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{translations.resolution}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>{translations.resolution}</Label>
                      <Textarea
                        value={editForm.resolution}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, resolution: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>{translations.resolutionNotes}</Label>
                      <Textarea
                        value={editForm.resolutionNotes}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, resolutionNotes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ticket.resolution && (
                      <div>
                        <Label className="text-sm text-gray-600">{translations.resolution}</Label>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">{ticket.resolution}</p>
                      </div>
                    )}
                    {ticket.resolutionNotes && (
                      <div>
                        <Label className="text-sm text-gray-600">{translations.resolutionNotes}</Label>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{translations.status}</Label>
                {isEditing ? (
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm((prev: any) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <span>{ticket.status}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>{translations.priority}</Label>
                {isEditing ? (
                  <Select
                    value={editForm.priority}
                    onValueChange={(value) => setEditForm((prev: any) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>{translations.requestType}</Label>
                {isEditing ? (
                  <Select
                    value={editForm.requestType}
                    onValueChange={(value) => setEditForm((prev: any) => ({ ...prev, requestType: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{ticket.requestType}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>{translations.category}</Label>
                {isEditing ? (
                  <Select
                    value={editForm.category}
                    onValueChange={(value) => setEditForm((prev: any) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incident">Incident</SelectItem>
                      <SelectItem value="Request">Request</SelectItem>
                      <SelectItem value="Problem">Problem</SelectItem>
                      <SelectItem value="Change">Change</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{ticket.category}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Relations */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment & Relations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {translations.submittedBy}
                </Label>
                <p className="mt-1 font-medium">
                  {submittedByEmployee?.englishName || submittedByEmployee?.name || 'Unknown'}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-600 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {translations.assignedTo}
                </Label>
                {isEditing ? (
                  <Select
                    value={editForm.assignedToId || "unassigned"}
                    onValueChange={(value) => setEditForm((prev: any) => ({ ...prev, assignedToId: value === "unassigned" ? null : value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={translations.unassigned} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{translations.unassigned}</SelectItem>
                      {(users as any[]).map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName || user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 font-medium">
                    {assignedToUser?.fullName || assignedToUser?.username || translations.unassigned}
                  </p>
                )}
              </div>

              {relatedAsset && (
                <div>
                  <Label className="text-sm text-gray-600 flex items-center">
                    <Monitor className="h-4 w-4 mr-1" />
                    {translations.relatedAsset}
                  </Label>
                  <p className="mt-1 font-medium cursor-pointer hover:text-blue-600" 
                     onClick={() => navigate(`/assets?view=${relatedAsset.id}`)}>
                    {relatedAsset.assetId} - {relatedAsset.name || relatedAsset.title || 'Unnamed'}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm text-gray-600 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {translations.timeSpent}
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editForm.timeSpent}
                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, timeSpent: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{ticket.timeSpent || 0} hours</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">{translations.createdAt}</Label>
                <p className="mt-1 text-sm">
                  {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                <div>
                  <Label className="text-sm text-gray-600">{translations.updatedAt}</Label>
                  <p className="mt-1 text-sm">
                    {format(new Date(ticket.updatedAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
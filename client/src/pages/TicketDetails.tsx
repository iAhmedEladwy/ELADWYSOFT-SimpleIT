import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Calendar as CalendarIcon,
  Target,
  Zap,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { calculatePriority, type UrgencyLevel, type ImpactLevel } from '@shared/priorityUtils';

interface EditForm {
  title: string;
  description: string;
  type: string;
  category: string;
  priority: string;
  urgency: string;
  impact: string;
  status: string;
  assignedToId: string;
  timeSpent: number;
  dueDate: string;
  slaTarget: string;
  resolution: string;
}

export default function TicketDetails() {
  const [, params] = useRoute('/tickets/:id');
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const t = useTicketTranslations(language);
  const { toast } = useToast();
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  
  const ticketId = params?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    description: '',
    type: 'Incident',
    category: 'General',
    priority: 'Medium',
    urgency: 'Medium',
    impact: 'Medium',
    status: 'Open',
    assignedToId: '',
    timeSpent: 0,
    dueDate: '',
    slaTarget: '',
    resolution: ''
  });

  // Early return if no ticket ID
  if (!ticketId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t.ticketNotFound}
          </h2>
          <Button onClick={() => navigate('/tickets')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToTickets}
          </Button>
        </div>
      </div>
    );
  }

  // Fetch ticket details
  const { 
    data: ticket, 
    isLoading: ticketLoading,
    error: ticketError 
  } = useQuery({
    queryKey: ['/api/tickets', ticketId],
    queryFn: () => apiRequest(`/api/tickets/${ticketId}`, 'GET'),
    enabled: !!ticketId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch employees for assignment
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiRequest('/api/employees', 'GET'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('/api/users', 'GET'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch assets for relation
  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    queryFn: () => apiRequest('/api/assets', 'GET'),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (updates: Partial<EditForm>) => {
      return apiRequest(`/api/tickets/${ticketId}`, 'PATCH', updates);
    },
    onSuccess: () => {
      toast({ title: t.ticketUpdated });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.errorUpdating,
        variant: 'destructive',
      });
    },
  });

  // Initialize edit form when ticket loads
  useEffect(() => {
    if (ticket && !isEditing) {
      setEditForm({
        title: ticket.title || '',
        description: ticket.description || '',
        type: ticket.type || 'Incident',
        category: ticket.category || 'General',
        priority: ticket.priority || 'Medium',
        urgency: ticket.urgency || 'Medium',
        impact: ticket.impact || 'Medium',
        status: ticket.status || 'Open',
        assignedToId: ticket.assignedToId?.toString() || '',
        timeSpent: ticket.timeSpent || 0,
        dueDate: ticket.dueDate || '',
        slaTarget: ticket.slaTarget || '',
        resolution: ticket.resolution || ''
      });
    }
  }, [ticket, isEditing]);

  // Calculate priority when urgency or impact changes
  useEffect(() => {
    if (isEditing) {
      const calculatedPriority = calculatePriority(
        editForm.urgency as UrgencyLevel, 
        editForm.impact as ImpactLevel
      );
      if (calculatedPriority !== editForm.priority) {
        setEditForm(prev => ({ ...prev, priority: calculatedPriority }));
      }
    }
  }, [editForm.urgency, editForm.impact, isEditing]);

  const handleSave = () => {
    if (!ticket) return;

    const updates: Partial<EditForm> = {};
    
    // Only include changed fields
    if (editForm.title !== ticket.title) {
      updates.title = editForm.title;
    }
    if (editForm.description !== ticket.description) {
      updates.description = editForm.description;
    }
    if (editForm.type !== ticket.type) {
      updates.type = editForm.type;
    }
    if (editForm.category !== ticket.category) {
      updates.category = editForm.category;
    }
    if (editForm.urgency !== ticket.urgency) {
      updates.urgency = editForm.urgency;
    }
    if (editForm.impact !== ticket.impact) {
      updates.impact = editForm.impact;
    }
    if (editForm.status !== ticket.status) {
      updates.status = editForm.status;
    }
    if (editForm.assignedToId !== (ticket.assignedToId?.toString() || '')) {
      updates.assignedToId = editForm.assignedToId ? parseInt(editForm.assignedToId) : null;
    }
    if (editForm.timeSpent !== ticket.timeSpent) {
      updates.timeSpent = editForm.timeSpent;
    }
    if (editForm.dueDate !== ticket.dueDate) {
      updates.dueDate = editForm.dueDate;
    }
    if (editForm.slaTarget !== ticket.slaTarget) {
      updates.slaTarget = editForm.slaTarget;
    }
    if (editForm.resolution !== ticket.resolution) {
      updates.resolution = editForm.resolution;
    }

    // Execute update
    updateTicketMutation.mutate(updates);
  };

  // Helper functions for badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'destructive';
      case 'in progress': return 'default';
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'incident': return 'destructive';
      case 'service request': return 'default';
      case 'problem': return 'destructive';
      case 'change': return 'default';
      default: return 'default';
    }
  };

  // Find related data
  const submittedByEmployee = employees.find((emp: any) => emp.id === ticket?.submittedById);
  const assignedToUser = users.find((user: any) => user.id === ticket?.assignedToId);
  const relatedAsset = assets.find((asset: any) => asset.id === ticket?.relatedAssetId);

  if (ticketLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
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
            {t.ticketNotFound}
          </h2>
          <Button onClick={() => navigate('/tickets')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToTickets}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => navigate('/tickets')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.backToTickets}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.ticketDetails}
            </h1>
            <p className="text-gray-600">#{ticket.ticketId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              {t.edit}
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                onClick={handleSave} 
                size="sm"
                disabled={updateTicketMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {t.save}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="outline" 
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Badge variant={getStatusColor(ticket.status)}>
          {ticket.status}
        </Badge>
        <Badge variant={getPriorityColor(ticket.priority)}>
          {t.priority}: {ticket.priority}
        </Badge>
        <Badge variant={getTypeColor(ticket.type)}>
          {ticket.type}
        </Badge>
        {ticket.category && (
          <Badge variant="outline">
            {ticket.category}
          </Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title and Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t.ticketDetails}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.title_field}
                </Label>
                {isEditing ? (
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm font-semibold">{ticket.title}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.description_field}
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm whitespace-pre-wrap">{ticket.description}</p>
                )}
              </div>

              {/* Resolution */}
              {(ticket.resolution || isEditing) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.resolution}
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.resolution}
                      onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                      rows={3}
                      className="mt-1"
                      placeholder={t.resolutionPlaceholder}
                    />
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{ticket.resolution}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Classification & Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.type}
                  </Label>
                  {isEditing ? (
                    <Select 
                      value={editForm.type} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Incident">{t.typeIncident}</SelectItem>
                        <SelectItem value="Service Request">{t.typeServiceRequest}</SelectItem>
                        <SelectItem value="Problem">{t.typeProblem}</SelectItem>
                        <SelectItem value="Change">{t.typeChange}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">{ticket.type}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.category}
                  </Label>
                  {isEditing ? (
                    <Select 
                      value={editForm.category} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hardware">{t.categoryHardware}</SelectItem>
                        <SelectItem value="Software">{t.categorySoftware}</SelectItem>
                        <SelectItem value="Network">{t.categoryNetwork}</SelectItem>
                        <SelectItem value="Access">{t.categoryAccess}</SelectItem>
                        <SelectItem value="Other">{t.categoryOther}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">{ticket.category}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.urgency}
                  </Label>
                  {isEditing ? (
                    <Select 
                      value={editForm.urgency} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, urgency: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">{t.urgencyLow}</SelectItem>
                        <SelectItem value="Medium">{t.urgencyMedium}</SelectItem>
                        <SelectItem value="High">{t.urgencyHigh}</SelectItem>
                        <SelectItem value="Critical">{t.urgencyCritical}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">{ticket.urgency}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.impact}
                  </Label>
                  {isEditing ? (
                    <Select 
                      value={editForm.impact} 
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, impact: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">{t.impactLow}</SelectItem>
                        <SelectItem value="Medium">{t.impactMedium}</SelectItem>
                        <SelectItem value="High">{t.impactHigh}</SelectItem>
                        <SelectItem value="Critical">{t.impactCritical}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm">{ticket.impact}</p>
                  )}
                </div>
              </div>

              {/* Calculated Priority Display */}
              {isEditing && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      {t.priority}: {editForm.priority}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Calculated from {editForm.urgency} urgency × {editForm.impact} impact
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Assignment & Metadata */}
        <div className="space-y-6">
          
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.submittedBy}
                </Label>
                <p className="mt-1 text-sm">
                  {submittedByEmployee?.englishName || t.none}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.assignedTo}
                </Label>
                {isEditing ? (
                  <Select 
                    value={editForm.assignedToId || "unassigned"} 
                    onValueChange={(value) => setEditForm(prev => ({ 
                      ...prev, 
                      assignedToId: value === "unassigned" ? "" : value 
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t.unassigned}</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">
                    {assignedToUser?.username || t.unassigned}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.status}
                </Label>
                {isEditing ? (
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">{t.statusOpen}</SelectItem>
                      <SelectItem value="In Progress">{t.statusInProgress}</SelectItem>
                      <SelectItem value="Resolved">{t.statusResolved}</SelectItem>
                      <SelectItem value="Closed">{t.statusClosed}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-sm">{ticket.status}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.createdAt}
                </Label>
                <p className="mt-1 text-sm">
                  {ticket.createdAt ? format(new Date(ticket.createdAt), 'PPpp') : t.none}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.updatedAt}
                </Label>
                <p className="mt-1 text-sm">
                  {ticket.updatedAt ? format(new Date(ticket.updatedAt), 'PPpp') : t.none}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  {t.timeSpent} (minutes)
                </Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editForm.timeSpent}
                    onChange={(e) => setEditForm(prev => ({ ...prev, timeSpent: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm">{ticket.timeSpent || 0}</p>
                )}
              </div>

              {(ticket.dueDate || isEditing) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.dueDate}
                  </Label>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm">
                      {ticket.dueDate ? format(new Date(ticket.dueDate), 'PPpp') : t.none}
                    </p>
                  )}
                </div>
              )}

              {(ticket.slaTarget || isEditing) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    {t.slaTarget}
                  </Label>
                  {isEditing ? (
                    <Input
                      type="datetime-local"
                      value={editForm.slaTarget}
                      onChange={(e) => setEditForm(prev => ({ ...prev, slaTarget: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-sm">
                      {ticket.slaTarget ? format(new Date(ticket.slaTarget), 'PPpp') : t.none}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Asset */}
          {relatedAsset && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  {t.relatedAsset}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="font-medium">{relatedAsset.assetId}</p>
                  <p className="text-gray-600">
                    {relatedAsset.type} - {relatedAsset.brand}
                  </p>
                  {relatedAsset.modelName && (
                    <p className="text-gray-500">{relatedAsset.modelName}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
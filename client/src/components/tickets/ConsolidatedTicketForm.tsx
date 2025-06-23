import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Clock, 
  User, 
  MessageSquare, 
  History, 
  Paperclip, 
  Send, 
  Save,
  X,
  Edit
} from 'lucide-react';

interface Ticket {
  id: number;
  ticketId: string;
  summary?: string;
  description: string;
  requestType: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  submittedById: number;
  assignedToId?: number;
  relatedAssetId?: number;
  rootCause?: string;
  workaround?: string;
  resolution?: string;
  resolutionNotes?: string;
  slaTarget?: string;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  timeSpent?: number;
  dueDate?: string;
}

interface ConsolidatedTicketFormProps {
  ticket: Ticket | null;
  onClose: () => void;
  employees: any[];
  assets: any[];
  users: any[];
  onTicketUpdate?: (updatedTicket: Ticket) => void;
}

export default function ConsolidatedTicketForm({ 
  ticket, 
  onClose, 
  employees, 
  assets, 
  users, 
  onTicketUpdate 
}: ConsolidatedTicketFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    summary: '',
    description: '',
    priority: 'Medium',
    urgency: 'Medium',
    impact: 'Medium',
    status: 'Open',
    assignedToId: '',
    requestType: '',
    category: 'Incident',
    slaTarget: '',
    dueDate: '',
    workaround: '',
    rootCause: '',
    resolution: '',
    resolutionNotes: '',
    escalationLevel: '0',
    privateNotes: '',
    customerRating: '',
    customerFeedback: '',
    timeSpent: ''
  });

  // Initialize form data when ticket changes
  useEffect(() => {
    if (ticket) {
      setFormData({
        summary: ticket.summary || '',
        description: ticket.description || '',
        priority: ticket.priority || 'Medium',
        urgency: ticket.urgency || 'Medium',
        impact: ticket.impact || 'Medium',
        status: ticket.status || 'Open',
        assignedToId: ticket.assignedToId?.toString() || '',
        requestType: ticket.requestType || '',
        category: ticket.category || 'Incident',
        slaTarget: ticket.slaTarget?.toString() || '',
        dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 16) : '',
        workaround: ticket.workaround || '',
        rootCause: ticket.rootCause || '',
        resolution: ticket.resolution || '',
        resolutionNotes: ticket.resolutionNotes || '',
        escalationLevel: ticket.escalationLevel?.toString() || '0',
        privateNotes: ticket.privateNotes || '',
        customerRating: ticket.customerRating?.toString() || '',
        customerFeedback: ticket.customerFeedback || '',
        timeSpent: ticket.timeSpent?.toString() || ''
      });
    }
  }, [ticket]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest('PATCH', `/api/tickets/${ticket?.id}`, updates);
    },
    onSuccess: (updatedTicket) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      if (onTicketUpdate) {
        onTicketUpdate(updatedTicket);
      }
      setIsEditMode(false);
      toast({
        title: 'Ticket updated',
        description: 'Ticket has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return await apiRequest(`/api/tickets/comments`, 'POST', commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}/comments`] });
      setCommentText('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch ticket history and comments
  const { data: ticketHistory = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/history`],
    enabled: !!ticket?.id
  });

  const { data: ticketComments = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/comments`],
    enabled: !!ticket?.id
  });

  const { data: requestTypes = [] } = useQuery({
    queryKey: ['/api/custom-request-types'],
    enabled: isEditMode
  });

  const handleSave = () => {
    if (!ticket) return;

    const updates: any = {};
    
    // Compare each field and add to updates if changed
    if (formData.summary !== ticket.summary) updates.summary = formData.summary;
    if (formData.description !== ticket.description) updates.description = formData.description;
    if (formData.priority !== ticket.priority) updates.priority = formData.priority;
    if (formData.urgency !== ticket.urgency) updates.urgency = formData.urgency;
    if (formData.impact !== ticket.impact) updates.impact = formData.impact;
    if (formData.status !== ticket.status) updates.status = formData.status;
    if (formData.assignedToId !== ticket.assignedToId?.toString()) {
      updates.assignedToId = formData.assignedToId ? parseInt(formData.assignedToId) : null;
    }
    if (formData.requestType !== ticket.requestType) updates.requestType = formData.requestType;
    if (formData.category !== ticket.category) updates.category = formData.category;
    if (formData.slaTarget !== ticket.slaTarget?.toString()) {
      updates.slaTarget = formData.slaTarget ? parseInt(formData.slaTarget) : null;
    }
    if (formData.dueDate !== (ticket.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 16) : '')) {
      updates.dueDate = formData.dueDate ? formData.dueDate : null;
    }
    if (formData.workaround !== ticket.workaround) updates.workaround = formData.workaround;
    if (formData.rootCause !== ticket.rootCause) updates.rootCause = formData.rootCause;
    if (formData.resolution !== ticket.resolution) updates.resolution = formData.resolution;
    if (formData.resolutionNotes !== ticket.resolutionNotes) updates.resolutionNotes = formData.resolutionNotes;
    if (formData.escalationLevel !== ticket.escalationLevel?.toString()) {
      updates.escalationLevel = formData.escalationLevel ? parseInt(formData.escalationLevel) : 0;
    }
    if (formData.privateNotes !== ticket.privateNotes) updates.privateNotes = formData.privateNotes;
    if (formData.customerRating !== ticket.customerRating?.toString()) {
      updates.customerRating = formData.customerRating ? parseInt(formData.customerRating) : null;
    }
    if (formData.customerFeedback !== ticket.customerFeedback) updates.customerFeedback = formData.customerFeedback;
    if (formData.timeSpent !== ticket.timeSpent?.toString()) {
      updates.timeSpent = formData.timeSpent ? parseInt(formData.timeSpent) : 0;
    }

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !ticket) return;

    commentMutation.mutate({
      ticketId: ticket.id,
      content: commentText,
      isPrivate: false
    });
  };

  const getAssignedUserName = (userId?: number) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown';
  };

  const getAssetName = (assetId?: number) => {
    if (!assetId) return 'None';
    const asset = assets.find(a => a.id === assetId);
    return asset ? `${asset.name} (${asset.assetId})` : 'Unknown';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!ticket) return null;

  return (
    <Dialog open={!!ticket} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ticket {ticket.ticketId} - {ticket.summary || 'No Summary'}</span>
            <div className="flex items-center gap-2">
              <Badge variant={
                ticket.priority === 'High' ? 'destructive' : 
                ticket.priority === 'Medium' ? 'default' : 
                'secondary'
              }>
                {ticket.priority}
              </Badge>
              <Badge variant="outline">{ticket.status}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage ticket details with consolidated editing interface
          </DialogDescription>
        </DialogHeader>

        {/* Action Bar */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsEditMode(!isEditMode)} 
              variant={isEditMode ? "outline" : "default"}
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              {isEditMode ? 'View Mode' : 'Edit Mode'}
            </Button>
            {isEditMode && (
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                size="sm"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-1" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="h-4 w-4 mr-1" />
              Attachments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Summary</Label>
                    {isEditMode ? (
                      <Input
                        value={formData.summary}
                        onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                        placeholder="Brief summary of the issue"
                      />
                    ) : (
                      <p className="text-sm">{ticket.summary || 'No summary'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Request Type</Label>
                    {isEditMode ? (
                      <Select value={formData.requestType} onValueChange={(value) => setFormData(prev => ({ ...prev, requestType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                        <SelectContent>
                          {requestTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{ticket.requestType}</p>
                    )}
                  </div>
                  <div>
                    <Label>Category</Label>
                    {isEditMode ? (
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Incident">Incident</SelectItem>
                          <SelectItem value="Service Request">Service Request</SelectItem>
                          <SelectItem value="Problem">Problem</SelectItem>
                          <SelectItem value="Change">Change</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{ticket.category || 'Incident'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Detailed description of the issue"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Priority & Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Priority & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Priority</Label>
                    {isEditMode ? (
                      <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{ticket.priority}</p>
                    )}
                  </div>
                  <div>
                    <Label>Urgency</Label>
                    {isEditMode ? (
                      <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{ticket.urgency || 'Medium'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Impact</Label>
                    {isEditMode ? (
                      <Select value={formData.impact} onValueChange={(value) => setFormData(prev => ({ ...prev, impact: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{ticket.impact || 'Medium'}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Status</Label>
                    {isEditMode ? (
                      <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{ticket.status}</p>
                    )}
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    {isEditMode ? (
                      <Select value={formData.assignedToId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{getAssignedUserName(ticket.assignedToId)}</p>
                    )}
                  </div>
                  <div>
                    <Label>Escalation Level</Label>
                    {isEditMode ? (
                      <Select value={formData.escalationLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, escalationLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 - Initial</SelectItem>
                          <SelectItem value="1">1 - Level 1</SelectItem>
                          <SelectItem value="2">2 - Level 2</SelectItem>
                          <SelectItem value="3">3 - Level 3</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">Level {ticket.escalationLevel || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SLA & Scheduling */}
            <Card>
              <CardHeader>
                <CardTitle>SLA & Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SLA Target (hours)</Label>
                    {isEditMode ? (
                      <Input
                        type="number"
                        value={formData.slaTarget}
                        onChange={(e) => setFormData(prev => ({ ...prev, slaTarget: e.target.value }))}
                        placeholder="Enter SLA hours"
                        min="0"
                      />
                    ) : (
                      <p className="text-sm">{ticket.slaTarget ? `${ticket.slaTarget} hours` : 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    {isEditMode ? (
                      <Input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    ) : (
                      <p className="text-sm">
                        {ticket.dueDate ? new Date(ticket.dueDate).toLocaleString() : 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem Management */}
            <Card>
              <CardHeader>
                <CardTitle>Problem Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Root Cause</Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.rootCause}
                      onChange={(e) => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
                      rows={3}
                      placeholder="Describe the root cause of the issue"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{ticket.rootCause || 'Not identified'}</p>
                  )}
                </div>
                <div>
                  <Label>Workaround</Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.workaround}
                      onChange={(e) => setFormData(prev => ({ ...prev, workaround: e.target.value }))}
                      rows={3}
                      placeholder="Describe any temporary workaround"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{ticket.workaround || 'None available'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resolution */}
            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Resolution</Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.resolution}
                      onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                      rows={3}
                      placeholder="Describe the resolution"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{ticket.resolution || 'Not resolved'}</p>
                  )}
                </div>
                <div>
                  <Label>Resolution Notes</Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.resolutionNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                      rows={2}
                      placeholder="Additional resolution notes"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{ticket.resolutionNotes || 'No additional notes'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Rating</Label>
                    {isEditMode ? (
                      <Select value={formData.customerRating} onValueChange={(value) => setFormData(prev => ({ ...prev, customerRating: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Poor</SelectItem>
                          <SelectItem value="2">2 - Fair</SelectItem>
                          <SelectItem value="3">3 - Good</SelectItem>
                          <SelectItem value="4">4 - Very Good</SelectItem>
                          <SelectItem value="5">5 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">
                        {ticket.customerRating ? `${ticket.customerRating}/5` : 'Not rated'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Private Notes</Label>
                    {isEditMode ? (
                      <Textarea
                        value={formData.privateNotes}
                        onChange={(e) => setFormData(prev => ({ ...prev, privateNotes: e.target.value }))}
                        rows={2}
                        placeholder="Internal staff notes"
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{ticket.privateNotes || 'No private notes'}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Customer Feedback</Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.customerFeedback}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerFeedback: e.target.value }))}
                      rows={3}
                      placeholder="Customer feedback and comments"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{ticket.customerFeedback || 'No feedback provided'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking (Manual Entry) */}
            {isEditMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Manual Time Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Time Spent (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.timeSpent}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeSpent: e.target.value }))}
                        placeholder="Enter minutes spent"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Current: </span>
                        <span>{formatTime(ticket.timeSpent || 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <Label>Submitted By</Label>
                <p>{getAssignedUserName(ticket.submittedById)}</p>
              </div>
              <div>
                <Label>Related Asset</Label>
                <p>{getAssetName(ticket.relatedAssetId)}</p>
              </div>
              <div>
                <Label>Created</Label>
                <p>{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <Label>Last Updated</Label>
                <p>{new Date(ticket.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comment..."
                  rows={3}
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Add Comment
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {ticketComments.length > 0 ? (
                ticketComments.map((comment: any) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>{getAssignedUserName(comment.userId)}</span>
                        <span>{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500">No comments yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              {ticketHistory.length > 0 ? (
                ticketHistory.map((entry: any) => (
                  <Card key={entry.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>{getAssignedUserName(entry.userId)} - {entry.action}</span>
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm">{entry.notes}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500">No history available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">File Attachments</h4>
              <p className="text-sm text-gray-500">Attachment functionality coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
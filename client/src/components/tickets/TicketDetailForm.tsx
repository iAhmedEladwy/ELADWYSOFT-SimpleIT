import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  Play,
  Pause,
  X
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
  isTimeTracking?: boolean;
  timeSpent?: number;
  timeTrackingStartedAt?: string;
}

interface TicketDetailFormProps {
  ticket: Ticket | null;
  onClose: () => void;
  employees: any[];
  assets: any[];
  users: any[];
}

export default function TicketDetailForm({ 
  ticket, 
  onClose, 
  employees, 
  assets, 
  users 
}: TicketDetailFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [editForm, setEditForm] = useState({
    summary: ticket?.summary || '',
    description: ticket?.description || '',
    category: ticket?.category || 'Incident',
    priority: ticket?.priority || 'Medium' as 'Low' | 'Medium' | 'High',
    urgency: ticket?.urgency || 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    impact: ticket?.impact || 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    status: ticket?.status || 'New' as 'New' | 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed',
    assignedToId: ticket?.assignedToId?.toString() || '',
    requestType: ticket?.requestType || 'Hardware',
    rootCause: ticket?.rootCause || '',
    workaround: ticket?.workaround || ''
  });

  // Fetch ticket history
  const { data: ticketHistory = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/history`],
    enabled: !!ticket?.id
  });

  // Fetch ticket comments
  const { data: ticketComments = [] } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/comments`],
    enabled: !!ticket?.id
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest('PUT', `/api/tickets/${ticket?.id}/enhanced`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}/history`] });
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

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return await apiRequest('POST', '/api/tickets/comments', commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket?.id}/history`] });
      setCommentText('');
      setIsPrivateComment(false);
      toast({
        title: 'Comment added',
        description: 'Comment has been added successfully',
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

  // Time tracking mutation
  const timeTrackingMutation = useMutation({
    mutationFn: async (action: 'start' | 'stop') => {
      return await apiRequest('POST', `/api/tickets/${ticket?.id}/${action}-tracking`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: ticket?.isTimeTracking ? 'Time tracking stopped' : 'Time tracking started',
        description: ticket?.isTimeTracking ? 'Time tracking has been stopped' : 'Time tracking has been started',
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

  const handleSaveChanges = () => {
    const updates: any = {};
    
    if (editForm.summary !== ticket?.summary) {
      updates.summary = editForm.summary;
    }
    if (editForm.description !== ticket?.description) {
      updates.description = editForm.description;
    }
    if (editForm.priority !== ticket?.priority) {
      updates.priority = editForm.priority;
    }
    if (editForm.status !== ticket?.status) {
      updates.status = editForm.status;
    }
    if (editForm.assignedToId !== ticket?.assignedToId?.toString()) {
      updates.assignedToId = editForm.assignedToId ? parseInt(editForm.assignedToId) : null;
    }
    if (editForm.requestType !== ticket?.requestType) {
      updates.requestType = editForm.requestType;
    }

    if (Object.keys(updates).length > 0) {
      updateTicketMutation.mutate(updates);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    
    addCommentMutation.mutate({
      ticketId: ticket?.id,
      content: commentText,
      isPrivate: isPrivateComment,
      authorId: 1 // Current user ID
    });
  };

  const formatTime = (minutes: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEmployeeName = (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    return employee?.name || 'Unknown';
  };

  const getAssetName = (id: number) => {
    const asset = assets.find(asset => asset.id === id);
    return asset?.name || 'Unknown';
  };

  if (!ticket) return null;

  return (
    <Dialog open={!!ticket} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ticket {ticket.ticketId}</span>
            <div className="flex items-center gap-2">
              <Badge variant={ticket.status === 'Open' ? 'default' : ticket.status === 'In Progress' ? 'secondary' : 'outline'}>
                {ticket.status}
              </Badge>
              <Badge variant={ticket.priority === 'High' ? 'destructive' : ticket.priority === 'Medium' ? 'default' : 'secondary'}>
                {ticket.priority}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

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

          <TabsContent value="details" className="space-y-4">
            {/* ITIL Classification Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ITIL Classification</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incident">Incident</SelectItem>
                      <SelectItem value="Service Request">Service Request</SelectItem>
                      <SelectItem value="Problem">Problem</SelectItem>
                      <SelectItem value="Change">Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Urgency</Label>
                  <Select value={editForm.urgency} onValueChange={(value) => setEditForm(prev => ({ ...prev, urgency: value as any }))}>
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
                </div>
                <div>
                  <Label>Impact</Label>
                  <Select value={editForm.impact} onValueChange={(value) => setEditForm(prev => ({ ...prev, impact: value as any }))}>
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
                </div>
              </CardContent>
            </Card>

            {/* Basic Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Summary</Label>
                  <Input
                    value={editForm.summary}
                    onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief one-line summary of the issue"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Request Type</Label>
                    <Select value={editForm.requestType} onValueChange={(value) => setEditForm(prev => ({ ...prev, requestType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority (Auto-calculated)</Label>
                    <Badge variant={editForm.priority === 'High' ? 'destructive' : editForm.priority === 'Medium' ? 'default' : 'secondary'}>
                      {editForm.priority}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}>
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
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    <Select value={editForm.assignedToId} onValueChange={(value) => setEditForm(prev => ({ ...prev, assignedToId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ITIL Solutions Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ITIL Solutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Workaround (Temporary Solution)</Label>
                  <Textarea
                    value={editForm.workaround}
                    onChange={(e) => setEditForm(prev => ({ ...prev, workaround: e.target.value }))}
                    rows={2}
                    placeholder="Temporary solution to restore service quickly"
                  />
                </div>
                <div>
                  <Label>Root Cause Analysis</Label>
                  <Textarea
                    value={editForm.rootCause}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rootCause: e.target.value }))}
                    rows={2}
                    placeholder="Underlying cause of the incident (for Problem Management)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Time Tracking Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant={ticket.isTimeTracking ? "destructive" : "default"}
                    size="sm"
                    onClick={() => timeTrackingMutation.mutate(ticket.isTimeTracking ? 'stop' : 'start')}
                    disabled={timeTrackingMutation.isPending}
                  >
                    {ticket.isTimeTracking ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {ticket.isTimeTracking ? 'Stop Tracking' : 'Start Tracking'}
                  </Button>
                  <div className="text-sm">
                    <span className="font-medium">Time Spent: </span>
                    <span className={ticket.isTimeTracking ? "text-green-600 font-medium" : ""}>
                      {formatTime(ticket.timeSpent || 0)}
                      {ticket.isTimeTracking && " (Active)"}
                    </span>
                  </div>
                  {ticket.slaTarget && (
                    <div className="text-sm">
                      <span className="font-medium">SLA Target: </span>
                      <span>{new Date(ticket.slaTarget).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Detailed description of the issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <Label>Submitted By</Label>
                <p>{getEmployeeName(ticket.submittedById)}</p>
              </div>
              <div>
                <Label>Related Asset</Label>
                <p>{ticket.relatedAssetId ? getAssetName(ticket.relatedAssetId) : 'None'}</p>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveChanges}
                disabled={updateTicketMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comment..."
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="private"
                      checked={isPrivateComment}
                      onCheckedChange={setIsPrivateComment}
                    />
                    <Label htmlFor="private" className="text-sm">Private comment</Label>
                  </div>
                  <Button 
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {ticketComments.map((comment: any) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{getEmployeeName(comment.authorId)}</span>
                        {comment.isPrivate && (
                          <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {ticketHistory.map((history: any) => (
              <Card key={history.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{getEmployeeName(history.changedBy)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(history.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{history.changeType}</p>
                  <p className="text-sm text-gray-600">{history.changeDescription}</p>
                  {history.oldValue && history.newValue && (
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="line-through">{history.oldValue}</span> → <span>{history.newValue}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Attachment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Paperclip className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop files here or click to browse</p>
                  <input type="file" className="hidden" multiple />
                  <Button variant="outline" className="mt-2">
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h4 className="font-medium">Existing Attachments</h4>
              <p className="text-sm text-gray-500">No attachments found</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
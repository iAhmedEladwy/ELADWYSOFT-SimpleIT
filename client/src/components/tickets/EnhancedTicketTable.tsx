import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import TicketDetailForm from './TicketDetailForm';
import { 
  Play, 
  Pause, 
  History, 
  Edit, 
  Trash2, 
  Save, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Timer,
  Filter,
  RotateCcw,
  MessageSquare,
  Paperclip,
  Send,
  RefreshCw
} from 'lucide-react';

interface Ticket {
  id: number;
  ticketId: string;
  description: string;
  requestType: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  submittedById: number;
  assignedToId?: number;
  relatedAssetId?: number;
  createdAt: string;
  updatedAt: string;
  isTimeTracking?: boolean;
  timeSpent?: number;
  timeTrackingStartedAt?: string;
  resolution?: string;
  resolutionNotes?: string;
}

interface TicketHistory {
  id: number;
  ticketId: number;
  changedBy: number;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  changeDescription: string;
  createdAt: string;
}

interface EnhancedTicketTableProps {
  tickets: Ticket[];
  employees: any[];
  assets: any[];
  users: any[];
  isLoading: boolean;
}

export default function EnhancedTicketTable({ 
  tickets, 
  employees, 
  assets, 
  users, 
  isLoading 
}: EnhancedTicketTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [editForm, setEditForm] = useState({
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    status: 'Open' as 'Open' | 'In Progress' | 'Resolved' | 'Closed',
    assignedToId: '',
    resolution: '',
    resolutionNotes: ''
  });

  // Check access level
  const hasAccess = (level: string) => {
    if (!user) return false;
    const userLevel = parseInt(user.accessLevel);
    return level === 'admin' ? userLevel === 3 : userLevel >= 2;
  };

  // Get system language
  const language = 'English'; // Default to English

  // Fetch ticket history
  const { data: ticketHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: [`/api/tickets/${selectedTicket?.id}/history`],
    enabled: !!selectedTicket,
  });

  // Time tracking mutations
  const startTimeTrackingMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest('POST', `/api/tickets/${ticketId}/start-tracking`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: language === 'English' ? 'Time tracking started' : 'بدء تتبع الوقت',
        description: language === 'English' ? 'Time tracking has been started for this ticket' : 'تم بدء تتبع الوقت لهذه التذكرة',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const stopTimeTrackingMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest('POST', `/api/tickets/${ticketId}/stop-tracking`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: language === 'English' ? 'Time tracking stopped' : 'توقف تتبع الوقت',
        description: language === 'English' ? 'Time tracking has been stopped for this ticket' : 'تم إيقاف تتبع الوقت لهذه التذكرة',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      return await apiRequest('PATCH', `/api/tickets/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setEditingTicket(null);
      toast({
        title: language === 'English' ? 'Ticket updated' : 'تم تحديث التذكرة',
        description: language === 'English' ? 'Ticket has been updated successfully' : 'تم تحديث التذكرة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest('DELETE', `/api/tickets/${ticketId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: language === 'English' ? 'Ticket deleted' : 'تم حذف التذكرة',
        description: language === 'English' ? 'Ticket has been deleted successfully' : 'تم حذف التذكرة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
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
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${selectedTicket?.id}/history`] });
      setCommentText('');
      setIsPrivateComment(false);
      setShowAddComment(false);
      // Force close the dialog
      setTimeout(() => {
        const dialogTrigger = document.querySelector('[data-state="open"]');
        if (dialogTrigger) {
          dialogTrigger.setAttribute('data-state', 'closed');
        }
      }, 100);
      toast({
        title: language === 'English' ? 'Comment added' : 'تم إضافة التعليق',
        description: language === 'English' ? 'Comment has been added successfully' : 'تم إضافة التعليق بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mark as done mutation
  const markAsDoneMutation = useMutation({
    mutationFn: async ({ ticketId, resolutionType, comment }: { ticketId: number, resolutionType: string, comment: string }) => {
      const status = resolutionType === 'Resolved' ? 'Resolved' : 'Closed';
      return await apiRequest('PUT', `/api/tickets/${ticketId}/enhanced`, {
        status,
        resolution: resolutionType,
        resolutionNotes: comment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      setResolvingTicket(null);
      setResolutionType('');
      setResolutionComment('');
      toast({
        title: language === 'English' ? 'Ticket resolved' : 'تم حل التذكرة',
        description: language === 'English' ? 'Ticket has been marked as done successfully' : 'تم وضع علامة على التذكرة كمكتملة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reopen ticket mutation
  const reopenTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest('PUT', `/api/tickets/${ticketId}/enhanced`, {
        status: 'Open'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: language === 'English' ? 'Ticket reopened' : 'تم إعادة فتح التذكرة',
        description: language === 'English' ? 'Ticket has been reopened successfully' : 'تم إعادة فتح التذكرة بنجاح',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'default';
      case 'Low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Resolved':
        return 'outline';
      case 'Closed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTime = (minutes: number) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditForm({
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignedToId: ticket.assignedToId?.toString() || '',
      resolution: ticket.resolution || '',
      resolutionNotes: ticket.resolutionNotes || ''
    });
  };

  const handleUpdateTicket = () => {
    if (!editingTicket) return;

    const updates: any = {};
    
    if (editForm.description !== editingTicket.description) {
      updates.description = editForm.description;
    }
    if (editForm.priority !== editingTicket.priority) {
      updates.priority = editForm.priority;
    }
    if (editForm.status !== editingTicket.status) {
      updates.status = editForm.status;
    }
    if (editForm.assignedToId !== (editingTicket.assignedToId?.toString() || '')) {
      updates.assignedToId = editForm.assignedToId ? parseInt(editForm.assignedToId) : null;
    }
    if (editForm.resolution !== (editingTicket.resolution || '')) {
      updates.resolution = editForm.resolution;
    }
    if (editForm.resolutionNotes !== (editingTicket.resolutionNotes || '')) {
      updates.resolutionNotes = editForm.resolutionNotes;
    }
    
    updateTicketMutation.mutate({ id: editingTicket.id, updates });
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'active') {
      matchesStatus = ticket.status === 'Open' || ticket.status === 'In Progress';
    } else if (statusFilter === 'completed') {
      matchesStatus = ticket.status === 'Resolved' || ticket.status === 'Closed';
    } else {
      matchesStatus = ticket.status === statusFilter;
    }
    
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddComment = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowAddComment(true);
  };

  const handleSubmitComment = () => {
    if (!selectedTicket || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      ticketId: selectedTicket.id,
      content: commentText,
      isPrivate: isPrivateComment,
      authorId: user?.id
    });
  };

  return (
    <div className="space-y-4">
      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === 'English' ? 'Filter & Search Tickets' : 'تصفية والبحث في التذاكر'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>{language === 'English' ? 'Search' : 'البحث'}</Label>
              <Input
                placeholder={language === 'English' ? 'Search tickets...' : 'البحث في التذاكر...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label>{language === 'English' ? 'Status' : 'الحالة'}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'English' ? 'All Statuses' : 'جميع الحالات'}</SelectItem>
                  <SelectItem value="active">{language === 'English' ? 'Active (Open/In Progress)' : 'النشطة (مفتوحة/قيد التنفيذ)'}</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="completed">{language === 'English' ? 'Completed (Resolved/Closed)' : 'المكتملة (محلولة/مغلقة)'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'English' ? 'Priority' : 'الأولوية'}</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'English' ? 'All Priorities' : 'جميع الأولويات'}</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {language === 'English' ? 'Clear Filters' : 'مسح المرشحات'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{language === 'English' ? 'Ticket ID' : 'رقم التذكرة'}</TableHead>
            <TableHead>{language === 'English' ? 'Summary' : 'الملخص'}</TableHead>
            <TableHead>{language === 'English' ? 'Submitted By' : 'مُقدم من'}</TableHead>
            <TableHead>{language === 'English' ? 'Type' : 'النوع'}</TableHead>
            <TableHead>{language === 'English' ? 'Priority' : 'الأولوية'}</TableHead>
            <TableHead>{language === 'English' ? 'Status' : 'الحالة'}</TableHead>
            <TableHead>{language === 'English' ? 'Assigned To' : 'مُكلف إلى'}</TableHead>
            <TableHead>{language === 'English' ? 'Time Spent' : 'الوقت المستغرق'}</TableHead>
            <TableHead>{language === 'English' ? 'Created' : 'تاريخ الإنشاء'}</TableHead>
            <TableHead className="text-right">{language === 'English' ? 'Actions' : 'الإجراءات'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTickets.map((ticket) => {
            const assignedUser = users.find(u => u.id === ticket.assignedToId);
            const submittedByEmployee = employees.find(e => e.id === ticket.submittedById);
            
            return (
              <TableRow 
                key={ticket.id} 
                className="hover:bg-gray-50"
              >
                <TableCell className="font-medium">{ticket.ticketId}</TableCell>
                <TableCell 
                  className="max-w-xs truncate font-medium cursor-pointer text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setSelectedTicketForDetail(ticket);
                    setShowTicketDetail(true);
                  }}
                >
                  {ticket.summary || ticket.description.substring(0, 50) + '...'}
                </TableCell>
                <TableCell>{submittedByEmployee?.name || 'Unknown'}</TableCell>
                <TableCell>
                  <Select
                    value={ticket.requestType}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { requestType: value } 
                      });
                    }}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs border-none bg-transparent hover:bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { priority: value } 
                      });
                    }}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs border-none bg-transparent hover:bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">
                        <Badge variant="secondary" className="text-xs">Low</Badge>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <Badge variant="default" className="text-xs">Medium</Badge>
                      </SelectItem>
                      <SelectItem value="High">
                        <Badge variant="destructive" className="text-xs">High</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { status: value } 
                      });
                    }}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs border-none bg-transparent hover:bg-gray-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 text-blue-500" />
                          <span>Open</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="In Progress">
                        <div className="flex items-center space-x-1">
                          <Timer className="h-3 w-3 text-yellow-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Resolved">
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>Resolved</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Closed">
                        <div className="flex items-center space-x-1">
                          <XCircle className="h-3 w-3 text-gray-500" />
                          <span>Closed</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.assignedToId?.toString() || "0"}
                    onValueChange={(value) => {
                      const assignedToId = value === "0" ? null : parseInt(value);
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { assignedToId } 
                      });
                    }}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs border-none bg-transparent hover:bg-gray-50">
                      <SelectValue placeholder={language === 'English' ? 'Unassigned' : 'غير مُكلف'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">
                        <span className="text-gray-500 text-xs">
                          {language === 'English' ? 'Unassigned' : 'غير مُكلف'}
                        </span>
                      </SelectItem>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          <span className="text-xs">{user.username}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {ticket.timeSpent ? formatTime(ticket.timeSpent) : '0h 0m'}
                    </span>
                    {ticket.isTimeTracking && (
                      <div className="flex items-center space-x-1">
                        <Timer className="h-3 w-3 text-green-500 animate-pulse" />
                        <span className="text-xs text-green-600 font-medium">
                          {language === 'English' ? 'Active' : 'نشط'}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {/* Time Tracking Controls */}
                    {ticket.isTimeTracking ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopTimeTrackingMutation.mutate(ticket.id)}
                        disabled={stopTimeTrackingMutation.isPending}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startTimeTrackingMutation.mutate(ticket.id)}
                        disabled={startTimeTrackingMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}

                    {/* History Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowHistory(true);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {language === 'English' ? 'Ticket History' : 'تاريخ التذكرة'} - {ticket.ticketId}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {historyLoading ? (
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full" />
                              ))}
                            </div>
                          ) : ticketHistory.length > 0 ? (
                            <div className="space-y-4">
                              {ticketHistory.map((history: TicketHistory) => (
                                <div key={history.id} className="border-l-2 border-blue-200 pl-4">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{history.changeType}</span>
                                    <span className="text-sm text-gray-500">
                                      {new Date(history.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{history.changeDescription}</p>
                                  {history.oldValue && history.newValue && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {language === 'English' ? 'Changed from' : 'تغير من'}: {history.oldValue} → {history.newValue}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-500">
                              {language === 'English' ? 'No history available' : 'لا يوجد تاريخ متاح'}
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTicket(ticket)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>
                            {language === 'English' ? 'Edit Ticket' : 'تعديل التذكرة'} - {ticket.ticketId}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{language === 'English' ? 'Description' : 'الوصف'}</Label>
                            <Textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder={language === 'English' ? 'Ticket description' : 'وصف التذكرة'}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>{language === 'English' ? 'Priority' : 'الأولوية'}</Label>
                              <Select
                                value={editForm.priority}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value as any }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Low">Low</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>{language === 'English' ? 'Status' : 'الحالة'}</Label>
                              <Select
                                value={editForm.status}
                                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as any }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Open">Open</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Resolved">Resolved</SelectItem>
                                  <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>{language === 'English' ? 'Assign To' : 'إسناد إلى'}</Label>
                            <Select
                              value={editForm.assignedToId}
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, assignedToId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={language === 'English' ? 'Select user' : 'اختر المستخدم'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">{language === 'English' ? 'Unassigned' : 'غير مُكلف'}</SelectItem>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {editForm.status === 'Resolved' && (
                            <>
                              <div>
                                <Label>{language === 'English' ? 'Resolution' : 'الحل'}</Label>
                                <Input
                                  value={editForm.resolution}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, resolution: e.target.value }))}
                                  placeholder={language === 'English' ? 'Brief resolution summary' : 'ملخص الحل'}
                                />
                              </div>
                              <div>
                                <Label>{language === 'English' ? 'Resolution Notes' : 'ملاحظات الحل'}</Label>
                                <Textarea
                                  value={editForm.resolutionNotes}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                                  placeholder={language === 'English' ? 'Detailed resolution notes' : 'ملاحظات مفصلة للحل'}
                                />
                              </div>
                            </>
                          )}
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingTicket(null)}
                            >
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button
                              onClick={() => {
                                handleUpdateTicket();
                                // Close dialog after successful save
                                setTimeout(() => setEditingTicket(null), 500);
                              }}
                              disabled={updateTicketMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {language === 'English' ? 'Save Changes' : 'حفظ التغييرات'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Comment Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddComment(ticket)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>
                            {language === 'English' ? 'Add Comment' : 'إضافة تعليق'} - {ticket.ticketId}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>{language === 'English' ? 'Comment' : 'التعليق'}</Label>
                            <Textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder={language === 'English' ? 'Enter your comment...' : 'أدخل تعليقك...'}
                              rows={4}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="private-comment"
                              checked={isPrivateComment}
                              onCheckedChange={setIsPrivateComment}
                            />
                            <Label htmlFor="private-comment">
                              {language === 'English' ? 'Private Comment (Admin Only)' : 'تعليق خاص (للمشرفين فقط)'}
                            </Label>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddComment(false)}
                            >
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </Button>
                            <Button
                              onClick={handleSubmitComment}
                              disabled={addCommentMutation.isPending || !commentText.trim()}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {language === 'English' ? 'Add Comment' : 'إضافة تعليق'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* File Attachment Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // File attachment functionality placeholder
                        toast({
                          title: language === 'English' ? 'File Attachment' : 'إرفاق ملف',
                          description: language === 'English' ? 'File attachment feature will be implemented' : 'سيتم تنفيذ ميزة إرفاق الملفات',
                        });
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    {/* Mark as Done Button */}
                    {ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setResolvingTicket(ticket);
                              setResolutionType('');
                              setResolutionComment('');
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>
                              {language === 'English' ? 'Mark as Done' : 'وضع علامة كمكتمل'} - {ticket.ticketId}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>{language === 'English' ? 'Resolution Type' : 'نوع الحل'}</Label>
                              <Select value={resolutionType} onValueChange={setResolutionType}>
                                <SelectTrigger>
                                  <SelectValue placeholder={language === 'English' ? 'Select resolution type' : 'اختر نوع الحل'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Resolved">{language === 'English' ? 'Resolved' : 'محلول'}</SelectItem>
                                  <SelectItem value="Closed">{language === 'English' ? 'Closed' : 'مغلق'}</SelectItem>
                                  <SelectItem value="Duplicate">{language === 'English' ? 'Duplicate' : 'مكرر'}</SelectItem>
                                  <SelectItem value="Declined">{language === 'English' ? 'Declined' : 'مرفوض'}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>{language === 'English' ? 'Resolution Comment' : 'تعليق الحل'}</Label>
                              <Textarea
                                value={resolutionComment}
                                onChange={(e) => setResolutionComment(e.target.value)}
                                placeholder={language === 'English' ? 'Add resolution details...' : 'أضف تفاصيل الحل...'}
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                onClick={() => setResolvingTicket(null)}
                              >
                                {language === 'English' ? 'Cancel' : 'إلغاء'}
                              </Button>
                              <Button
                                onClick={() => {
                                  if (resolutionType && resolutionComment.trim()) {
                                    markAsDoneMutation.mutate({
                                      ticketId: ticket.id,
                                      resolutionType,
                                      comment: resolutionComment
                                    });
                                  } else {
                                    toast({
                                      title: language === 'English' ? 'Required Fields' : 'حقول مطلوبة',
                                      description: language === 'English' ? 'Please select a resolution type and add a comment' : 'يرجى اختيار نوع الحل وإضافة تعليق',
                                      variant: 'destructive'
                                    });
                                  }
                                }}
                                disabled={markAsDoneMutation.isPending || !resolutionType || !resolutionComment.trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {language === 'English' ? 'Mark as Done' : 'وضع علامة كمكتمل'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Reopen Button - Only for completed tickets */}
                    {(ticket.status === 'Closed' || ticket.status === 'Resolved') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reopenTicketMutation.mutate(ticket.id)}
                        disabled={reopenTicketMutation.isPending}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Admin Delete Button */}
                    {hasAccess('admin') && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {language === 'English' ? 'Delete Ticket' : 'حذف التذكرة'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'English' 
                                ? 'Are you sure you want to permanently delete this ticket? This action cannot be undone.'
                                : 'هل أنت متأكد من حذف هذه التذكرة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {language === 'English' ? 'Cancel' : 'إلغاء'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTicketMutation.mutate(ticket.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {language === 'English' ? 'Delete' : 'حذف'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Ticket Detail Form Dialog */}
      {showTicketDetail && selectedTicketForDetail && (
        <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Ticket Details - {selectedTicketForDetail.ticketId}
              </DialogTitle>
            </DialogHeader>
            <TicketDetailForm
              ticket={selectedTicketForDetail}
              onClose={() => {
                setShowTicketDetail(false);
                setSelectedTicketForDetail(null);
              }}
              employees={employees}
              assets={assets}
              users={users}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
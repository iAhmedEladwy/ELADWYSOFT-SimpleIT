import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/authContext';
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
// Removed TicketForm import - using parent component's form
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
  MessageSquare,
  Paperclip,
  Send,
  RefreshCw,
  Eye
} from 'lucide-react';

interface Ticket {
  id: number;
  ticketId: string;
  summary?: string;
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
  employees?: any[];
  assets?: any[];
  users?: any[];
  isLoading: boolean;
  onTicketSelect?: (ticket: Ticket) => void;
}

export default function EnhancedTicketTable({ 
  tickets, 
  employees = [], 
  assets = [], 
  users = [], 
  isLoading,
  onTicketSelect
}: EnhancedTicketTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Removed internal selectedTicket state - using parent component's state
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [isPrivateComment, setIsPrivateComment] = useState(false);
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
  
  // Inline editing states (excluding summary and ID)
  const [editingField, setEditingField] = useState<{ticketId: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Inline editing functions
  const startEditing = (ticketId: number, field: string, currentValue: string) => {
    // All fields now use the edit form dialog instead of inline editing for consistency
    // Keeping this for fields that still use inline editing (Type, Priority, Status, Assigned To)
    if (field === 'summary' || field === 'ticketId' || field === 'submittedBy') {
      // These fields open the edit form dialog
      const ticket = tickets.find(t => t.id === ticketId);
      // Using parent component's ticket selection
      return;
    }
    setEditingField({ ticketId, field });
    setEditValue(currentValue || '');
  };
  
  const saveInlineEdit = async () => {
    if (!editingField || !editValue.trim()) {
      cancelInlineEdit();
      return;
    }
    
    try {
      await updateTicketMutation.mutateAsync({
        id: editingField.ticketId,
        updates: { [editingField.field]: editValue.trim() }
      });
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update ticket:', error);
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to update ticket' : 'فشل في تحديث التذكرة',
        variant: 'destructive',
      });
    }
  };
  
  const cancelInlineEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Check access level
  const hasAccess = (level: string) => {
    if (!user) return false;
    const userLevel = {
      'admin': 4,
      'manager': 3,
      'agent': 2,
      'employee': 1
    }[user.role] || 0;
    return level === 'admin' ? userLevel === 3 : userLevel >= 2;
  };

  // Get system language
  const language = 'English'; // Default to English

  // Ticket history moved to parent component

  // Manual time update mutation (replaces automatic start/stop)
  const updateTimeSpentMutation = useMutation({
    mutationFn: async ({ ticketId, timeSpent }: { ticketId: number; timeSpent: number }) => {
      return await apiRequest(`/api/tickets/${ticketId}/enhanced`, 'PUT', { 
        timeSpent: timeSpent 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: language === 'English' ? 'Time updated' : 'تم تحديث الوقت',
        description: language === 'English' ? 'Time spent has been updated' : 'تم تحديث الوقت المستغرق',
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
      return await apiRequest(`/api/tickets/${data.id}`, 'PATCH', data.updates);
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
      return await apiRequest(`/api/tickets/${ticketId}`, 'DELETE');
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
      return await apiRequest('/api/tickets/comments', 'POST', commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
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
      return await apiRequest(`/api/tickets/${ticketId}/enhanced`, 'PUT', {
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
      return await apiRequest(`/api/tickets/${ticketId}/enhanced`, 'PUT', {
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
        return 'outline'; // Changed to yellow color
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

  // Use all tickets since filters have been removed
  const filteredTickets = tickets;

  const handleAddComment = (ticket: Ticket) => {
    // Use parent component's ticket selection instead
    if (onTicketSelect) {
      onTicketSelect(ticket);
    }
    setShowAddComment(true);
  };

  const handleSubmitComment = () => {
    // Comment submission moved to parent component
  };

  return (
    <div className="space-y-4">
      

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
            const assignedUser = users?.find?.(u => u.id === ticket.assignedToId);
            const submittedByEmployee = employees?.find?.(e => e.id === ticket.submittedById);
            
            return (
              <TableRow 
                key={ticket.id} 
                className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative"
              >
                <TableCell className="font-medium">
                  <span 
                    className="cursor-pointer hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      // Navigate to ticket details page
                      window.location.href = `/tickets/${ticket.id}`;
                    }}
                  >
                    {ticket.ticketId}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div>
                    <span 
                      className="font-medium cursor-pointer hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                      onClick={() => {
                        // Navigate to ticket details page
                        window.location.href = `/tickets/${ticket.id}`;
                      }}
                    >
                      {ticket.summary || ticket.description.substring(0, 50) + '...'}
                    </span>
                    {ticket.relatedAssetId && (
                      <div className="text-xs text-gray-500 mt-1">
                        Asset: 
                        <span 
                          className="cursor-pointer hover:text-blue-600 hover:underline ml-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/assets?edit=${ticket.relatedAssetId}`, '_blank');
                          }}
                        >
                          {(() => {
                            const asset = assets?.find?.(a => a.id === ticket.relatedAssetId);
                            return asset ? `${asset.assetId} - ${asset.name || asset.title || 'Unnamed'}` : `ID: ${ticket.relatedAssetId}`;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span 
                    className="cursor-pointer hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                    onClick={() => {
                      // Navigate to ticket details page
                      window.location.href = `/tickets/${ticket.id}`;
                    }}
                  >
                    {submittedByEmployee?.englishName || submittedByEmployee?.name || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell>
                  {editingField?.ticketId === ticket.id && editingField?.field === 'requestType' ? (
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        setEditValue(value);
                        updateTicketMutation.mutate({ 
                          id: ticket.id, 
                          updates: { requestType: value } 
                        });
                        setEditingField(null);
                        setEditValue('');
                      }}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hardware">Hardware</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Network">Network</SelectItem>
                        <SelectItem value="Access Control">Access Control</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      onClick={() => startEditing(ticket.id, 'requestType', ticket.requestType || 'Hardware')}
                    >
                      {ticket.requestType || "Hardware"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingField?.ticketId === ticket.id && editingField?.field === 'priority' ? (
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        setEditValue(value);
                        updateTicketMutation.mutate({ 
                          id: ticket.id, 
                          updates: { priority: value } 
                        });
                        setEditingField(null);
                        setEditValue('');
                      }}
                    >
                      <SelectTrigger className="w-20 h-8 text-xs border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer hover:opacity-80 transition-opacity ${
                        ticket.priority === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                        ticket.priority === 'Low' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                      onClick={() => startEditing(ticket.id, 'priority', ticket.priority || 'Medium')}
                    >
                      {ticket.priority || "Medium"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.status || "Open"}
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
                          <span className="text-xs">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.username}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="text-sm">
                      {formatTime(ticket.timeSpent || 0)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const timeSpent = prompt(
                          language === 'English' 
                            ? `Enter time spent in minutes for ticket ${ticket.ticketId}:` 
                            : `أدخل الوقت المستغرق بالدقائق للتذكرة ${ticket.ticketId}:`,
                          ticket.timeSpent?.toString() || '0'
                        );
                        if (timeSpent !== null && !isNaN(Number(timeSpent))) {
                          updateTimeSpentMutation.mutate({ 
                            ticketId: ticket.id, 
                            timeSpent: Number(timeSpent) 
                          });
                        }
                      }}
                      disabled={updateTimeSpentMutation.isPending}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                      title={language === 'English' ? 'Update time spent' : 'تحديث الوقت المستغرق'}
                    >
                      <Clock className="h-4 w-4 text-blue-600" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    {/* Detail Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Navigate to ticket details page
                        window.location.href = `/tickets/${ticket.id}`;
                      }}
                      className="h-8 w-8 p-0 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                      title={language === 'English' ? 'View Details' : 'عرض التفاصيل'}
                    >
                      <Eye className="h-4 w-4" />
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


    </div>
  );
}
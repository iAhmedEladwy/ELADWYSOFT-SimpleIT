import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  Timer 
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
    queryKey: ['/api/tickets', selectedTicket?.id, 'history'],
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

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{language === 'English' ? 'Ticket ID' : 'رقم التذكرة'}</TableHead>
            <TableHead>{language === 'English' ? 'Description' : 'الوصف'}</TableHead>
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
          {tickets.map((ticket) => {
            const assignedUser = users.find(u => u.id === ticket.assignedToId);
            
            return (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium">{ticket.ticketId}</TableCell>
                <TableCell className="max-w-xs truncate">{ticket.description}</TableCell>
                <TableCell>{ticket.requestType}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <Badge variant={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {assignedUser ? assignedUser.username : 
                   language === 'English' ? 'Unassigned' : 'غير مُكلف'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{ticket.timeSpent ? formatTime(ticket.timeSpent) : '0h 0m'}</span>
                    {ticket.isTimeTracking && (
                      <Badge variant="outline" className="text-green-600">
                        {language === 'English' ? 'Tracking' : 'تتبع'}
                      </Badge>
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
                              onClick={handleUpdateTicket}
                              disabled={updateTicketMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {language === 'English' ? 'Save Changes' : 'حفظ التغييرات'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

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
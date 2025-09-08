import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input'; 

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { MoreHorizontal, UserCircle2, Calendar, Clock } from 'lucide-react';

interface TicketsTableProps {
  tickets: any[];
  employees: any[];
  assets: any[];
  users: any[];
  onStatusChange: (id: number, status: string, resolutionNotes?: string) => void;
  onAssign: (id: number, userId: number) => void;
  onEdit?: (ticket: any) => void;
  selectedTickets?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
}

export default function TicketsTable({
  tickets,
  employees,
  assets,
  users,
  onStatusChange,
  onAssign,
  onEdit,
  selectedTickets = [],
  onSelectionChange,
}: TicketsTableProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [resolutionDialog, setResolutionDialog] = useState<{
    open: boolean;
    ticketId: number | null;
    newStatus: string;
  }>({ open: false, ticketId: null, newStatus: '' });

  const [resolution, setResolution] = useState('');
  
    // Handle checkbox selection
    const handleTicketSelection = (ticketId: number, checked: boolean) => {
      if (!onSelectionChange) return;
      
      if (checked) {
        onSelectionChange([...selectedTickets, ticketId]);
      } else {
        onSelectionChange(selectedTickets.filter(id => id !== ticketId));
      }
    };

    // Handle resolution dialog submit
  const handleResolutionSubmit = () => {
    if (resolutionDialog.ticketId && resolutionNotes.trim()) {
      updateTicketMutation.mutate({ 
        id: resolutionDialog.ticketId, 
        updates: { 
          status: resolutionDialog.newStatus,
          resolution: resolutionNotes
        } 
      });
      setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
      setResolutionNotes('');
    }
  };

  // Handle status update from dialog
  const handleStatusUpdate = () => {
    if (selectedTicket && selectedStatus) {
      onStatusChange(selectedTicket.id, selectedStatus);
      setOpenStatusDialog(false);
      setSelectedStatus('');
      setSelectedTicket(null);
    }
  };
  // Fetch request types from system configuration with loading state
  const { data: customRequestTypes = [], isLoading: isLoadingRequestTypes } = useQuery({
    queryKey: ['/api/custom-request-types'],
    queryFn: async () => {
      const response = await apiRequest('/api/custom-request-types');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to improve performance
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (renamed from cacheTime in v5)
  });

  // Use only request types from system configuration
  const requestTypes = customRequestTypes.filter((type: any) => type.isActive !== false);

  // Update ticket mutation
    const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      // Fix: apiRequest expects separate parameters, not an object
      return apiRequest(
        `/api/tickets/${id}`,  // url
        'PATCH',                // method
        updates                 // data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      // No toast on success - too noisy for inline edits
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error updating ticket' : 'خطأ في تحديث التذكرة',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  // Translations
  const translations = {
    ticketId: language === 'English' ? 'Ticket ID' : 'رقم التذكرة',
    dateCreated: language === 'English' ? 'Date Created' : 'تاريخ الإنشاء',
    summary: language === 'English' ? 'Summary' : 'الملخص',
    requestType: language === 'English' ? 'Request Type' : 'نوع الطلب',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    submittedBy: language === 'English' ? 'Submitted By' : 'مقدم من',
    relatedAsset: language === 'English' ? 'Related Asset' : 'الأصل المرتبط',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    description: language === 'English' ? 'Description' : 'الوصف',
    updateStatus: language === 'English' ? 'Update Status' : 'تحديث الحالة',
    assignTicket: language === 'English' ? 'Assign Ticket' : 'تعيين التذكرة',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    update: language === 'English' ? 'Update' : 'تحديث',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    assign: language === 'English' ? 'Assign' : 'تعيين',
    selectUser: language === 'English' ? 'Select User' : 'اختر المستخدم',
    selectStatus: language === 'English' ? 'Select Status' : 'اختر الحالة',
    noTickets: language === 'English' ? 'No tickets found' : 'لم يتم العثور على تذاكر',
    open: language === 'English' ? 'Open' : 'مفتوح',
    save: language === 'English' ? 'Save' : 'حفظ',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    resolved: language === 'English' ? 'Resolved' : 'تم الحل',
    closed: language === 'English' ? 'Closed' : 'مغلق',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'مرتفع',
    hardware: language === 'English' ? 'Hardware' : 'أجهزة',
    software: language === 'English' ? 'Software' : 'برمجيات',
    network: language === 'English' ? 'Network' : 'شبكة',
    other: language === 'English' ? 'Other' : 'أخرى',
    none: language === 'English' ? 'None' : 'لا يوجد',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
    dueDate: language === 'English' ? 'Due Date' : 'تاريخ الاستحقاق',
    resolveTicket: language === 'English' ? 'Resolve Ticket' : 'حل التذكرة',
    closeTicket: language === 'English' ? 'Close Ticket' : 'إغلاق التذكرة',
    resolutionType: language === 'English' ? 'Resolution Type' : 'نوع الحل',
    resolutionDetails: language === 'English' ? 'Please provide resolution details' : 'يرجى تقديم تفاصيل الحل',
    selectResolutionType: language === 'English' ? 'Select resolution type' : 'اختر نوع الحل',
    describeResolution: language === 'English' ? 'Describe how the issue was resolved...' : 'اصف كيف تم حل المشكلة...',
    problemSolved: language === 'English' ? 'Problem Solved' : 'تم حل المشكلة',
    workaroundProvided: language === 'English' ? 'Workaround Provided' : 'تم تقديم حل بديل',
    duplicateTicket: language === 'English' ? 'Duplicate Ticket' : 'تذكرة مكررة',
    noIssueFound: language === 'English' ? 'No Issue Found' : 'لم يتم العثور على مشكلة',
    wontFix: language === 'English' ? "Won't Fix" : 'لن يتم الإصلاح',
    setDate: language === 'English' ? 'Set date' : 'تعيين التاريخ',
  };

  const handleUpdateStatus = () => {
    if (selectedTicket && selectedStatus) {
      onStatusChange(selectedTicket.id, selectedStatus, resolutionNotes);
      setOpenStatusDialog(false);
      setResolutionNotes('');
      setSelectedStatus('');
    }
  };

  const handleAssignTicket = () => {
    if (selectedTicket && selectedUserId !== '') {
      onAssign(selectedTicket.id, selectedUserId as number);
      setOpenAssignDialog(false);
      setSelectedUserId('');
    }
  };

    const getTicketById = (ticketId: number) => {
    return tickets.find((t: any) => t.id === ticketId);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Resolved':
        return 'outline';
      case 'Closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEmployeeName = (id: number) => {
    try {
      if (!Array.isArray(employees)) return translations.none;
      const employee = employees.find(emp => emp && emp.id === id);
      return employee && employee.englishName ? employee.englishName : translations.none;
    } catch (error) {
      console.error('Error getting employee name:', error);
      return translations.none;
    }
  };

  const getAssetName = (id: number) => {
    try {
      if (!Array.isArray(assets)) return translations.none;
      const asset = assets.find(a => a && a.id === id);
      return asset && asset.name ? asset.name : translations.none;
    } catch (error) {
      console.error('Error getting asset name:', error);
      return translations.none;
    }
  };

  const getUserName = (id: number) => {
    try {
      if (!Array.isArray(users)) return translations.unassigned;
      const assignedUser = users.find(u => u && u.id === id);
      return assignedUser && assignedUser.username ? assignedUser.username : translations.unassigned;
    } catch (error) {
      console.error('Error getting user name:', error);
      return translations.unassigned;
    }
  };

  const canUpdateStatus = (ticketStatus: string) => {
    // Only allow status changes in a forward direction
    if (user && ['admin', 'manager'].includes(user.role)) return true; // Admins and managers can change to any status
    
    // Non-admin users can only move tickets forward in workflow
    switch (ticketStatus) {
      case 'Open':
        return ['In Progress'].includes(selectedStatus);
      case 'In Progress':
        return ['Resolved'].includes(selectedStatus);
      case 'Resolved':
        return ['Closed'].includes(selectedStatus);
      default:
        return false;
    }
  };

  const getAvailableStatuses = (currentStatus: string): string[] => {
    // Ensure we always return an array to prevent .join errors
    try {
      // Full access for admins and managers
      if (user && Array.isArray(user.role ? [user.role] : []) && ['admin', 'manager', 'agent'].includes(user.role)) {
        return ['Open', 'In Progress', 'Resolved', 'Closed'];
      }
      
      // Regular users can only move tickets forward
      switch (currentStatus) {
        case 'Open':
          return ['In Progress'];
        case 'In Progress':
          return ['Resolved'];
        case 'Resolved':
          return ['Closed'];
        default:
          return ['Open', 'In Progress', 'Resolved', 'Closed']; // Fallback to all statuses
      }
    } catch (error) {
      console.error('Error getting available statuses:', error);
      return ['Open', 'In Progress', 'Resolved', 'Closed']; // Safe fallback
    }
  };

  // Ensure tickets is always an array to prevent runtime errors
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  
  if (safeTickets.length === 0) {
    return <div className="text-center py-8 text-gray-500">{translations.noTickets}</div>;
  }

  return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={selectedTickets.length === tickets.length && tickets.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectionChange(tickets.map(t => t.id));
                      } else {
                        onSelectionChange([]);
                      }
                    }}
                  />
                </TableHead>
              )}
              <TableHead className="min-w-[100px]">{translations.ticketId}</TableHead>
              <TableHead className="min-w-[110px]">{translations.dateCreated}</TableHead>
              <TableHead className="min-w-[200px]">{translations.summary}</TableHead>
              <TableHead className="min-w-[120px]">{translations.requestType}</TableHead>
              <TableHead className="min-w-[100px]">{translations.priority}</TableHead>
              <TableHead className="min-w-[120px]">{translations.status}</TableHead>
              <TableHead className="min-w-[150px]">{translations.submittedBy}</TableHead>
              <TableHead className="min-w-[150px]">{translations.assignedTo}</TableHead>
              <TableHead className="min-w-[120px]">{translations.dueDate}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeTickets.map((ticket: any) => (
              <TableRow 
                key={ticket.id}
                className="cursor-pointer group border-l-4 !border-l-transparent hover:!border-l-blue-500 transition-colors [&:last-child]:!border-l-transparent [&:last-child]:hover:!border-l-blue-500"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('.inline-edit-cell') ||
                    target.closest('button') ||
                    target.closest('[role="button"]') ||
                    target.closest('input') ||
                    target.closest('[role="combobox"]') ||
                    target.tagName === 'SELECT' ||
                    target.closest('[type="checkbox"]')
                  ) {
                    return;
                  }
                  
                  if (onEdit && ticket) {
                    onEdit(ticket);
                  }
                }}
              >
                {/* Checkbox column */}
                {onSelectionChange && (
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTickets.includes(ticket.id)}
                      onCheckedChange={(checked) => handleTicketSelection(ticket.id, checked as boolean)}
                    />
                  </TableCell>
                )}
                
                {/* Ticket ID */}
                <TableCell className="font-medium min-w-[100px]">
                  {ticket.ticketId}
                </TableCell>
                
                {/* Date Created */}
                <TableCell className="min-w-[110px]">
                  {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </TableCell>
                
                {/* Summary */}
                <TableCell className="min-w-[200px] max-w-xs truncate" title={ticket.summary}>
                  {ticket.summary || ticket.description?.substring(0, 50) + '...' || 'No summary'}
                </TableCell>
                
                {/* Request Type */}
                <TableCell className="inline-edit-cell relative min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.requestType || 'Hardware'}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { requestType: value } 
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      {isLoadingRequestTypes ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : requestTypes && Array.isArray(requestTypes) && requestTypes.length > 0 ? (
                        requestTypes.map((type: any) => (
                          <SelectItem key={type.id || type.name} value={type.name || 'Hardware'}>
                            {type.name || 'Hardware'}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Hardware">Hardware</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Network">Network</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Priority */}
                <TableCell className="inline-edit-cell relative min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.priority || 'Medium'}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { priority: value } 
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0 p-0">
                      <Badge 
                        variant={getPriorityBadgeVariant(ticket.priority)}
                        className="w-full justify-center cursor-pointer"
                      >
                        {ticket.priority || 'Medium'}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      <SelectItem value="Low">{translations.low}</SelectItem>
                      <SelectItem value="Medium">{translations.medium}</SelectItem>
                      <SelectItem value="High">{translations.high}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Status */}
                <TableCell className="inline-edit-cell relative min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.status || 'Open'}
                    onValueChange={(value) => {
                      if (value === 'Resolved' || value === 'Closed') {
                        setResolutionNotes(ticket.resolution || '');
                        setResolutionDialog({ 
                          open: true, 
                          ticketId: ticket.id, 
                          newStatus: value 
                        });
                      } else {
                        onStatusChange(ticket.id, value);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0 p-0">
                      <Badge 
                        className={`w-full justify-center cursor-pointer ${
                          ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ticket.status === 'Open' ? translations.open :
                        ticket.status === 'In Progress' ? translations.inProgress :
                        ticket.status === 'Resolved' ? translations.resolved :
                        ticket.status === 'Closed' ? translations.closed :
                        ticket.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      {getAvailableStatuses(ticket.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'Open' ? translations.open :
                          status === 'In Progress' ? translations.inProgress :
                          status === 'Resolved' ? translations.resolved :
                          translations.closed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Submitted By */}
                <TableCell className="min-w-[150px]">
                  {ticket.submittedById ? getEmployeeName(ticket.submittedById) : translations.none}
                </TableCell>
                
                {/* Assigned To */}
                <TableCell className="inline-edit-cell relative min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.assignedToId?.toString() || 'unassigned'}
                    onValueChange={(value) => {
                      if (value === 'unassigned') {
                        updateTicketMutation.mutate({ 
                          id: ticket.id, 
                          updates: { assignedToId: null } 
                        });
                      } else {
                        const userId = parseInt(value);
                        onAssign(ticket.id, userId);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                      <SelectValue>
                        {ticket.assignedToId ? 
                          getUserName(ticket.assignedToId) : 
                          <span className="text-gray-400">{translations.unassigned}</span>
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      <SelectItem value="unassigned">
                        <span className="text-gray-400">{translations.unassigned}</span>
                      </SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Due Date */}
                <TableCell className="inline-edit-cell relative min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={ticket.dueDate ? format(new Date(ticket.dueDate), 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        updateTicketMutation.mutate({ 
                          id: ticket.id, 
                          updates: { dueDate: e.target.value || null } 
                        });
                      }}
                      className="border-0 bg-transparent hover:bg-gray-50 focus:ring-0 p-1 h-auto cursor-pointer"
                      style={{ colorScheme: 'light' }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      <Dialog open={resolutionDialog.open} onOpenChange={(open) => {
          if (!open) {
            setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
            setResolutionNotes('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {resolutionNotes ? 'Update Resolution' : 'Add Resolution Details'}
              </DialogTitle>
              <DialogDescription>
               {resolutionDialog.ticketId && (
                  <>
                    <p className="font-medium">
                      Ticket: {getTicketById(resolutionDialog.ticketId)?.title || getTicketById(resolutionDialog.ticketId)?.ticketId}
                    </p>
                    <br />
                  </>
                )}
                {resolutionNotes 
                  ? `Review or update the resolution before marking this ticket as ${resolutionDialog.newStatus}.`
                  : `Please provide resolution details before marking this ticket as ${resolutionDialog.newStatus}.`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resolution">
                  Resolution {!resolutionNotes && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="resolution"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter how this ticket was resolved..."
                  className="min-h-[100px]"
                  autoFocus
                />
                {resolutionNotes && (
                  <p className="text-sm text-muted-foreground">
                    Tip: You can update the resolution or leave it as is.
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
                  setResolutionNotes('');
                }}
              >
                {translations.cancel}
              </Button>
              <Button 
                onClick={() => handleResolutionSubmit()}
                disabled={!resolutionNotes.trim()} // Require resolution text
              >
                {resolutionNotes ? 'Update & Save' : translations.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}
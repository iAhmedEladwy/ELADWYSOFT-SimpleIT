import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const [editingField, setEditingField] = useState<{ticketId: number; field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
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


  // Start editing function
  const startEditing = (ticketId: number, field: string, currentValue: string) => {
    setEditingField({ ticketId, field });
    setEditValue(currentValue);
  };

  // Handle inline edit
  const handleInlineEdit = (ticketId: number, field: string, value: string) => {
  // Handle different fields appropriately
  switch(field) {
    case 'status':
      onStatusChange(ticketId, value);
      break;
    case 'assignedTo':
      const userId = value === 'unassigned' ? null : parseInt(value);
      if (userId) {
        onAssign(ticketId, userId);
      }
      break;
    case 'dueDate':
      // You'll need to add a prop for this or handle it
      // For now, you can make an API call directly
      updateTicketMutation.mutate({ 
        id: ticketId, 
        updates: { dueDate: value } 
      });
      break;
    case 'timeSpent':
      // Same as above
      updateTicketMutation.mutate({ 
        id: ticketId, 
        updates: { timeSpent: parseFloat(value) || 0 } 
      });
      break;
    default:
      break;
  }
  
  // Clear editing state
  setEditingField(null);
  setEditValue('');
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
      const response = await apiRequest(`/api/tickets/${id}`, 'PATCH', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: language === 'English' ? 'Success' : 'نجح',
        description: language === 'English' ? 'Ticket updated successfully' : 'تم تحديث التذكرة بنجاح',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: error.message,
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
    resolutionNotes: language === 'English' ? 'Resolution Notes' : 'ملاحظات الحل',
    update: language === 'English' ? 'Update' : 'تحديث',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    assign: language === 'English' ? 'Assign' : 'تعيين',
    selectUser: language === 'English' ? 'Select User' : 'اختر المستخدم',
    selectStatus: language === 'English' ? 'Select Status' : 'اختر الحالة',
    noTickets: language === 'English' ? 'No tickets found' : 'لم يتم العثور على تذاكر',
    open: language === 'English' ? 'Open' : 'مفتوح',
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
    timeSpent: language === 'English' ? 'Time Spent' : 'الوقت المستغرق',
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
              <TableHead className="w-12">
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
            <TableHead>{translations.ticketId}</TableHead>
            <TableHead>{translations.dateCreated}</TableHead>
            <TableHead>{translations.summary}</TableHead>
            <TableHead>{translations.requestType}</TableHead>
            <TableHead>{translations.priority}</TableHead>
            <TableHead>{translations.status}</TableHead>
            <TableHead>{translations.submittedBy}</TableHead>
            <TableHead>{translations.assignedTo}</TableHead>
            <TableHead>{translations.dueDate}</TableHead>
          <TableHead>{translations.timeSpent}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeTickets.map((ticket: any) => (
            <TableRow 
              key={ticket.id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={(e) => {
                // Prevent row click when clicking on action buttons, dropdowns, or inline edit elements
                 if (e.target instanceof HTMLElement && 
                    (e.target.closest('button') || 
                    e.target.closest('[role="button"]') ||
                    e.target.closest('.inline-edit-element') ||
                    e.target.closest('input[type="checkbox"]'))) {
                  return;
                }
                try {
                  // Use same edit form as action button
                  if (onEdit && ticket && ticket.id) {
                    onEdit(ticket);
                  } else {
                    console.error('Invalid ticket data or missing onEdit callback:', ticket);
                  }
                } catch (error) {
                  console.error('Row click error:', error);
                  toast({
                    title: language === 'English' ? 'Error' : 'خطأ',
                    description: language === 'English' ? 'Unable to open ticket for editing' : 'تعذر فتح التذكرة للتعديل',
                    variant: 'destructive',
                  });
                }
              }}
            >
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {onSelectionChange && (
                <TableCell>
                  <Checkbox
                    checked={selectedTickets.includes(ticket.id)}
                    onCheckedChange={(checked) => handleTicketSelection(ticket.id, checked as boolean)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{ticket.ticketId}</TableCell>
              <TableCell>
                {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={ticket.summary}>
                {ticket.summary || ticket.description?.substring(0, 50) + '...' || 'No summary'}
              </TableCell>
              <TableCell>
                {editingField?.ticketId === ticket.id && editingField?.field === 'requestType' ? (
                  <div className="inline-edit-element" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        handleInlineEdit(ticket.id, 'requestType', value);
                      }}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer relative inline-edit-element"
                    title="Click to change"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(ticket.id, 'requestType', ticket.requestType || 'Hardware');
                    }}
                  >
                    {ticket.requestType || "Hardware"}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {editingField?.ticketId === ticket.id && editingField?.field === 'priority' ? (
                  <div className="inline-edit-element" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        handleInlineEdit(ticket.id, 'priority', value);
                      }}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs border-blue-500 focus:ring-2 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Badge 
                    variant={getPriorityBadgeVariant(ticket.priority)}
                    className="cursor-pointer hover:opacity-80 transition-opacity inline-edit-element"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(ticket.id, 'priority', ticket.priority || 'Medium');
                    }}
                  >
                    {ticket.priority}
                  </Badge>
                )}
              </TableCell>
              {/* Status with inline editing */}
              <TableCell>
                {editingField?.ticketId === ticket.id && editingField?.field === 'status' ? (
                  <div className="inline-edit-element" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        if (value === 'Resolved' || value === 'Closed') {
                          // Open resolution dialog for these statuses
                          setResolutionDialog({ 
                            open: true, 
                            ticketId: ticket.id, 
                            newStatus: value 
                          });
                          setEditingField(null);
                          setEditValue('');
                        } else {
                          // Direct update for other statuses
                          handleInlineEdit(ticket.id, 'status', value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  </div>
                ) : (
                  <Badge 
                    className={`cursor-pointer hover:opacity-80 transition-opacity inline-edit-element ${
                      ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(ticket.id, 'status', ticket.status || 'Open');
                    }}
                  >
                    {ticket.status || translations.open}
                  </Badge>
                )}
              </TableCell>
              <TableCell>{ticket.submittedById ? getEmployeeName(ticket.submittedById) : translations.none}</TableCell>
              {/* Assigned To with inline editing */}
              <TableCell>
                {editingField?.ticketId === ticket.id && editingField?.field === 'assignedTo' ? (
                  <div className="inline-edit-element" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={editValue}
                      onValueChange={(value) => {
                        handleInlineEdit(ticket.id, 'assignedTo', value);
                      }}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  </div>
                ) : (
                  <span 
                      className="cursor-pointer relative inline-edit-element"
                      title="Click to change"  
                      onClick={(e) => {
                      e.stopPropagation();
                      startEditing(ticket.id, 'assignedTo', ticket.assignedToId?.toString() || 'unassigned');
                    }}
                  >
                    {ticket.assignedToId ? getUserName(ticket.assignedToId) : (
                      <span className="text-gray-400">{translations.unassigned}</span>
                    )}
                  </span>
                )}
              </TableCell>
              {/* Due Date column - with inline editing capability */}
              <TableCell>
                {editingField?.ticketId === ticket.id && editingField?.field === 'dueDate' ? (
                  <div className="inline-edit-element" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleInlineEdit(ticket.id, 'dueDate', editValue)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(ticket.id, 'dueDate', editValue);
                        }
                      }}
                      className="w-32 h-8"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                      className="cursor-pointer relative inline-edit-element"
                      title="Click to change"
                      onClick={(e) => {
                      e.stopPropagation();
                      startEditing(ticket.id, 'dueDate', ticket.dueDate ? format(new Date(ticket.dueDate), 'yyyy-MM-dd') : '');
                    }}
                  >
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="hover:underline">
                      {ticket.dueDate ? 
                        format(new Date(ticket.dueDate), 'MM/dd/yyyy') : 
                        <span className="text-gray-400">{translations.setDate}</span>
                      }
                    </span>
                  </div>
                )}
              </TableCell>

              {/* Time Spent column */}
              <TableCell>
                {editingField?.ticketId === ticket.id && editingField?.field === 'timeSpent' ? (
                  <div className="inline-edit-element" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleInlineEdit(ticket.id, 'timeSpent', editValue)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleInlineEdit(ticket.id, 'timeSpent', editValue);
                        }
                      }}
                      className="w-20 h-8"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                      className="cursor-pointer relative inline-edit-element"
                      title="Click to change"
                      onClick={(e) => {
                      e.stopPropagation();
                      startEditing(ticket.id, 'timeSpent', ticket.timeSpent?.toString() || '0');
                    }}
                  >
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="hover:underline">
                      {ticket.timeSpent ? `${ticket.timeSpent}h` : '0h'}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{translations.actions}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        try {
                          // Prefetch ticket details data for faster loading
                          queryClient.prefetchQuery({
                            queryKey: ['/api/tickets', ticket.id.toString()],
                            queryFn: () => apiRequest(`/api/tickets/${ticket.id}`, 'GET'),
                            staleTime: 1000 * 60 * 5,
                          });
                          navigate(`/tickets/${ticket.id}`);
                        } catch (error) {
                          console.error('Navigation error:', error);
                          // Fallback navigation without prefetch
                          navigate(`/tickets/${ticket.id}`);
                        }
                      }}
                    >
{language === 'English' ? 'View Details' : 'عرض التفاصيل'}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) {
                          onEdit(ticket);
                        }
                      }}
                    >
{language === 'English' ? 'Edit Ticket' : 'تعديل التذكرة'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSelectedStatus('');
                        setOpenStatusDialog(true);
                      }}
                    >
                      {translations.updateStatus}
                    </DropdownMenuItem>
                    
                    {user && ['admin', 'manager', 'agent'].includes(user.role) && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setSelectedUserId('');
                          setOpenAssignDialog(true);
                        }}
                      >
                        {translations.assignTicket}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Update Status Dialog */}
      <Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.updateStatus}</DialogTitle>
            <DialogDescription>
              Update the status of the selected ticket
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">{translations.status}</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={translations.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  {selectedTicket && Array.isArray(getAvailableStatuses(selectedTicket.status)) && 
                   getAvailableStatuses(selectedTicket.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'Open' ? translations.open :
                       status === 'In Progress' ? translations.inProgress :
                       status === 'Resolved' ? translations.resolved :
                       translations.closed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedStatus === 'Resolved' && (
              <div className="grid gap-2">
                <Label htmlFor="notes">{translations.resolutionNotes}</Label>
                <Textarea
                  id="notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenStatusDialog(false)}>
              {translations.cancel}
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || (selectedTicket && !canUpdateStatus(selectedTicket.status))}
            >
              {translations.update}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Dialog */}
      <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.assignTicket}</DialogTitle>
            <DialogDescription>
              Assign this ticket to a user for processing
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">{translations.assignedTo}</Label>
              <Select
                value={selectedUserId.toString()}
                onValueChange={(val) => setSelectedUserId(parseInt(val))}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder={translations.selectUser} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center">
                        <UserCircle2 className="h-4 w-4 mr-2" />
                        {user.username} ({user.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenAssignDialog(false)}>
              {translations.cancel}
            </Button>
            <Button
              onClick={handleAssignTicket}
              disabled={selectedUserId === ''}
            >
              {translations.assign}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
 {/* ADD THE NEW RESOLUTION DIALOG HERE */}
      <Dialog 
        open={resolutionDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
            setResolutionNotes('');
            setResolution('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolutionDialog.newStatus === 'Resolved' ? 
                translations.resolveTicket : translations.closeTicket}
            </DialogTitle>
            <DialogDescription>
              {translations.resolutionDetails}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resolution">{translations.resolutionType}</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue placeholder={translations.selectResolutionType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solved">{translations.problemSolved}</SelectItem>
                  <SelectItem value="workaround">{translations.workaroundProvided}</SelectItem>
                  <SelectItem value="duplicate">{translations.duplicateTicket}</SelectItem>
                  <SelectItem value="no-issue">{translations.noIssueFound}</SelectItem>
                  <SelectItem value="wont-fix">{translations.wontFix}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="resolutionNotes">{translations.resolutionNotes}</Label>
              <Textarea
                id="resolutionNotes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={translations.describeResolution}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
                setResolutionNotes('');
                setResolution('');
              }}
            >
              {translations.cancel}
            </Button>
            <Button
              onClick={() => {
                if (resolutionDialog.ticketId && resolutionDialog.newStatus) {
                  onStatusChange(
                    resolutionDialog.ticketId, 
                    resolutionDialog.newStatus, 
                    resolutionNotes
                  );
                  setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
                  setResolutionNotes('');
                  setResolution('');
                }
              }}
              disabled={!resolution || !resolutionNotes}
            >
              {resolutionDialog.newStatus === 'Resolved' ? 
                translations.resolved : translations.closed}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
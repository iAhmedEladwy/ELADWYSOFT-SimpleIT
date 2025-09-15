import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils'; 

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
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { MoreHorizontal, UserCircle2, Calendar as CalendarIconLucide, Clock, CalendarIcon } from 'lucide-react';

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
  const t = useTicketTranslations(language);
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
  // Define ticket types
  const ticketTypes = ['Incident', 'Service Request', 'Problem', 'Change'];

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
      if (!Array.isArray(employees)) return t.none;
      const employee = employees.find(emp => emp && emp.id === id);
      return employee && employee.englishName ? employee.englishName : t.none;
    } catch (error) {
      console.error('Error getting employee name:', error);
      return t.none;
    }
  };

  const getAssetName = (id: number) => {
    try {
      if (!Array.isArray(assets)) return t.none;
      const asset = assets.find(a => a && a.id === id);
      return asset && asset.name ? asset.name : t.none;
    } catch (error) {
      console.error('Error getting asset name:', error);
      return t.none;
    }
  };

  const getUserName = (id: number) => {
    try {
      if (!Array.isArray(users)) return t.unassigned;
      const assignedUser = users.find(u => u && u.id === id);
      return assignedUser && assignedUser.username ? assignedUser.username : t.unassigned;
    } catch (error) {
      console.error('Error getting user name:', error);
      return t.unassigned;
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
    return <div className="text-center py-8 text-gray-500">{t.noTickets}</div>;
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
              <TableHead className="min-w-[100px]">{t.ticketId}</TableHead>
              <TableHead className="min-w-[110px]">{t.createdAt}</TableHead>
              <TableHead className="min-w-[200px]">{t.title_field}</TableHead>
              <TableHead className="min-w-[120px]">{t.type}</TableHead>
              <TableHead className="min-w-[100px]">{t.priority}</TableHead>
              <TableHead className="min-w-[120px]">{t.status}</TableHead>
              <TableHead className="min-w-[150px]">{t.submittedBy}</TableHead>
              <TableHead className="min-w-[150px]">{t.assignedTo}</TableHead>
              <TableHead className="min-w-[120px]">{t.dueDate}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeTickets.map((ticket: any) => (
              <TableRow 
                key={ticket.id}
                className="group hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 border-transparent hover:border-l-blue-500 cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    target.closest('.inline-edit-cell') ||
                    target.closest('[data-checkbox-cell]') ||
                    target.closest('[role="checkbox"]') ||
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
                  <TableCell 
                    data-checkbox-cell 
                    className="cursor-pointer hover:bg-gray-50 w-12 text-center" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTicketSelection(ticket.id, !selectedTickets.includes(ticket.id));
                    }}
                  >
                    <div className="flex items-center justify-center p-1">
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => handleTicketSelection(ticket.id, checked as boolean)}
                      />
                    </div>
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
                
                {/* Title */}
                <TableCell className="min-w-[200px] max-w-xs truncate" title={ticket.title}>
                  {ticket.title || ticket.description?.substring(0, 50) + '...' || 'No title'}
                </TableCell>
                
                {/* Type */}
                <TableCell className="inline-edit-cell relative min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.type || 'Incident'}
                    onValueChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { type: value } 
                      });
                    }}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      {ticketTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                        <>
                          <SelectItem value="Hardware">{t.categoryHardware}</SelectItem>
                          <SelectItem value="Software">{t.categorySoftware}</SelectItem>
                          <SelectItem value="Network">{t.categoryNetwork}</SelectItem>
                          <SelectItem value="Other">{t.categoryOther}</SelectItem>
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
                      <SelectItem value="Low">{t.priorityLow}</SelectItem>
                      <SelectItem value="Medium">{t.priorityMedium}</SelectItem>
                      <SelectItem value="High">{t.priorityHigh}</SelectItem>
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
                        {ticket.status === 'Open' ? t.statusOpen :
                        ticket.status === 'In Progress' ? t.statusInProgress :
                        ticket.status === 'Resolved' ? t.statusResolved :
                        ticket.status === 'Closed' ? t.statusClosed :
                        ticket.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      {getAvailableStatuses(ticket.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status === 'Open' ? t.statusOpen :
                          status === 'In Progress' ? t.statusInProgress :
                          status === 'Resolved' ? t.statusResolved :
                          t.statusClosed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Submitted By */}
                <TableCell className="min-w-[150px]">
                  {ticket.submittedById ? getEmployeeName(ticket.submittedById) : t.none}
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
                          <span className="text-gray-400">{t.unassigned}</span>
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      <SelectItem value="unassigned">
                        <span className="text-gray-400">{t.unassigned}</span>
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
                  <Calendar
                    mode="picker"
                    value={ticket.dueDate || ''}
                    onChange={(value) => {
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { dueDate: value || null } 
                      });
                    }}
                    placeholder={language === 'English' ? 'Pick due date' : 'اختر تاريخ الاستحقاق'}
                    className="w-full h-8 text-sm"
                  />
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
                {resolutionNotes ? t.updateResolution : t.addResolutionDetails}
              </DialogTitle>
              <DialogDescription>
               {resolutionDialog.ticketId && (
                  <>
                    <p className="font-medium">
                      {t.ticketLabel}: {getTicketById(resolutionDialog.ticketId)?.title || getTicketById(resolutionDialog.ticketId)?.ticketId}
                    </p>
                    <br />
                  </>
                )}
                {resolutionNotes 
                  ? t.reviewBeforeStatus.replace('{status}', resolutionDialog.newStatus)
                  : t.provideResolutionBeforeStatus.replace('{status}', resolutionDialog.newStatus)
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resolution">
                  {t.resolution} {!resolutionNotes && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="resolution"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={t.resolutionPlaceholder}
                  className="min-h-[100px]"
                  autoFocus
                />
                {resolutionNotes && (
                  <p className="text-sm text-muted-foreground">
                    {t.resolutionTip}
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
                {t.cancel}
              </Button>
              <Button 
                onClick={() => handleResolutionSubmit()}
                disabled={!resolutionNotes.trim()} // Require resolution text
              >
                {resolutionNotes ? 'Update & Save' : t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
}
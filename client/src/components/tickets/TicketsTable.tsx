import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
import { MoreHorizontal, Edit, Eye, UserX, CheckCircle, XCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';

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

  // Dialog states for resolution handling
  const [resolutionDialog, setResolutionDialog] = useState<{
    open: boolean;
    ticketId: number | null;
    newStatus: string;
  }>({ open: false, ticketId: null, newStatus: '' });
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Ticket types for inline editing
  const ticketTypes = ['Incident', 'Service Request', 'Problem', 'Change'];

  // Update ticket mutation for inline editing
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest(`/api/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      // No toast for inline edits - too noisy
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message || t.errorUpdating,
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const getEmployeeName = (employeeId: number) => {
    try {
      if (!Array.isArray(employees)) return t.none;
      const employee = employees.find((emp: any) => emp && emp.id === employeeId);
      return employee && employee.englishName ? employee.englishName : t.none;
    } catch (error) {
      console.error('Error getting employee name:', error);
      return t.none;
    }
  };

  const getUserName = (userId: number) => {
    try {
      if (!Array.isArray(users)) return t.unassigned;
      const assignedUser = users.find((u: any) => u && u.id === userId);
      return assignedUser && assignedUser.username ? assignedUser.username : t.unassigned;
    } catch (error) {
      console.error('Error getting user name:', error);
      return t.unassigned;
    }
  };

  const getAssetName = (assetId: number) => {
    try {
      if (!Array.isArray(assets)) return t.none;
      const asset = assets.find((a: any) => a && a.id === assetId);
      return asset && asset.name ? asset.name : t.none;
    } catch (error) {
      console.error('Error getting asset name:', error);
      return t.none;
    }
  };

  const getTicketById = (ticketId: number) => {
    return tickets.find((t: any) => t.id === ticketId);
  };

  const getPriorityColor = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'destructive';
      case 'in progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <AlertTriangle className="h-3 w-3" />;
      case 'in progress':
        return <Clock className="h-3 w-3" />;
      case 'resolved':
        return <CheckCircle className="h-3 w-3" />;
      case 'closed':
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get available statuses based on current status and user permissions
  const getAvailableStatuses = (currentStatus: string): string[] => {
    try {
      // Full access for admins, managers, and agents
      if (user && ['admin', 'manager', 'agent'].includes(user.role)) {
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
          return ['Open', 'In Progress', 'Resolved', 'Closed'];
      }
    } catch (error) {
      console.error('Error getting available statuses:', error);
      return ['Open', 'In Progress', 'Resolved', 'Closed'];
    }
  };

  const handleTicketSelection = (ticketId: number, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedTickets, ticketId]);
    } else {
      onSelectionChange(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const handleRowClick = (ticket: any, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (
      target.closest('.inline-edit-cell') ||
      target.closest('[data-checkbox-cell]') ||
      target.closest('[role="checkbox"]') ||
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('input') ||
      target.closest('[role="combobox"]') ||
      target.tagName === 'SELECT' ||
      target.closest('[type="checkbox"]') ||
      target.closest('[data-dropdown-trigger]')
    ) {
      return;
    }
    
    // Direct edit - open new TicketForm in edit mode
    if (onEdit && ticket) {
      onEdit(ticket);
    }
  };

  // Handle status change with resolution dialog for resolved/closed statuses
  const handleStatusChange = (ticketId: number, newStatus: string) => {
    if (newStatus === 'Resolved' || newStatus === 'Closed') {
      setResolutionDialog({ open: true, ticketId, newStatus });
    } else {
      updateTicketMutation.mutate({ 
        id: ticketId, 
        updates: { status: newStatus } 
      });
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

  const safeTickets = Array.isArray(tickets) ? tickets : [];
  
  if (safeTickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t.noTickets}
      </div>
    );
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
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeTickets.map((ticket: any) => (
            <TableRow 
              key={ticket.id}
              className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/20 dark:hover:to-indigo-950/20 transition-all duration-300 hover:shadow-sm cursor-pointer"
              onClick={(e) => handleRowClick(ticket, e)}
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
                <Badge variant="outline" className="text-xs">
                  {ticket.ticketId}
                </Badge>
              </TableCell>
              
              {/* Date Created */}
              <TableCell className="min-w-[110px] text-sm text-muted-foreground">
                {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy')}
              </TableCell>
              
              {/* Title */}
              <TableCell className="min-w-[200px] max-w-xs">
                <div className="space-y-1">
                  <div className="font-medium truncate" title={ticket.title}>
                    {ticket.title || ticket.description?.substring(0, 50) + '...' || t.none}
                  </div>
                  {ticket.description && ticket.title && (
                    <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={ticket.description}>
                      {ticket.description.length > 50 
                        ? `${ticket.description.substring(0, 50)}...` 
                        : ticket.description}
                    </div>
                  )}
                </div>
              </TableCell>
              
              {/* Type - Inline Edit */}
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
                    <SelectValue>
                      {ticket.type === 'Incident' ? t.typeIncident :
                       ticket.type === 'Service Request' ? t.typeServiceRequest :
                       ticket.type === 'Problem' ? t.typeProblem :
                       ticket.type === 'Change' ? t.typeChange :
                       ticket.type}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="relative z-50">
                    <SelectItem value="Incident">{t.typeIncident}</SelectItem>
                    <SelectItem value="Service Request">{t.typeServiceRequest}</SelectItem>
                    <SelectItem value="Problem">{t.typeProblem}</SelectItem>
                    <SelectItem value="Change">{t.typeChange}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              
              {/* Priority - Read-only (calculated from urgency x impact) */}
              <TableCell className="min-w-[100px]">
                <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                  {ticket.priority === 'Low' ? t.priorityLow :
                   ticket.priority === 'Medium' ? t.priorityMedium :
                   ticket.priority === 'High' ? t.priorityHigh :
                   ticket.priority === 'Critical' ? t.priorityCritical :
                   ticket.priority}
                </Badge>
              </TableCell>
              
              {/* Status - Inline Edit with Resolution Dialog */}
              <TableCell className="inline-edit-cell relative min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={ticket.status || 'Open'}
                  onValueChange={(value) => handleStatusChange(ticket.id, value)}
                >
                  <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                    <SelectValue>
                      <Badge variant={getStatusColor(ticket.status)} className="flex items-center gap-1 w-fit text-xs">
                        {getStatusIcon(ticket.status)}
                        {ticket.status === 'Open' ? t.statusOpen :
                         ticket.status === 'In Progress' ? t.statusInProgress :
                         ticket.status === 'Resolved' ? t.statusResolved :
                         ticket.status === 'Closed' ? t.statusClosed :
                         ticket.status}
                      </Badge>
                    </SelectValue>
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
              <TableCell className="min-w-[150px] text-sm">
                {ticket.submittedById ? getEmployeeName(ticket.submittedById) : t.none}
              </TableCell>
              
              {/* Assigned To - Inline Edit */}
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
                      updateTicketMutation.mutate({ 
                        id: ticket.id, 
                        updates: { assignedToId: userId } 
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                    <SelectValue>
                      {ticket.assignedToId ? (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                          </div>
                          {getUserName(ticket.assignedToId)}
                        </div>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-2 text-sm">
                          <UserX className="h-3 w-3" />
                          {t.unassigned}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="relative z-50">
                    <SelectItem value="unassigned">
                      <span className="text-gray-400 flex items-center gap-2">
                        <UserX className="h-3 w-3" />
                        {t.unassigned}
                      </span>
                    </SelectItem>
                    {users?.map((u: any) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                              {u.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {u.firstName && u.lastName 
                            ? `${u.firstName} ${u.lastName}` 
                            : u.username}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              {/* Due Date - Inline Edit with Calendar */}
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
                  placeholder={t.selectDueDate}
                  className="w-full h-8 text-sm"
                />
              </TableCell>

              {/* Actions Dropdown */}
              <TableCell className="w-12">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild data-dropdown-trigger>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Edit */}
                    <DropdownMenuItem onClick={() => onEdit?.(ticket)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t.edit}
                    </DropdownMenuItem>

                    {/* View Details */}
                    <DropdownMenuItem onClick={() => navigate(`/tickets/${ticket.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t.viewDetails}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Quick Status Changes */}
                    {ticket.status !== 'In Progress' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'In Progress')}>
                        <Clock className="mr-2 h-4 w-4" />
                        {t.statusInProgress}
                      </DropdownMenuItem>
                    )}

                    {ticket.status !== 'Resolved' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'Resolved')}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t.resolve}
                      </DropdownMenuItem>
                    )}

                    {ticket.status !== 'Closed' && ticket.status === 'Resolved' && (
                      <DropdownMenuItem onClick={() => handleStatusChange(ticket.id, 'Closed')}>
                        <XCircle className="mr-2 h-4 w-4" />
                        {t.close}
                      </DropdownMenuItem>
                    )}

                    {/* Quick Assign to Self */}
                    {user && (!ticket.assignedToId || ticket.assignedToId !== user.id) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          updateTicketMutation.mutate({ 
                            id: ticket.id, 
                            updates: { assignedToId: user.id } 
                          });
                        }}>
                          <User className="mr-2 h-4 w-4" />
                          {t.assignToMe}
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Unassign */}
                    {ticket.assignedToId && (
                      <DropdownMenuItem onClick={() => {
                        updateTicketMutation.mutate({ 
                          id: ticket.id, 
                          updates: { assignedToId: null } 
                        });
                      }}>
                        <UserX className="mr-2 h-4 w-4" />
                        {t.unassignAction}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Resolution Dialog */}
      <Dialog 
        open={resolutionDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
            setResolutionNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t.addResolutionDetails}
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
              {t.reviewBeforeStatus} {resolutionDialog.newStatus === 'Resolved' ? t.statusResolved : t.statusClosed}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution">{t.resolution}</Label>
              <Textarea
                id="resolution"
                placeholder={t.resolutionPlaceholder}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
                className="mt-1"
              />
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
              onClick={handleResolutionSubmit}
              disabled={!resolutionNotes.trim()}
            >
              {resolutionDialog.newStatus === 'Resolved' ? t.resolve : t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
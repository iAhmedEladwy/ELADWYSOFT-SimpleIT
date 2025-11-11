import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { hasPermission } from '@/components/auth/RoleGuard';
import { ROLE_IDS, getRoleLevel, normalizeRoleId } from '@shared/roles.config';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
import { Trash2, CheckCircle, XCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';
import { getPriorityColor } from '@/lib/utils/ticketUtils';


// Validation utilities
const isValidStatus = (value: string): boolean => {
  return ['Open', 'In Progress', 'Resolved', 'Closed'].includes(value);
};

const isValidType = (value: string): boolean => {
  return ['Incident', 'Service Request', 'Problem', 'Change'].includes(value);
};

interface TicketsTableProps {
  tickets: any[];
  employees: any[];
  assets: any[];
  users: any[];
  onStatusChange: (id: number, status: string, resolutionNotes?: string) => void;
  onAssign: (id: number, userId: number) => void;
  onEdit?: (ticket: any) => void;
  onDelete?: (id: number) => void;
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
  onDelete,
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

  // FIXED: Enhanced update ticket mutation with comprehensive validation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      // Validate the ticket ID
      if (!id || id <= 0) {
        throw new Error('Invalid ticket ID');
      }

      // Validate updates object
      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid update data');
      }

      if (updates.status && !isValidStatus(updates.status)) {
        throw new Error('Invalid status');
      }

      if (updates.type && !isValidType(updates.type)) {
        throw new Error('Invalid ticket type');
      }

      // Validate assignedToId if present
      if (updates.assignedToId !== undefined && updates.assignedToId !== null && updates.assignedToId <= 0) {
        throw new Error('Invalid assigned user ID');
      }

   return apiRequest(`/api/tickets/${id}`, 'PATCH', updates);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      
      // Show success toast only for major updates
      if (variables.updates.status || variables.updates.assignedToId !== undefined) {
        toast({
          title: t.success || 'Success',
          description: t.ticketUpdated || 'Ticket updated successfully',
        });
      }
    },
    onError: (error: any, variables) => {
      console.error('Failed to update ticket:', error, variables);
      toast({
        title: t.error || 'Error',
        description: error.message || t.errorUpdating || 'Failed to update ticket',
        variant: 'destructive',
      });
    },
  });

  // FIXED: Safe helper functions with comprehensive validation
  const getEmployeeName = (employeeId: number) => {
    try {
      if (!Array.isArray(employees) || !employeeId || employeeId <= 0) return t.none || 'None';
      const employee = employees.find((emp: any) => emp && emp.id === employeeId);
      return employee && employee.englishName ? employee.englishName : (t.none || 'None');
    } catch (error) {
      console.error('Error getting employee name:', error);
      return t.none || 'None';
    }
  };

  const getUserName = (userId: number) => {
    try {
      if (!Array.isArray(users) || !userId || userId <= 0) return t.unassigned || 'Unassigned';
      const assignedUser = users.find((u: any) => u && u.id === userId);
      return assignedUser && assignedUser.username ? assignedUser.username : (t.unassigned || 'Unassigned');
    } catch (error) {
      console.error('Error getting user name:', error);
      return t.unassigned || 'Unassigned';
    }
  };

  const getAssetName = (assetId: number) => {
    try {
      if (!Array.isArray(assets) || !assetId || assetId <= 0) return t.none || 'None';
      const asset = assets.find((a: any) => a && a.id === assetId);
      return asset && (asset.name || asset.assetId) ? 
        (asset.name || asset.assetId) : 
        (t.none || 'None');
    } catch (error) {
      console.error('Error getting asset name:', error);
      return t.none || 'None';
    }
  };

  // FIXED: Enhanced status permissions with validation
  const getAvailableStatuses = (currentStatus: string): string[] => {
    try {
      // Validate current status
      if (!currentStatus || !isValidStatus(currentStatus)) {
        return ['Open', 'In Progress', 'Resolved', 'Closed'];
      }

      // Full access for admins, managers, and agents
      if (user && getRoleLevel(user.role) >= getRoleLevel(ROLE_IDS.AGENT)) {
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

  // FIXED: Enhanced urgency/impact change handler with comprehensive validation
  const handleUrgencyImpactChange = (ticketId: number, field: 'urgency' | 'impact', value: string, currentTicket: any) => {
    try {
      // Validate inputs
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid ticket ID');
      }

      if (!value || !['Low', 'Medium', 'High', 'Critical'].includes(value)) {
        throw new Error('Invalid field value');
      }

      if (!currentTicket || typeof currentTicket !== 'object') {
        throw new Error('Invalid ticket data');
      }

      // Get current values with fallbacks
      const currentUrgency = currentTicket.urgency || 'Medium';
      const currentImpact = currentTicket.impact || 'Medium';

      // Calculate new values
      const newUrgency = field === 'urgency' ? value : currentUrgency;
      const newImpact = field === 'impact' ? value : currentImpact;
      
      // Validate enum values
      if (!isValidUrgencyLevel(newUrgency)) {
        throw new Error('Invalid urgency level');
      }

      if (!isValidImpactLevel(newImpact)) {
        throw new Error('Invalid impact level');
      }

      // Calculate new priority using the shared utility
      const newPriority = calculatePriority(newUrgency, newImpact);
      
      // Update both the changed field and the calculated priority
      updateTicketMutation.mutate({ 
        id: ticketId, 
        updates: { 
          [field]: value,
          priority: newPriority
        } 
      });
    } catch (error) {
      console.error('Error handling urgency/impact change:', error);
      toast({
        title: t.error || 'Error',
        description: error instanceof Error ? error.message : 'Failed to update priority',
        variant: 'destructive',
      });
    }
  };

  // FIXED: Safe ticket selection handler
  const handleTicketSelection = (ticketId: number, checked: boolean) => {
    try {
      if (!onSelectionChange || !ticketId || ticketId <= 0) return;
      
      if (checked) {
        onSelectionChange([...selectedTickets, ticketId]);
      } else {
        onSelectionChange(selectedTickets.filter(id => id !== ticketId));
      }
    } catch (error) {
      console.error('Error handling ticket selection:', error);
    }
  };

  // FIXED: Enhanced row click handler with better event handling
  const handleRowClick = (ticket: any, event: React.MouseEvent) => {
    try {
      if (!ticket || !ticket.id) return;

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
      
      // Direct edit - open TicketForm in edit mode
      if (onEdit && typeof onEdit === 'function') {
        onEdit(ticket);
      }
    } catch (error) {
      console.error('Error handling row click:', error);
    }
  };

  // FIXED: Enhanced status change with validation
  const handleStatusChange = (ticketId: number, newStatus: string) => {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid ticket ID');
      }

      if (!newStatus || !isValidStatus(newStatus)) {
        throw new Error('Invalid status');
      }

      if (newStatus === 'Resolved' || newStatus === 'Closed') {
        setResolutionDialog({ open: true, ticketId, newStatus });
      } else {
        updateTicketMutation.mutate({ 
          id: ticketId, 
          updates: { status: newStatus } 
        });
      }
    } catch (error) {
      console.error('Error handling status change:', error);
      toast({
        title: t.error || 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  // Handle delete ticket
  const handleDelete = (ticketId: number) => {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid ticket ID');
      }

      // Check if user has permission to delete (manager+ level through RBAC)
      if (!user || getRoleLevel(user.role) < getRoleLevel(ROLE_IDS.MANAGER)) {
        toast({
          title: t.error || 'Error',
          description: 'You do not have permission to delete tickets',
          variant: 'destructive',
        });
        return;
      }

      if (window.confirm(t.deleteTicketConfirm || 'Are you sure you want to delete this ticket? This action cannot be undone.')) {
        if (onDelete) {
          onDelete(ticketId);
        }
      }
    } catch (error) {
      console.error('Error handling delete:', error);
      toast({
        title: t.error || 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete ticket',
        variant: 'destructive',
      });
    }
  };

  // Handle resolve ticket (opens resolution dialog)
  const handleResolve = (ticketId: number) => {
    try {
      if (!ticketId || ticketId <= 0) {
        throw new Error('Invalid ticket ID');
      }

      setResolutionDialog({ open: true, ticketId, newStatus: 'Resolved' });
    } catch (error) {
      console.error('Error handling resolve:', error);
      toast({
        title: t.error || 'Error',
        description: error instanceof Error ? error.message : 'Failed to open resolution dialog',
        variant: 'destructive',
      });
    }
  };

  // FIXED: Enhanced resolution dialog submit with validation
  const handleResolutionSubmit = () => {
    try {
      if (!resolutionDialog.ticketId || resolutionDialog.ticketId <= 0) {
        throw new Error('Invalid ticket ID');
      }

      if (!resolutionNotes.trim()) {
        throw new Error('Resolution notes are required');
      }

      if (!resolutionDialog.newStatus || !isValidStatus(resolutionDialog.newStatus)) {
        throw new Error('Invalid status');
      }

      updateTicketMutation.mutate({ 
        id: resolutionDialog.ticketId, 
        updates: { 
          status: resolutionDialog.newStatus,
          resolution: resolutionNotes.trim() // Backend expects 'resolution' field
        } 
      });
      
      setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
      setResolutionNotes('');
    } catch (error) {
      console.error('Error submitting resolution:', error);
      toast({
        title: t.error || 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit resolution',
        variant: 'destructive',
      });
    }
  };

  // FIXED: Enhanced priority color with validation
  const getPriorityColor = (priority: string) => {
    try {
      if (!priority || typeof priority !== 'string') return 'default';
      
      switch (priority.toLowerCase()) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'default';
        case 'low': return 'secondary';
        default: return 'default';
      }
    } catch (error) {
      console.error('Error getting priority color:', error);
      return 'default';
    }
  };

  // FIXED: Safe tickets array with comprehensive validation
  const safeTickets = Array.isArray(tickets) ? tickets.filter(ticket => ticket && ticket.id) : [];

  if (safeTickets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t.noTicketsFound || 'No tickets found'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedTickets.length === safeTickets.length && safeTickets.length > 0}
                    onCheckedChange={(checked) => {
                      try {
                        if (checked) {
                          onSelectionChange(safeTickets.map(ticket => ticket.id));
                        } else {
                          onSelectionChange([]);
                        }
                      } catch (error) {
                        console.error('Error handling select all:', error);
                      }
                    }}
                  />
                </TableHead>
              )}
              <TableHead>{t.ticketId || 'Ticket ID'}</TableHead>
              <TableHead>{t.dateCreated || 'Date Created'}</TableHead>
              <TableHead>{t.title || 'Title'}</TableHead>
              <TableHead>{t.type || 'Type'}</TableHead>
              <TableHead>{t.category || 'Category'}</TableHead>
              <TableHead>{t.priority || 'Priority'}</TableHead>
              <TableHead>{t.status || 'Status'}</TableHead>
              <TableHead>{t.submittedBy || 'Submitted By'}</TableHead>
              <TableHead>{t.assignedTo || 'Assigned To'}</TableHead>
              <TableHead className="w-[120px] text-center">{t.actions || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeTickets.map((ticket: any) => {
              // Skip invalid tickets
              if (!ticket || !ticket.id) return null;

              return (
                <TableRow 
                  key={ticket.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(ticket, e)}
                >
                  {/* Selection Checkbox */}
                  {onSelectionChange && (
                    <TableCell data-checkbox-cell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                      <div onClick={(e) => e.stopPropagation()}>
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
                      {ticket.ticketId || `TKT-${ticket.id}`}
                    </Badge>
                  </TableCell>
                  
                  {/* Date Created */}
                  <TableCell className="min-w-[110px] text-sm text-muted-foreground">
                    {ticket.createdAt ? (() => {
                      try {
                        return format(new Date(ticket.createdAt), 'MMM d, yyyy');
                      } catch {
                        return 'Invalid date';
                      }
                    })() : '-'}
                  </TableCell>
                  
                  {/* Title (Fixed: using title instead of summary) */}
                  <TableCell className="min-w-[200px] max-w-xs">
                    <div className="space-y-1">
                      <div className="font-medium truncate" title={ticket.title || ticket.description}>
                        {ticket.title || (ticket.description ? `${ticket.description.substring(0, 50)}...` : (t.none || 'No title'))}
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
                  
                  {/* Type - Non-Inline Edit with validation */}
                 <TableCell className="min-w-[120px] text-sm">
                  <Badge variant="outline" className="text-xs">
                    {ticket.type === 'Incident' ? (t.typeIncident || 'Incident') :
                    ticket.type === 'Service Request' ? (t.typeServiceRequest || 'Service Request') :
                    ticket.type === 'Problem' ? (t.typeProblem || 'Problem') :
                    ticket.type === 'Change' ? (t.typeChange || 'Change') :
                    ticket.type || 'Incident'}
                  </Badge>
                </TableCell>

                  {/* Category */}
                  <TableCell className="min-w-[100px] text-sm">
                    <Badge variant="secondary" className="text-xs">
                      {ticket.category || 'General'}
                    </Badge>
                  </TableCell>
                  
                  {/* Priority - Read-only (auto-calculated) */}
                  <TableCell className="min-w-[80px]">
                    <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                      {ticket.priority === 'Low' ? (t.priorityLow || 'Low') :
                       ticket.priority === 'Medium' ? (t.priorityMedium || 'Medium') :
                       ticket.priority === 'High' ? (t.priorityHigh || 'High') :
                       ticket.priority === 'Critical' ? (t.priorityCritical || 'Critical') :
                       ticket.priority || 'Medium'}
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
                          <Badge 
                            variant={
                              ticket.status === 'Open' ? 'default' :
                              ticket.status === 'In Progress' ? 'secondary' :
                              ticket.status === 'Resolved' ? 'outline' :
                              ticket.status === 'Closed' ? 'destructive' : 'default'
                            }
                            className="text-xs"
                          >
                            {ticket.status === 'Open' ? (t.statusOpen || 'Open') :
                             ticket.status === 'In Progress' ? (t.statusInProgress || 'In Progress') :
                             ticket.status === 'Resolved' ? (t.statusResolved || 'Resolved') :
                             ticket.status === 'Closed' ? (t.statusClosed || 'Closed') :
                             ticket.status || 'Open'}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="relative z-50">
                        {getAvailableStatuses(ticket.status || 'Open').map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === 'Open' ? (t.statusOpen || 'Open') :
                             status === 'In Progress' ? (t.statusInProgress || 'In Progress') :
                             status === 'Resolved' ? (t.statusResolved || 'Resolved') :
                             (t.statusClosed || 'Closed')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  {/* Submitted By */}
                  <TableCell className="min-w-[150px] text-sm">
                    {ticket.submittedById ? getEmployeeName(ticket.submittedById) : (t.none || 'None')}
                  </TableCell>
                  
                  {/* Assigned To - Inline Edit with proper user filtering */}
                  <TableCell className="inline-edit-cell relative min-w-[150px]" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={ticket.assignedToId?.toString() || 'unassigned'}
                      onValueChange={(value) => {
                        try {
                          if (value === 'unassigned') {
                            updateTicketMutation.mutate({ 
                              id: ticket.id, 
                              updates: { assignedToId: null } 
                            });
                          } else {
                            const userId = parseInt(value);
                            if (!isNaN(userId) && userId > 0) {
                              updateTicketMutation.mutate({ 
                                id: ticket.id, 
                                updates: { assignedToId: userId } 
                              });
                            }
                          }
                        } catch (error) {
                          console.error('Error updating assignment:', error);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                        <SelectValue>
                          {ticket.assignedToId ? getUserName(ticket.assignedToId) : (t.unassigned || 'Unassigned')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="relative z-50">
                        <SelectItem value="unassigned">{t.unassigned || 'Unassigned'}</SelectItem>
                        {/* Filter users who can be assigned tickets (agents, managers, admins) */}
                        {Array.isArray(users) && users
                          .filter((u: any) => u && getRoleLevel(u.role) >= getRoleLevel(ROLE_IDS.AGENT))
                          .map((u: any) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.username || `User ${u.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  
                  {/* Action Buttons */}
                  <TableCell className="w-[120px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {/* Resolve Button - Only show if ticket is not already resolved/closed */}
                      {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleResolve(ticket.id)}
                          title={t.resolveTicket || 'Resolve Ticket'}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {/* Delete Button - Manager+ level through RBAC */}
                      {user && getRoleLevel(user.role) >= getRoleLevel(ROLE_IDS.MANAGER) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(ticket.id)}
                          title={t.deleteTicket || 'Delete Ticket'}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialog.open} onOpenChange={(open) => setResolutionDialog({ ...resolutionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addResolution || 'Add Resolution'}</DialogTitle>
            <DialogDescription>
              {language === 'English' 
                ? 'Please provide resolution notes before marking this ticket as resolved or closed.'
                : 'يرجى تقديم ملاحظات الحل قبل تصنيف هذه التذكرة كمحلولة أو مغلقة.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution-notes">{t.resolutionNotes || 'Resolution Notes'}</Label>
              <Textarea
                id="resolution-notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={language === 'English' 
                  ? 'Describe how this ticket was resolved...'
                  : 'اشرح كيف تم حل هذه التذكرة...'
                }
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
              }}
            >
              {t.cancel || 'Cancel'}
            </Button>
            <Button 
              onClick={handleResolutionSubmit}
              disabled={!resolutionNotes.trim()}
            >
              {t.saveResolution || 'Save Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { calculatePriority } from '@shared/priorityUtils';
import type { UrgencyLevel, ImpactLevel } from '@shared/priorityUtils';

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

  // Update ticket mutation for inline editing - Using PATCH endpoint
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      // Use the PATCH endpoint with history tracking
      return apiRequest(`/api/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      // No toast for inline edits - too noisy, but log success
      console.log('Ticket updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update ticket:', error);
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
      return asset && asset.name ? asset.name : asset && asset.assetId ? asset.assetId : t.none;
    } catch (error) {
      console.error('Error getting asset name:', error);
      return t.none;
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

  // Handle urgency/impact change with automatic priority calculation
  const handleUrgencyImpactChange = (ticketId: number, field: 'urgency' | 'impact', value: string, currentTicket: any) => {
    const newUrgency = field === 'urgency' ? value as UrgencyLevel : currentTicket.urgency as UrgencyLevel;
    const newImpact = field === 'impact' ? value as ImpactLevel : currentTicket.impact as ImpactLevel;
    
    // Calculate new priority using the shared utility
    const newPriority = calculatePriority(newUrgency, newImpact);
    
    // Update both the changed field and the calculated priority
    // The backend will also validate and set priority via triggers
    updateTicketMutation.mutate({ 
      id: ticketId, 
      updates: { 
        [field]: value,
        // Include priority in case backend doesn't have triggers set up yet
        priority: newPriority
      } 
    });
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
    
    // Direct edit - open TicketForm in edit mode
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

  // Handle resolution dialog submit - Use PATCH with resolution
  const handleResolutionSubmit = () => {
    if (resolutionDialog.ticketId && resolutionNotes.trim()) {
      updateTicketMutation.mutate({ 
        id: resolutionDialog.ticketId, 
        updates: { 
          status: resolutionDialog.newStatus,
          resolution: resolutionNotes // Backend expects 'resolution' field
        } 
      });
      setResolutionDialog({ open: false, ticketId: null, newStatus: '' });
      setResolutionNotes('');
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  if (safeTickets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t.noTicketsFound}
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
                      if (checked) {
                        onSelectionChange(safeTickets.map(ticket => ticket.id));
                      } else {
                        onSelectionChange([]);
                      }
                    }}
                  />
                </TableHead>
              )}
              <TableHead>{t.ticketId}</TableHead>
              <TableHead>{t.dateCreated}</TableHead>
              <TableHead>{t.title}</TableHead>
              <TableHead>{t.type}</TableHead>
              <TableHead>{t.category}</TableHead>
              <TableHead>{t.priority}</TableHead>
              <TableHead>{t.urgency}</TableHead>
              <TableHead>{t.impact}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.submittedBy}</TableHead>
              <TableHead>{t.assignedTo}</TableHead>
              <TableHead>{t.relatedAsset}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeTickets.map((ticket: any) => (
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
                    {ticket.ticketId}
                  </Badge>
                </TableCell>
                
                {/* Date Created */}
                <TableCell className="min-w-[110px] text-sm text-muted-foreground">
                  {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </TableCell>
                
                {/* Title (Fixed: using title instead of summary) */}
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

                {/* Category */}
                <TableCell className="min-w-[100px] text-sm">
                  <Badge variant="secondary" className="text-xs">
                    {ticket.category || 'General'}
                  </Badge>
                </TableCell>
                
                {/* Priority - Read-only (auto-calculated) */}
                <TableCell className="min-w-[80px]">
                  <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                    {ticket.priority === 'Low' ? t.priorityLow :
                     ticket.priority === 'Medium' ? t.priorityMedium :
                     ticket.priority === 'High' ? t.priorityHigh :
                     ticket.priority === 'Critical' ? t.priorityCritical :
                     ticket.priority}
                  </Badge>
                </TableCell>
                
                {/* Urgency - Inline Edit with Priority Calculation */}
                <TableCell className="inline-edit-cell relative min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.urgency || 'Medium'}
                    onValueChange={(value) => handleUrgencyImpactChange(ticket.id, 'urgency', value, ticket)}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                      <SelectValue>
                        {ticket.urgency === 'Low' ? t.urgencyLow :
                         ticket.urgency === 'Medium' ? t.urgencyMedium :
                         ticket.urgency === 'High' ? t.urgencyHigh :
                         ticket.urgency === 'Critical' ? t.urgencyCritical :
                         ticket.urgency}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      <SelectItem value="Low">{t.urgencyLow}</SelectItem>
                      <SelectItem value="Medium">{t.urgencyMedium}</SelectItem>
                      <SelectItem value="High">{t.urgencyHigh}</SelectItem>
                      <SelectItem value="Critical">{t.urgencyCritical}</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Impact - Inline Edit with Priority Calculation */}
                <TableCell className="inline-edit-cell relative min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={ticket.impact || 'Medium'}
                    onValueChange={(value) => handleUrgencyImpactChange(ticket.id, 'impact', value, ticket)}
                  >
                    <SelectTrigger className="h-8 border-0 bg-transparent hover:bg-gray-50 focus:ring-0">
                      <SelectValue>
                        {ticket.impact === 'Low' ? t.impactLow :
                         ticket.impact === 'Medium' ? t.impactMedium :
                         ticket.impact === 'High' ? t.impactHigh :
                         ticket.impact === 'Critical' ? t.impactCritical :
                         ticket.impact}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      <SelectItem value="Low">{t.impactLow}</SelectItem>
                      <SelectItem value="Medium">{t.impactMedium}</SelectItem>
                      <SelectItem value="High">{t.impactHigh}</SelectItem>
                      <SelectItem value="Critical">{t.impactCritical}</SelectItem>
                    </SelectContent>
                  </Select>
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
                
                {/* Assigned To - Inline Edit with proper user filtering */}
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
                        {ticket.assignedToId ? getUserName(ticket.assignedToId) : t.unassigned}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="relative z-50">
                      <SelectItem value="unassigned">{t.unassigned}</SelectItem>
                      {/* Filter users who can be assigned tickets (agents, managers, admins) */}
                      {Array.isArray(users) && users
                        .filter((u: any) => u && ['agent', 'manager', 'admin'].includes(u.role))
                        .map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.username || `User ${u.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                
                {/* Related Asset */}
                <TableCell className="min-w-[120px] text-sm">
                  {ticket.relatedAssetId ? getAssetName(ticket.relatedAssetId) : t.none}
                </TableCell>
                
                {/* Actions Dropdown */}
                <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild data-dropdown-trigger>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t.openMenu}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="relative z-50">
                      <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit && onEdit(ticket)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t.editTicket}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/tickets/${ticket.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t.viewDetails}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Resolution Dialog */}
      <Dialog open={resolutionDialog.open} onOpenChange={(open) => setResolutionDialog({ ...resolutionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addResolution}</DialogTitle>
            <DialogDescription>
              {language === 'English' 
                ? 'Please provide resolution notes before marking this ticket as resolved or closed.'
                : 'يرجى تقديم ملاحظات الحل قبل تصنيف هذه التذكرة كمحلولة أو مغلقة.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution-notes">{t.resolutionNotes}</Label>
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
              onClick={() => setResolutionDialog({ open: false, ticketId: null, newStatus: '' })}
            >
              {t.cancel}
            </Button>
            <Button 
              onClick={handleResolutionSubmit}
              disabled={!resolutionNotes.trim()}
            >
              {t.saveResolution}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
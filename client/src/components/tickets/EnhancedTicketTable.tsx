import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Play, 
  Pause, 
  History, 
  Trash2, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  tickets = [], 
  employees = [], 
  assets = [], 
  users = [], 
  isLoading 
}: EnhancedTicketTableProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch ticket history for selected ticket
  const { data: ticketHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['/api/tickets', selectedTicket?.id, 'history'],
    enabled: !!selectedTicket && showHistory,
  });

  // Time tracking mutations
  const startTimeMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest(`/api/tickets/${ticketId}/start-time`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Time tracking started",
        description: "Timer is now running for this ticket.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start time tracking",
        variant: "destructive",
      });
    },
  });

  const stopTimeMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest(`/api/tickets/${ticketId}/stop-time`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Time tracking stopped",
        description: "Time has been recorded for this ticket.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop time tracking",
        variant: "destructive",
      });
    },
  });

  // Delete ticket mutation (admin only)
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return await apiRequest(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Ticket deleted",
        description: "The ticket has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ticket",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Open':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeSpent = (minutes: number) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getEmployeeName = (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    return employee?.englishName || `Employee #${id}`;
  };

  const getUserName = (id: number) => {
    const foundUser = users.find(u => u.id === id);
    return foundUser?.username || `User #${id}`;
  };

  const getAssetName = (id: number) => {
    const asset = assets.find(a => a.id === id);
    return asset ? `${asset.name} (${asset.assetId})` : `Asset #${id}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
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
            <TableHead>Ticket ID</TableHead>
            <TableHead>Request Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Time Spent</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.ticketId}</TableCell>
              <TableCell>
                <Badge variant="outline">{ticket.requestType}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <span>{ticket.status}</span>
                  {ticket.isTimeTracking && (
                    <Timer className="h-4 w-4 text-orange-500 animate-pulse" />
                  )}
                </div>
              </TableCell>
              <TableCell>{getEmployeeName(ticket.submittedById)}</TableCell>
              <TableCell>
                {ticket.assignedToId ? getUserName(ticket.assignedToId) : 'Unassigned'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatTimeSpent(ticket.timeSpent || 0)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {/* Time Tracking Controls */}
                  {ticket.isTimeTracking ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => stopTimeMutation.mutate(ticket.id)}
                      disabled={stopTimeMutation.isPending}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startTimeMutation.mutate(ticket.id)}
                      disabled={startTimeMutation.isPending}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}

                  {/* History Dialog */}
                  <Dialog open={showHistory && selectedTicket?.id === ticket.id} 
                          onOpenChange={(open) => {
                            setShowHistory(open);
                            if (open) setSelectedTicket(ticket);
                            else setSelectedTicket(null);
                          }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <History className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Ticket History - {ticket.ticketId}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {historyLoading ? (
                          <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : ticketHistory.length > 0 ? (
                          ticketHistory.map((history: TicketHistory) => (
                            <div key={history.id} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">
                                    {getUserName(history.changedBy)}
                                  </span>
                                  <Badge variant="outline">{history.changeType}</Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(history.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{history.changeDescription}</p>
                              {history.oldValue && history.newValue && (
                                <div className="text-sm bg-gray-50 p-2 rounded">
                                  <span className="text-red-600">- {history.oldValue}</span>
                                  <br />
                                  <span className="text-green-600">+ {history.newValue}</span>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-8">
                            No history available for this ticket.
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Button (Admin Only) */}
                  {hasAccess(3) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete ticket {ticket.ticketId}? 
                            This action cannot be undone and will permanently remove 
                            the ticket and all its history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTicketMutation.mutate(ticket.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Ticket
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tickets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tickets found. Create your first ticket to get started.
        </div>
      )}
    </div>
  );
}
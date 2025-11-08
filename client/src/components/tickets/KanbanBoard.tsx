import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertCircle, 
  Clock, 
  User, 
  MessageSquare,
  Paperclip,
  Calendar
} from 'lucide-react';
import type { TicketResponse } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';

interface KanbanBoardProps {
  tickets: TicketResponse[];
  onTicketClick: (ticket: TicketResponse) => void;
  users?: any[];
}

const statusColumns = [
  { id: 'Open', label: 'Open', color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
  { id: 'In Progress', label: 'In Progress', color: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
  { id: 'Resolved', label: 'Resolved', color: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' },
  { id: 'Closed', label: 'Closed', color: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700' },
];

const priorityColors = {
  Low: 'bg-gray-500',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
};

export default function KanbanBoard({ tickets, onTicketClick, users = [] }: KanbanBoardProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [draggedTicket, setDraggedTicket] = useState<TicketResponse | null>(null);

  const translations = {
    priority: language === 'Arabic' ? 'الأولوية' : 'Priority',
    assignedTo: language === 'Arabic' ? 'مُسند إلى' : 'Assigned to',
    unassigned: language === 'Arabic' ? 'غير مُسند' : 'Unassigned',
    createdBy: language === 'Arabic' ? 'تم الإنشاء بواسطة' : 'Created by',
    ticket: language === 'Arabic' ? 'تذكرة' : 'Ticket',
    tickets: language === 'Arabic' ? 'تذاكر' : 'tickets',
    updateSuccess: language === 'Arabic' ? 'تم تحديث حالة التذكرة بنجاح' : 'Ticket status updated successfully',
    updateError: language === 'Arabic' ? 'فشل تحديث حالة التذكرة' : 'Failed to update ticket status',
  };

  // Group tickets by status
  const ticketsByStatus = useMemo(() => {
    const grouped: Record<string, TicketResponse[]> = {
      'Open': [],
      'In Progress': [],
      'Resolved': [],
      'Closed': [],
    };

    tickets.forEach((ticket) => {
      if (grouped[ticket.status]) {
        grouped[ticket.status].push(ticket);
      }
    });

    return grouped;
  }, [tickets]);

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number; status: string }) =>
      apiRequest(`/api/tickets/${ticketId}`, 'PATCH', { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: translations.updateSuccess,
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.updateError,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, ticket: TicketResponse) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTicket(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    
    if (draggedTicket && draggedTicket.status !== newStatus) {
      updateStatusMutation.mutate({
        ticketId: draggedTicket.id,
        status: newStatus,
      });
    }
    
    setDraggedTicket(null);
  };

  // Get user info
  const getUserInfo = (userId?: number) => {
    if (!userId) return null;
    return users.find((u) => u.id === userId);
  };

  // Get initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-20rem)]">
      {statusColumns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className={`rounded-lg border-2 ${column.color} h-full flex flex-col`}>
            {/* Column Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {column.label}
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {ticketsByStatus[column.id]?.length || 0}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {ticketsByStatus[column.id]?.map((ticket) => {
                const assignedUser = getUserInfo(ticket.assignedToId);
                const createdUser = getUserInfo(ticket.submittedById);

                return (
                  <Card
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTicketClick(ticket)}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      draggedTicket?.id === ticket.id ? 'opacity-50' : ''
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Ticket ID and Priority */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{ticket.ticketId}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  priorityColors[ticket.priority as keyof typeof priorityColors]
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{translations.priority}: {ticket.priority}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-sm line-clamp-2">
                        {ticket.title}
                      </h4>

                      {/* Type and Category */}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {ticket.type}
                        </Badge>
                        {ticket.category && (
                          <Badge variant="outline" className="text-xs">
                            {ticket.category}
                          </Badge>
                        )}
                      </div>

                      {/* Meta Information */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {/* Assigned User */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  {assignedUser ? (
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(assignedUser.firstName, assignedUser.lastName)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <User className="h-4 w-4" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {translations.assignedTo}:{' '}
                                  {assignedUser
                                    ? `${assignedUser.firstName} ${assignedUser.lastName}`
                                    : translations.unassigned}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Created Time */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs">
                                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {new Date(ticket.createdAt).toLocaleString()}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Empty State */}
              {ticketsByStatus[column.id]?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No {translations.tickets}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

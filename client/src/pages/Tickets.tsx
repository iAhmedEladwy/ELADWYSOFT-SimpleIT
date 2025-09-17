import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import TicketsTable from '@/components/tickets/TicketsTable';
import TicketFilters from '@/components/tickets/TicketFilters';
import TicketForm from '@/components/tickets/TicketForm'; // Our new TicketForm
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Plus, Users, Ticket, AlertCircle } from 'lucide-react';
import type { TicketFilters as TicketFiltersType, TicketResponse, TicketCreateRequest } from '@shared/types';

export default function Tickets() {
  const { language } = useLanguage();
  const t = useTicketTranslations(language);
  const { user, hasAccess } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [filters, setFilters] = useState<TicketFiltersType>({});
  
  // Form dialogs state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicketForEdit, setSelectedTicketForEdit] = useState<TicketResponse | null>(null);

  // Data queries
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets'],
    staleTime: 30000, // 30 seconds
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 300000, // 5 minutes
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 300000, // 5 minutes
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 300000, // 5 minutes
  });

  // Filter tickets based on applied filters
  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets)) return [];

    return tickets.filter((ticket: any) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchMatch = 
          ticket.title?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.ticketId?.toLowerCase().includes(searchLower);
        if (!searchMatch) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (ticket.status !== filters.status) return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (ticket.priority !== filters.priority) return false;
      }

      // Type filter
      if (filters.type && filters.type !== 'all') {
        if (ticket.type !== filters.type) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (ticket.category !== filters.category) return false;
      }

      // Assigned to filter
      if (filters.assignedTo && filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned') {
          if (ticket.assignedToId) return false;
        } else {
          if (ticket.assignedToId?.toString() !== filters.assignedTo) return false;
        }
      }

      // Submitted by filter  
      if (filters.submittedBy && filters.submittedBy !== 'all') {
        if (ticket.submittedById?.toString() !== filters.submittedBy) return false;
      }

      return true;
    });
  }, [tickets, filters]);

  // Ticket counts for summary
  const ticketCounts = useMemo(() => {
    const allTicketsCount = Array.isArray(tickets) ? tickets.length : 0;
    const openTicketsCount = Array.isArray(tickets) ? tickets.filter((t: any) => t.status === 'Open').length : 0;
    const myTicketsCount = Array.isArray(tickets) && user ? tickets.filter((t: any) => t.assignedToId === user.id).length : 0;

    return {
      all: allTicketsCount,
      open: openTicketsCount,
      my: myTicketsCount,
      filtered: filteredTickets.length
    };
  }, [tickets, user, filteredTickets]);

  // Mutations
  const createTicketMutation = useMutation({
    mutationFn: (ticketData: TicketCreateRequest) => apiRequest('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    }),
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({ title: t.success, description: t.ticketCreated });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({ 
        title: t.error, 
        description: error.message || 'Failed to create ticket',
        variant: 'destructive' 
      });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: ({ id, status, resolutionNotes }: { id: number; status: string; resolutionNotes?: string }) =>
    apiRequest(`/api/tickets/${id}`, 'PUT', { status, resolution: resolutionNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({ title: t.success, description: t.ticketUpdated });
    },
    onError: (error: any) => {
      toast({ 
        title: t.error, 
        description: error.message || t.errorUpdating,
        variant: 'destructive' 
      });
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      apiRequest(`/api/tickets/${id}`, 'PUT', { assignedToId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({ title: t.success, description: t.ticketAssigned });
    },
    onError: (error: any) => {
      toast({ 
        title: t.error, 
        description: error.message || t.errorUpdating,
        variant: 'destructive' 
      });
    },
  });

  // Event handlers
  const handleCreateTicket = (ticketData: TicketCreateRequest) => {
    createTicketMutation.mutate(ticketData);
  };

  const handleStatusChange = (ticketId: number, status: string, resolutionNotes?: string) => {
    updateTicketStatusMutation.mutate({ id: ticketId, status, resolutionNotes });
  };

  const handleAssignTicket = (ticketId: number, userId: number) => {
    assignTicketMutation.mutate({ id: ticketId, userId });
  };

  const handleEditTicket = (ticket: TicketResponse) => {
    setSelectedTicketForEdit(ticket);
  };

  const handleTicketFormSuccess = (ticket: TicketResponse) => {
    queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    toast({ 
      title: t.success, 
      description: selectedTicketForEdit ? t.ticketUpdated : t.ticketCreated 
    });
    setSelectedTicketForEdit(null);
    setShowCreateForm(false);
  };

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTickets.length === 0) {
      toast({
        title: t.error,
        description: t.noTicketsSelected,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await Promise.all(
        selectedTickets.map(id => 
          apiRequest(`/api/tickets/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: t.success,
        description: `${selectedTickets.length} ${t.ticketUpdated}`,
      });
      setSelectedTickets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: t.error,
        description: t.errorUpdating,
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async (userId: number) => {
    if (selectedTickets.length === 0) {
      toast({
        title: t.error,
        description: t.noTicketsSelected,
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await Promise.all(
        selectedTickets.map(id => 
          apiRequest(`/api/tickets/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ assignedToId: userId }),
          })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: t.success,
        description: `${selectedTickets.length} ${t.ticketAssigned}`,
      });
      setSelectedTickets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: t.error,
        description: t.errorUpdating,
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      toast({
        title: t.error,
        description: t.noTicketsSelected,
        variant: 'destructive'
      });
      return;
    }

    if (!window.confirm(`${t.deleteSelected}? ${selectedTickets.length} ${t.ticketLabel}`)) {
      return;
    }
    
    try {
      await Promise.all(
        selectedTickets.map(id => 
          apiRequest(`/api/tickets/${id}`, { method: 'DELETE' })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: t.success,
        description: `${selectedTickets.length} ${t.ticketDeleted}`,
      });
      setSelectedTickets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: t.error,
        description: t.errorUpdating,
        variant: 'destructive',
      });
    }
  };

  if (ticketsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground mt-2">{t.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {selectedTickets.length} {t.selectedCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                {t.bulkActions}
              </Button>
              {showBulkActions && (
                <div className="flex gap-2">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkStatusChange('Resolved')}
                  >
                    {t.resolve}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm" 
                    onClick={() => handleBulkStatusChange('Closed')}
                  >
                    {t.close}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    {t.delete}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Create Ticket Button */}
          {hasAccess(2) && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t.createTicket}
            </Button>
          )}
        </div>
      </div>

      {/* Tickets Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.allTickets}</p>
                <p className="text-2xl font-bold">{ticketCounts.all}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.openTickets}</p>
                <p className="text-2xl font-bold text-orange-600">{ticketCounts.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.myTickets}</p>
                <p className="text-2xl font-bold text-blue-600">{ticketCounts.my}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t.showing}</p>
                <p className="text-2xl font-bold text-green-600">{ticketCounts.filtered}</p>
              </div>
              <Badge variant="outline" className="text-green-600">
                {t.results}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <TicketFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={ticketCounts.all}
            filteredCount={ticketCounts.filtered}
            tickets={filteredTickets}
          />
        </CardContent>
      </Card>

      {/* Main Tickets Table */}
      <Card>
        <TicketsTable 
          tickets={filteredTickets}
          employees={employees}
          assets={assets}
          users={users}
          onStatusChange={handleStatusChange}
          onAssign={handleAssignTicket}
          onEdit={handleEditTicket} // This will trigger direct edit
          selectedTickets={selectedTickets}
          onSelectionChange={setSelectedTickets}
        />
      </Card>

      {/* Create Ticket Form */}
      <TicketForm
        mode="create"
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleTicketFormSuccess}
      />

      {/* Edit Ticket Form - UPDATED: Uses new TicketForm without autosave */}
      {selectedTicketForEdit && (
        <TicketForm
          ticket={selectedTicketForEdit}
          mode="edit"
          open={!!selectedTicketForEdit}
          onOpenChange={(open) => !open && setSelectedTicketForEdit(null)}
          onSuccess={handleTicketFormSuccess}
        />
      )}
    </div>
  );
}
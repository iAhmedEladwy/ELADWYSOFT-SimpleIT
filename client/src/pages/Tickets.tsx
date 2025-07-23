import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import TicketsTable from '@/components/tickets/TicketsTable';
import EnhancedTicketTable from '@/components/tickets/EnhancedTicketTable';
import TicketForm from '@/components/tickets/TicketForm';

import TicketFilters from '@/components/tickets/TicketFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Settings, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import type { TicketFilters as TicketFiltersType } from '@shared/types';

export default function Tickets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState<TicketFiltersType>({});
  const [editTicket, setEditTicket] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  
  // Listen for the FAB create ticket event
  useEffect(() => {
    const handleFabAddTicket = () => {
      setOpenDialog(true);
    };
    
    // Register event listener
    window.addEventListener('fab:add-ticket', handleFabAddTicket);
    
    // Check if URL has action=new parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      handleFabAddTicket();
      // Clean up the URL to prevent dialog from reopening on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Clean up
    return () => {
      window.removeEventListener('fab:add-ticket', handleFabAddTicket);
    };
  }, []);

  // Translations
  const translations = {
    title: language === 'English' ? 'Support Tickets' : 'تذاكر الدعم',
    description: language === 'English' 
      ? 'Track and manage support requests' 
      : 'تتبع وإدارة طلبات الدعم',
    allTickets: language === 'English' ? 'All Tickets' : 'جميع التذاكر',
    open: language === 'English' ? 'Open' : 'مفتوح',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    resolved: language === 'English' ? 'Resolved' : 'تم الحل',
    closed: language === 'English' ? 'Closed' : 'مغلق',
    myTickets: language === 'English' ? 'My Tickets' : 'تذاكري',
    createTicket: language === 'English' ? 'Create Ticket' : 'إنشاء تذكرة',
    refresh: language === 'English' ? 'Refresh' : 'تحديث',
    search: language === 'English' ? 'Search...' : 'بحث...',
    ticketCreated: language === 'English' ? 'Ticket created successfully' : 'تم إنشاء التذكرة بنجاح',
    ticketUpdated: language === 'English' ? 'Ticket updated successfully' : 'تم تحديث التذكرة بنجاح',
    assignTicket: language === 'English' ? 'Assign Ticket' : 'تعيين التذكرة',
    ticketAssigned: language === 'English' ? 'Ticket assigned successfully' : 'تم تعيين التذكرة بنجاح',
    error: language === 'English' ? 'An error occurred' : 'حدث خطأ',
  };

  // Fetch tickets
  const { 
    data: tickets = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/tickets'],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch employees for submitter dropdown
  const { 
    data: employees = [], 
    isLoading: employeesLoading
  } = useQuery({
    queryKey: ['/api/employees'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch assets for related asset dropdown
  const { 
    data: assets = [], 
    isLoading: assetsLoading
  } = useQuery({
    queryKey: ['/api/assets'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch users for assignee dropdown
  const { 
    data: users = [], 
    isLoading: usersLoading
  } = useQuery({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: hasAccess(2), // Only fetch if user has manager access
  });

  // Create ticket mutation using standard API
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      console.log('Creating ticket with data:', ticketData);
      
      // Ensure data format is correct for backend
      const formattedData = {
        submittedById: Number(ticketData.submittedById),
        assignedToId: ticketData.assignedToId ? Number(ticketData.assignedToId) : null,
        relatedAssetId: ticketData.relatedAssetId ? Number(ticketData.relatedAssetId) : null,
        requestType: String(ticketData.requestType), // Ensure it's a string, not enum
        priority: String(ticketData.priority),
        status: 'Open', // Always start as Open for new tickets
        summary: String(ticketData.summary),
        description: String(ticketData.description),
        dueDate: ticketData.dueDate ? new Date(ticketData.dueDate).toISOString() : null,
        slaTarget: ticketData.slaTarget ? Number(ticketData.slaTarget) : null,
      };
      
      console.log('Formatted ticket data:', formattedData);
      const response = await apiRequest('/api/tickets', 'POST', formattedData);
      return response;
    },
    onSuccess: (data) => {
      console.log("Ticket created successfully:", data);
      // Force a complete refetch of the tickets
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.refetchQueries({ queryKey: ['/api/tickets'] });
      
      toast({
        title: translations.ticketCreated,
        description: `Ticket ${data.ticketId || data.ticket_id} created successfully`,
      });
      setOpenDialog(false);
      
      // Force reload after a short delay to ensure UI updates
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/tickets'] });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update ticket status mutation
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNotes }: { id: number; status: string; resolutionNotes?: string }) => {
      const res = await apiRequest('POST', `/api/tickets/${id}/status`, { status, resolutionNotes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: translations.ticketUpdated,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Assign ticket mutation
  const assignTicketMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: number; userId: number }) => {
      const res = await apiRequest('POST', `/api/tickets/${id}/assign`, { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: translations.ticketAssigned,
      });
    },
    onError: (error: any) => {
      toast({
        title: translations.error,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateTicket = (ticketData: any) => {
    console.log("Creating ticket with data:", ticketData);
    // Ensure all data is properly formatted for the server
    const formattedData = {
      ...ticketData,
      submittedById: String(ticketData.submittedById),
      relatedAssetId: ticketData.relatedAssetId ? String(ticketData.relatedAssetId) : undefined
    };
    createTicketMutation.mutate(formattedData);
  };

  const handleStatusChange = (ticketId: number, status: string, resolutionNotes?: string) => {
    updateTicketStatusMutation.mutate({ id: ticketId, status, resolutionNotes });
  };

  const handleAssignTicket = (ticketId: number, userId: number) => {
    assignTicketMutation.mutate({ id: ticketId, userId });
  };

  // Filter tickets based on filters
  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    
    return tickets.filter((ticket: any) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchFields = [
          ticket.ticketId,
          ticket.summary,
          ticket.description,
          ticket.requestType,
          ticket.priority,
          ticket.status
        ].filter(Boolean);
        
        if (!searchFields.some(field => 
          field?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && ticket.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && ticket.priority !== filters.priority) {
        return false;
      }
      
      // Request type filter  
      if (filters.requestType && ticket.requestType !== filters.requestType) {
        return false;
      }
      
      // Assigned filter
      if (filters.assignedTo) {
        if (filters.assignedTo === 'unassigned') {
          if (ticket.assignedToId) return false;
        } else if (filters.assignedTo === 'me') {
          if (ticket.assignedToId !== user?.id) return false;
        } else {
          if (ticket.assignedToId?.toString() !== filters.assignedTo) return false;
        }
      }
      
      return true;
    });
  }, [tickets, filters, user]);

  // Enhanced export mutation with all fields
  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const response = await apiRequest(`/api/tickets/export?format=${format}`, 'GET');
      
      const filename = `tickets_export_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'csv') {
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    },
    onSuccess: () => {
      toast({
        title: language === 'English' ? 'Success' : 'تم بنجاح',
        description: language === 'English' ? 'Tickets exported successfully with all fields' : 'تم تصدير التذاكر بنجاح مع جميع الحقول',
      });
    },
    onError: () => {
      toast({
        title: language === 'English' ? 'Error' : 'خطأ',
        description: language === 'English' ? 'Failed to export tickets' : 'فشل في تصدير التذاكر',
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{translations.title}</h1>
          <p className="text-gray-600">{translations.description}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {translations.refresh}
          </Button>
          
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {translations.createTicket}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">

              <TicketForm
                mode="create"
                onCancel={() => setOpenDialog(false)}
                onSuccess={() => {
                  setOpenDialog(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter & Search Tickets Section */}
      <div className="mb-6">
        <TicketFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={Array.isArray(tickets) ? tickets.length : 0}
          filteredCount={Array.isArray(filteredTickets) ? filteredTickets.length : 0}
          onExport={() => exportMutation.mutate('csv')}
        />
      </div>

      {/* Main Tickets Table */}
      <EnhancedTicketTable 
        tickets={Array.isArray(filteredTickets) ? filteredTickets : []} 
        employees={Array.isArray(employees) ? employees : []}
        assets={Array.isArray(assets) ? assets : []}
        users={Array.isArray(users) ? users : []}
        isLoading={isLoading}
        onTicketEdit={(ticket) => {
          console.log('Edit ticket:', ticket);
          setEditTicket(ticket);
          setOpenEditDialog(true);
        }}
      />



      {/* Edit Ticket Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
          <TicketForm
            ticket={editTicket}
            mode="edit"
            onCancel={() => {
              setOpenEditDialog(false);
              setEditTicket(null);
            }}
            onSuccess={() => {
              setOpenEditDialog(false);
              setEditTicket(null);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

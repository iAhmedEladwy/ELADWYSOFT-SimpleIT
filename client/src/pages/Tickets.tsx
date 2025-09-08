import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import TicketsTable from '@/components/tickets/TicketsTable';
import TicketForm from '@/components/tickets/TicketForm';

import TicketFilters from '@/components/tickets/TicketFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Settings, Zap, Edit3, Download, Trash2, UserCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TicketFilters as TicketFiltersType } from '@shared/types';

export default function Tickets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState<TicketFiltersType>({});
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Bulk actions state
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const isInitialMount = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  
  
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
    bulkActions: language === 'English' ? 'Bulk Actions' : 'إجراءات مجمعة',
    selectAll: language === 'English' ? 'Select All' : 'تحديد الكل',
    deselectAll: language === 'English' ? 'Deselect All' : 'إلغاء تحديد الكل',
    changeStatus: language === 'English' ? 'Change Status' : 'تغيير الحالة',
    assignTo: language === 'English' ? 'Assign To' : 'تعيين إلى',
    deleteSelected: language === 'English' ? 'Delete Selected' : 'حذف المحدد',
    success: language === 'English' ? 'Success' : 'نجح',
    noTicketsSelected: language === 'English' ? 'No tickets selected' : 'لم يتم تحديد تذاكر',
    openTickets: language === 'English' ? 'Open Tickets' : 'التذاكر المفتوحة',
    all: language === 'English' ? 'All' : 'الكل',
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

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Read filters from URL
    const statusParam = params.get('statusFilter');
    const priorityParam = params.get('priorityFilter');
    const assignedToParam = params.get('assignedTo');
    const searchParam = params.get('search');
    const requestTypeParam = params.get('requestType');

    // Build initial filters object from URL
    const initialFilters: any = {};
    
    if (statusParam) initialFilters.status = statusParam;
    if (priorityParam) initialFilters.priority = priorityParam;
    if (assignedToParam) initialFilters.assignedTo = assignedToParam;
    if (searchParam) initialFilters.search = searchParam;
    if (requestTypeParam) initialFilters.requestType = requestTypeParam;

    // Only update if we have filters from URL
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }

    // Mark that initial mount is complete
    isInitialMount.current = false;
  }, []); // Only run on mount

  // ===== ADD THIS CALLBACK FUNCTION HERE =====
  // Function to update URL when filters change
  const updateURL = useCallback(() => {
    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce URL updates (500ms)
    updateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      // Add parameters
      if (filters.status) {
        params.set('statusFilter', filters.status);
      }
      if (filters.priority) {
        params.set('priorityFilter', filters.priority);
      }
      if (filters.assignedTo) {
        params.set('assignedTo', filters.assignedTo);
      }
      if (filters.search) {
        params.set('search', filters.search);
      }
      if (filters.requestType) {
        params.set('requestType', filters.requestType);
      }

      // Construct the new URL
      const newSearch = params.toString();
      const newPath = newSearch ? `/tickets?${newSearch}` : '/tickets';

      // Update the URL without triggering a re-render
      if (window.location.pathname + window.location.search !== newPath) {
        window.history.replaceState({}, '', newPath);
      }
    }, 500);
  }, [filters]);

  // Update URL whenever filters change (but not on initial mount)
  useEffect(() => {
    if (!isInitialMount.current) {
      updateURL();
    }
  }, [filters, updateURL]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
 

  // Calculate statistics
const openTicketsCount = useMemo(() => {
  return Array.isArray(tickets) ? tickets.filter(t => t.status === 'Open').length : 0;
}, [tickets]);

const allTicketsCount = useMemo(() => {
  return Array.isArray(tickets) ? tickets.length : 0;
}, [tickets]);

const myTicketsCount = useMemo(() => {
  if (!user || !Array.isArray(tickets)) return 0;
  return tickets.filter(t => t.assignedToId === user.id).length;
}, [tickets, user]);

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

  // Bulk action handlers
  const handleSelectAllTickets = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map((ticket: any) => ticket.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTickets.length === 0) return;
    
    try {
      await Promise.all(
        selectedTickets.map(id => 
          apiRequest(`/api/tickets/${id}`, 'PUT', { status: newStatus })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: `${selectedTickets.length} tickets status updated to ${newStatus}`,
      });
      setSelectedTickets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAssign = async (userId: number) => {
    if (selectedTickets.length === 0) return;
    
    try {
      await Promise.all(
        selectedTickets.map(id => 
          apiRequest(`/api/tickets/${id}`, 'PUT', { assignedToId: userId })
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: `${selectedTickets.length} tickets assigned successfully`,
      });
      setSelectedTickets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to assign tickets',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTickets.length} tickets? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await Promise.all(
        selectedTickets.map(id => 
          apiRequest(`/api/tickets/${id}`, 'DELETE')
        )
      );
      
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: `${selectedTickets.length} tickets deleted successfully`,
      });
      setSelectedTickets([]);
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: translations.error,
        description: 'Failed to delete tickets',
        variant: 'destructive',
      });
    }
  };

  // Show bulk actions when tickets are selected
  useEffect(() => {
    setShowBulkActions(selectedTickets.length > 0);
  }, [selectedTickets]);

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

  // Enhanced export  with all fields
      const handleExport = () => {
      if (!Array.isArray(filteredTickets) || filteredTickets.length === 0) {
        toast({
          title: language === 'English' ? 'No data to export' : 'لا توجد بيانات للتصدير',
          variant: 'destructive',
        });
        return;
      }

      // Prepare CSV data
      const csvData = filteredTickets.map(ticket => ({
        'Ticket ID': ticket.ticketId,
        'Summary': ticket.summary || ticket.description.substring(0, 50),
        'Status': ticket.status,
        'Priority': ticket.priority,
        'Type': ticket.requestType,
        'Submitted By': employees?.find(e => e.id === ticket.submittedById)?.name || 'Unknown',
        'Assigned To': users?.find(u => u.id === ticket.assignedToId)?.username || 'Unassigned',
        'Due Date': ticket.dueDate ? format(new Date(ticket.dueDate), 'MM/dd/yyyy') : '',
        'Created': format(new Date(ticket.createdAt), 'MM/dd/yyyy HH:mm'),
      }));

      // Convert to CSV string
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            return typeof value === 'string' && value.includes(',') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download the CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tickets_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: language === 'English' ? 'Export successful' : 'تم التصدير بنجاح',
        description: language === 'English' 
          ? `Exported ${csvData.length} tickets` 
          : `تم تصدير ${csvData.length} تذكرة`,
      });
    };

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
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            {language === 'English' ? 'Export' : 'تصدير'}
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
                onSubmit={handleCreateTicket}
                onCancel={() => setOpenDialog(false)}
                isSubmitting={createTicketMutation.isPending}
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
          tickets={tickets}
        />
      </div>

      {/* Bulk Actions Section */}
      {showBulkActions && hasAccess(2) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-700">
                {selectedTickets.length} {language === 'English' ? 'tickets selected' : 'تذاكر محددة'}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllTickets}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <Checkbox 
                  checked={selectedTickets.length === filteredTickets.length}
                  onChange={() => {}}
                  className="mr-2"
                />
                {selectedTickets.length === filteredTickets.length ? translations.deselectAll : translations.selectAll}
              </Button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Change Status */}
              <Select onValueChange={handleBulkStatusChange}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder={translations.changeStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">{translations.open}</SelectItem>
                  <SelectItem value="In Progress">{translations.inProgress}</SelectItem>
                  <SelectItem value="Resolved">{translations.resolved}</SelectItem>
                  <SelectItem value="Closed">{translations.closed}</SelectItem>
                </SelectContent>
              </Select>

              {/* Assign To */}
              <Select onValueChange={(value) => handleBulkAssign(parseInt(value))}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder={translations.assignTo} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(users) && users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Delete Selected */}
              {hasAccess(3) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="h-8"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {translations.deleteSelected}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

       {/* Statistics Bar */}
       <div className="mb-6 bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-8 bg-blue-500 rounded"></div>
            <div>
              <span className="text-sm text-gray-600">{translations.openTickets}</span>
              <span className="ml-2 font-semibold text-lg">{openTicketsCount}</span>
            </div>
          </div>
          
          <div className="text-gray-300">|</div>
          
          <div className="flex items-center space-x-2">
            <div>
              <span className="text-sm text-gray-600">{translations.all}:</span>
              <span className="ml-2 font-semibold text-lg">{allTicketsCount}</span>
            </div>
          </div>
          
          <div className="text-gray-300">|</div>
          
          <div className="flex items-center space-x-2">
            <div>
              <span className="text-sm text-gray-600">{translations.myTickets}:</span>
              <span className="ml-2 font-semibold text-lg">{myTicketsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tickets Table */}
      <Card>
        <TicketsTable 
          tickets={Array.isArray(filteredTickets) ? filteredTickets : []} 
          employees={Array.isArray(employees) ? employees : []}
          assets={Array.isArray(assets) ? assets : []}
          users={Array.isArray(users) ? users : []}
          onStatusChange={handleStatusChange}
          onAssign={handleAssignTicket}
          onEdit={(ticket) => setSelectedTicket(ticket)}
          selectedTickets={selectedTickets}
          onSelectionChange={setSelectedTickets}
        />
      </Card>



      {/* Edit Ticket Dialog */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="max-w-5xl h-[95vh] overflow-hidden p-0">
            <DialogHeader className="px-6 pt-6 pb-2 border-b">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-green-500" />
                Edit Ticket #{selectedTicket?.ticketId}
                <div id="autosave-indicator" className="ml-auto"></div>
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 h-[calc(95vh-80px)] overflow-y-auto">
              <TicketForm
                ticket={selectedTicket}
                mode="edit"
                onCancel={() => setSelectedTicket(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

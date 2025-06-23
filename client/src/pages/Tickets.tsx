import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import TicketsTable from '@/components/tickets/TicketsTable';
import EnhancedTicketTable from '@/components/tickets/EnhancedTicketTable';
import UnifiedTicketForm from '@/components/tickets/UnifiedTicketForm';
import InlineEditTicketForm from '@/components/tickets/InlineEditTicketForm';
import ConsolidatedTicketForm from '@/components/tickets/ConsolidatedTicketForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Settings, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export default function Tickets() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [useInlineEditing, setUseInlineEditing] = useState(true); // Enable inline editing by default
  
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
      const response = await apiRequest('POST', '/api/tickets', formattedData);
      return response.json();
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

  // Filter tickets based on search query, user filter, and status filter
  const finalFilteredTickets = tickets.filter((ticket: any) => {
    // Search filter
    const searchString = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || (
      ticket.ticketId?.toLowerCase().includes(searchString) ||
      ticket.description?.toLowerCase().includes(searchString) ||
      ticket.summary?.toLowerCase().includes(searchString) ||
      ticket.requestType?.toLowerCase().includes(searchString) ||
      ticket.priority?.toLowerCase().includes(searchString) ||
      ticket.status?.toLowerCase().includes(searchString)
    );

    // User filter
    const matchesUser = userFilter === 'all' || 
      ticket.assignedToId === parseInt(userFilter) || 
      (ticket.submittedById && employees.find((emp: any) => emp.id === ticket.submittedById)?.userId === parseInt(userFilter));

    // Status filter
    const matchesStatus = statusFilter === 'all' || 
      ticket.status === statusFilter ||
      (statusFilter === 'active' && (ticket.status === 'Open' || ticket.status === 'In Progress'));

    return matchesSearch && matchesUser && matchesStatus;
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="ticket-form-description">
              <DialogHeader>
                <DialogTitle>{translations.createTicket}</DialogTitle>
                <DialogDescription id="ticket-form-description">
                  {language === 'English' 
                    ? 'Fill out the form below to create a new support ticket'
                    : 'املأ النموذج أدناه لإنشاء تذكرة دعم جديدة'}
                </DialogDescription>
              </DialogHeader>
              
              <UnifiedTicketForm
                mode="create"
                onSubmit={handleCreateTicket}
                onCancel={() => setOpenDialog(false)}
                isSubmitting={createTicketMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder={translations.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* User Filter and Status Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'English' ? 'Filter by User' : 'تصفية حسب المستخدم'}
          </label>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'English' ? 'All Users' : 'جميع المستخدمين'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'English' ? 'All Users' : 'جميع المستخدمين'}</SelectItem>
              {users?.map(u => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.firstName && u.lastName 
                    ? `${u.firstName} ${u.lastName}` 
                    : u.username}
                  {u.id === user?.id && (
                    <span className="ml-2 text-xs text-blue-600 font-medium">
                      ({language === 'English' ? 'Current' : 'الحالي'})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'English' ? 'Filter by Status' : 'تصفية حسب الحالة'}
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={language === 'English' ? 'All Statuses' : 'جميع الحالات'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'English' ? 'All Statuses' : 'جميع الحالات'}</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="active">{language === 'English' ? 'Active (Open/In Progress)' : 'النشطة (مفتوحة/قيد التنفيذ)'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            {language === 'English' ? 'Interface Mode' : 'وضع الواجهة'}
          </label>
          <Button
            variant={useInlineEditing ? "default" : "outline"}
            onClick={() => setUseInlineEditing(!useInlineEditing)}
            className="w-full mb-2"
          >
            {useInlineEditing 
              ? (language === 'English' ? 'Inline Editing ON' : 'التحرير المباشر مفعل')
              : (language === 'English' ? 'Standard Form' : 'النموذج القياسي')
            }
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setUserFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="w-full"
          >
            {language === 'English' ? 'Clear Filters' : 'مسح المرشحات'}
          </Button>
        </div>
      </div>

      <EnhancedTicketTable 
        tickets={finalFilteredTickets}
        employees={employees}
        assets={assets}
        users={users}
        isLoading={isLoading}
        useInlineEditing={useInlineEditing}
        onTicketSelect={setSelectedTicket}
      />

      {/* Ticket Detail Forms */}
      {selectedTicket && (
        useInlineEditing ? (
          <InlineEditTicketForm
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            employees={employees || []}
            assets={assets || []}
            users={users || []}
            onTicketUpdate={(updatedTicket) => {
              queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
              setSelectedTicket(null);
            }}
          />
        ) : (
          <ConsolidatedTicketForm
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            employees={employees || []}
            assets={assets || []}
            users={users || []}
            onTicketUpdate={(updatedTicket) => {
              queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
              setSelectedTicket(null);
            }}
          />
        )
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translations.createTicket}</DialogTitle>
            <DialogDescription>
              {language === 'English' 
                ? 'Create a new support ticket'
                : 'إنشاء تذكرة دعم جديدة'
              }
            </DialogDescription>
          </DialogHeader>
          <UnifiedTicketForm
            mode="create"
            onSubmit={handleCreateTicket}
            onCancel={() => setOpenDialog(false)}
            isSubmitting={createTicketMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

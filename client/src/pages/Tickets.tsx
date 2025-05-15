import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/authContext';
import TicketsTable from '@/components/tickets/TicketsTable';
import TicketForm from '@/components/tickets/TicketForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const res = await apiRequest('POST', '/api/tickets', ticketData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: translations.ticketCreated,
      });
      setOpenDialog(false);
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
    createTicketMutation.mutate(ticketData);
  };

  const handleStatusChange = (ticketId: number, status: string, resolutionNotes?: string) => {
    updateTicketStatusMutation.mutate({ id: ticketId, status, resolutionNotes });
  };

  const handleAssignTicket = (ticketId: number, userId: number) => {
    assignTicketMutation.mutate({ id: ticketId, userId });
  };

  // Filter tickets based on search query
  const filteredTickets = tickets.filter((ticket: any) => {
    const searchString = searchQuery.toLowerCase();
    return (
      ticket.ticketId?.toLowerCase().includes(searchString) ||
      ticket.description?.toLowerCase().includes(searchString) ||
      ticket.category?.toLowerCase().includes(searchString) ||
      ticket.priority?.toLowerCase().includes(searchString) ||
      ticket.status?.toLowerCase().includes(searchString)
    );
  });

  // Filter tickets by status
  const openTickets = filteredTickets.filter((ticket: any) => ticket.status === 'Open');
  const inProgressTickets = filteredTickets.filter((ticket: any) => ticket.status === 'In Progress');
  const resolvedTickets = filteredTickets.filter((ticket: any) => ticket.status === 'Resolved');
  const closedTickets = filteredTickets.filter((ticket: any) => ticket.status === 'Closed');
  
  // Filter tickets assigned to current user
  const myTickets = filteredTickets.filter((ticket: any) => 
    ticket.assignedToId === user?.id || 
    (ticket.submittedById && employees.find((emp: any) => emp.id === ticket.submittedById)?.userId === user?.id)
  );

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
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{translations.createTicket}</DialogTitle>
              </DialogHeader>
              <TicketForm
                onSubmit={handleCreateTicket}
                isSubmitting={createTicketMutation.isPending}
                employees={employees}
                assets={assets}
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

      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{translations.allTickets}</TabsTrigger>
          <TabsTrigger value="open">{translations.open}</TabsTrigger>
          <TabsTrigger value="inprogress">{translations.inProgress}</TabsTrigger>
          <TabsTrigger value="resolved">{translations.resolved}</TabsTrigger>
          <TabsTrigger value="closed">{translations.closed}</TabsTrigger>
          <TabsTrigger value="mytickets">{translations.myTickets}</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <TicketsTable 
              tickets={filteredTickets}
              employees={employees}
              assets={assets}
              users={users}
              onStatusChange={handleStatusChange}
              onAssign={handleAssignTicket}
            />
          )}
        </TabsContent>

        <TabsContent value="open">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <TicketsTable 
              tickets={openTickets}
              employees={employees}
              assets={assets}
              users={users}
              onStatusChange={handleStatusChange}
              onAssign={handleAssignTicket}
            />
          )}
        </TabsContent>

        <TabsContent value="inprogress">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <TicketsTable 
              tickets={inProgressTickets}
              employees={employees}
              assets={assets}
              users={users}
              onStatusChange={handleStatusChange}
              onAssign={handleAssignTicket}
            />
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <TicketsTable 
              tickets={resolvedTickets}
              employees={employees}
              assets={assets}
              users={users}
              onStatusChange={handleStatusChange}
              onAssign={handleAssignTicket}
            />
          )}
        </TabsContent>

        <TabsContent value="closed">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <TicketsTable 
              tickets={closedTickets}
              employees={employees}
              assets={assets}
              users={users}
              onStatusChange={handleStatusChange}
              onAssign={handleAssignTicket}
            />
          )}
        </TabsContent>

        <TabsContent value="mytickets">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <TicketsTable 
              tickets={myTickets}
              employees={employees}
              assets={assets}
              users={users}
              onStatusChange={handleStatusChange}
              onAssign={handleAssignTicket}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

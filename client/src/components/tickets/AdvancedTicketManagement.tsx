import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  MessageSquare, 
  FileText, 
  Users, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Timer,
  History,
  Bell,
  Paperclip,
  Lock,
  Unlock,
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";

interface TicketWithDetails {
  id: number;
  ticketId: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  requestType: string;
  submittedById: number;
  assignedToId?: number;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  categoryId?: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  submittedBy?: { firstName: string; lastName: string; department: string };
  assignedTo?: { firstName: string; lastName: string };
  category?: { name: string; color: string; slaHours: number };
  comments?: TicketComment[];
  history?: TicketHistory[];
  attachments?: string[];
}

interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  content: string;
  isPrivate: boolean;
  attachments?: string[];
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

interface TicketHistory {
  id: number;
  ticketId: number;
  userId: number;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

interface TicketCategory {
  id: number;
  name: string;
  description?: string;
  color: string;
  slaHours: number;
  isActive: boolean;
}

export default function AdvancedTicketManagement() {
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPrivateComment, setIsPrivateComment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [timeEntry, setTimeEntry] = useState({ hours: 0, description: "" });
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedTicketsForMerge, setSelectedTicketsForMerge] = useState<number[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickets with enhanced data
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets/enhanced"],
  });

  // Fetch ticket categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/tickets/categories"],
  });

  // Fetch custom request types
  const { data: requestTypes = [] } = useQuery({
    queryKey: ["/api/custom-request-types"],
  });

  // Enhanced ticket update mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/enhanced"] });
      toast({ title: "Ticket updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating ticket", description: error.message, variant: "destructive" });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      return apiRequest("/api/tickets/comments", {
        method: "POST",
        body: JSON.stringify(commentData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/enhanced"] });
      setCommentText("");
      setShowCommentDialog(false);
      toast({ title: "Comment added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding comment", description: error.message, variant: "destructive" });
    },
  });

  // Time tracking mutation
  const addTimeEntryMutation = useMutation({
    mutationFn: async ({ ticketId, hours, description }: { ticketId: number; hours: number; description: string }) => {
      return apiRequest(`/api/tickets/${ticketId}/time`, {
        method: "POST",
        body: JSON.stringify({ hours, description }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/enhanced"] });
      setTimeEntry({ hours: 0, description: "" });
      setShowTimeTracker(false);
      toast({ title: "Time entry added successfully" });
    },
    onError: (error) => {
      toast({ title: "Error adding time entry", description: error.message, variant: "destructive" });
    },
  });

  // Category management mutation
  const categoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return apiRequest("/api/tickets/categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/categories"] });
      setShowCategoryDialog(false);
      toast({ title: "Category created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error creating category", description: error.message, variant: "destructive" });
    },
  });

  // Merge tickets mutation
  const mergeTicketsMutation = useMutation({
    mutationFn: async ({ primaryTicketId, secondaryTicketIds }: { primaryTicketId: number; secondaryTicketIds: number[] }) => {
      return apiRequest("/api/tickets/merge", {
        method: "POST",
        body: JSON.stringify({ primaryTicketId, secondaryTicketIds }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/enhanced"] });
      setMergeMode(false);
      setSelectedTicketsForMerge([]);
      toast({ title: "Tickets merged successfully" });
    },
    onError: (error) => {
      toast({ title: "Error merging tickets", description: error.message, variant: "destructive" });
    },
  });

  // Delete ticket mutation (admin only)
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return apiRequest(`/api/tickets/${ticketId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/enhanced"] });
      setSelectedTicket(null);
      toast({ title: "Ticket deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting ticket", description: error.message, variant: "destructive" });
    },
  });

  // Filter tickets
  const filteredTickets = tickets.filter((ticket: TicketWithDetails) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate SLA status
  const getSLAStatus = (ticket: TicketWithDetails) => {
    if (!ticket.dueDate || !ticket.category) return "on-time";
    
    const now = new Date();
    const dueDate = new Date(ticket.dueDate);
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue < 0) return "overdue";
    if (hoursUntilDue < ticket.category.slaHours * 0.2) return "at-risk";
    return "on-time";
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-orange-100 text-orange-800";
      case "Resolved": return "bg-green-100 text-green-800";
      case "Closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({
      id: ticketId,
      data: { status: newStatus }
    });
  };

  const handleAddComment = () => {
    if (!selectedTicket || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      ticketId: selectedTicket.id,
      content: commentText,
      isPrivate: isPrivateComment,
    });
  };

  const handleTimeEntry = () => {
    if (!selectedTicket || timeEntry.hours <= 0) return;
    
    addTimeEntryMutation.mutate({
      ticketId: selectedTicket.id,
      hours: timeEntry.hours,
      description: timeEntry.description,
    });
  };

  const handleMergeTickets = () => {
    if (selectedTicketsForMerge.length < 2) return;
    
    const primaryTicketId = selectedTicketsForMerge[0];
    const secondaryTicketIds = selectedTicketsForMerge.slice(1);
    
    mergeTicketsMutation.mutate({ primaryTicketId, secondaryTicketIds });
  };

  const handleTicketSelection = (ticketId: number) => {
    if (mergeMode) {
      setSelectedTicketsForMerge(prev => 
        prev.includes(ticketId) 
          ? prev.filter(id => id !== ticketId)
          : [...prev, ticketId]
      );
    } else {
      const ticket = tickets.find((t: TicketWithDetails) => t.id === ticketId);
      setSelectedTicket(ticket || null);
    }
  };

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant={mergeMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => setMergeMode(!mergeMode)}
          >
            {mergeMode ? "Cancel Merge" : "Merge Mode"}
          </Button>
          
          {mergeMode && selectedTicketsForMerge.length >= 2 && (
            <Button size="sm" onClick={handleMergeTickets}>
              Merge {selectedTicketsForMerge.length} Tickets
            </Button>
          )}

          <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>Add a new ticket category with SLA settings</DialogDescription>
              </DialogHeader>
              <CategoryForm onSubmit={categoryMutation.mutate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tickets ({filteredTickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredTickets.map((ticket: TicketWithDetails) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      isSelected={selectedTicket?.id === ticket.id}
                      isMergeSelected={selectedTicketsForMerge.includes(ticket.id)}
                      mergeMode={mergeMode}
                      onClick={() => handleTicketSelection(ticket.id)}
                      onStatusChange={handleStatusChange}
                      onDelete={deleteTicketMutation.mutate}
                      getSLAStatus={getSLAStatus}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                  {filteredTickets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No tickets found matching your criteria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details */}
        <div>
          {selectedTicket ? (
            <TicketDetailsPanel
              ticket={selectedTicket}
              onAddComment={() => setShowCommentDialog(true)}
              onShowTimeTracker={() => setShowTimeTracker(true)}
              categories={categories}
              requestTypes={requestTypes}
              updateTicket={updateTicketMutation.mutate}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a ticket to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>Add a comment to ticket #{selectedTicket?.ticketId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivateComment}
                onChange={(e) => setIsPrivateComment(e.target.checked)}
              />
              <Label htmlFor="private" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private note (staff only)
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                Add Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Tracker Dialog */}
      <Dialog open={showTimeTracker} onOpenChange={setShowTimeTracker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
            <DialogDescription>Add time entry for ticket #{selectedTicket?.ticketId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="hours">Hours Worked</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0"
                value={timeEntry.hours}
                onChange={(e) => setTimeEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="description">Work Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the work performed..."
                value={timeEntry.description}
                onChange={(e) => setTimeEntry(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTimeTracker(false)}>
                Cancel
              </Button>
              <Button onClick={handleTimeEntry} disabled={timeEntry.hours <= 0}>
                Log Time
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Ticket Card Component
function TicketCard({ 
  ticket, 
  isSelected, 
  isMergeSelected, 
  mergeMode, 
  onClick, 
  onStatusChange, 
  onDelete,
  getSLAStatus,
  getPriorityColor,
  getStatusColor 
}: {
  ticket: TicketWithDetails;
  isSelected: boolean;
  isMergeSelected: boolean;
  mergeMode: boolean;
  onClick: () => void;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  getSLAStatus: (ticket: TicketWithDetails) => string;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}) {
  const slaStatus = getSLAStatus(ticket);
  
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      } ${isMergeSelected ? "ring-2 ring-orange-500" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm text-blue-600">#{ticket.ticketId}</span>
            <Badge className={getPriorityColor(ticket.priority)}>
              {ticket.priority}
            </Badge>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status}
            </Badge>
            {slaStatus === "overdue" && (
              <Badge className="bg-red-100 text-red-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            {slaStatus === "at-risk" && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                At Risk
              </Badge>
            )}
          </div>
          
          <h3 className="font-medium text-gray-900 mb-1">{ticket.title}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>By: {ticket.submittedBy?.firstName} {ticket.submittedBy?.lastName}</span>
            {ticket.assignedTo && (
              <span>Assigned: {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
            )}
            <span>{format(new Date(ticket.createdAt), "MMM dd, yyyy")}</span>
            {ticket.comments && ticket.comments.length > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {ticket.comments.length}
              </span>
            )}
          </div>

          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {ticket.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Tag className="h-2 w-2 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {!mergeMode && (
          <div className="flex items-center gap-1">
            <Select value={ticket.status} onValueChange={(value) => onStatusChange(ticket.id, value)}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ticket.id);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Ticket Details Panel Component
function TicketDetailsPanel({ 
  ticket, 
  onAddComment, 
  onShowTimeTracker,
  categories,
  requestTypes,
  updateTicket 
}: {
  ticket: TicketWithDetails;
  onAddComment: () => void;
  onShowTimeTracker: () => void;
  categories: TicketCategory[];
  requestTypes: any[];
  updateTicket: (data: { id: number; data: any }) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">#{ticket.ticketId}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onAddComment}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment
            </Button>
            <Button size="sm" variant="outline" onClick={onShowTimeTracker}>
              <Timer className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="time">Time</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">{ticket.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge className={`ml-2 ${ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' : 
                  ticket.status === 'In Progress' ? 'bg-orange-100 text-orange-800' :
                  ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'}`}>
                  {ticket.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Priority:</span>
                <Badge className={`ml-2 ${ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                  ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}`}>
                  {ticket.priority}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Submitted by:</span>
                <span className="ml-2">{ticket.submittedBy?.firstName} {ticket.submittedBy?.lastName}</span>
              </div>
              {ticket.assignedTo && (
                <div>
                  <span className="font-medium">Assigned to:</span>
                  <span className="ml-2">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">{format(new Date(ticket.createdAt), "MMM dd, yyyy HH:mm")}</span>
              </div>
              {ticket.dueDate && (
                <div>
                  <span className="font-medium">Due:</span>
                  <span className="ml-2">{format(new Date(ticket.dueDate), "MMM dd, yyyy HH:mm")}</span>
                </div>
              )}
            </div>

            {ticket.category && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: ticket.category.color }}
                  />
                  <span className="font-medium">{ticket.category.name}</span>
                  <Badge variant="outline">SLA: {ticket.category.slaHours}h</Badge>
                </div>
              </div>
            )}

            {ticket.tags && ticket.tags.length > 0 && (
              <div>
                <span className="font-medium text-sm">Tags:</span>
                <div className="flex gap-1 mt-1">
                  {ticket.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <ScrollArea className="h-64">
              {ticket.comments && ticket.comments.length > 0 ? (
                <div className="space-y-3">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </span>
                          {comment.isPrivate && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-2 w-2 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 flex gap-1">
                          {comment.attachments.map((attachment, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Paperclip className="h-2 w-2 mr-1" />
                              {attachment}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No comments yet</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-64">
              {ticket.history && ticket.history.length > 0 ? (
                <div className="space-y-3">
                  {ticket.history.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-blue-200 pl-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {entry.user?.firstName} {entry.user?.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(entry.createdAt), "MMM dd, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.action}</p>
                      {entry.fieldChanged && (
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.fieldChanged}: {entry.oldValue} → {entry.newValue}
                        </div>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No history available</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Estimated Hours:</span>
                <span className="ml-2">{ticket.estimatedHours || "Not set"}</span>
              </div>
              <div>
                <span className="font-medium">Actual Hours:</span>
                <span className="ml-2">{ticket.actualHours || "0"}</span>
              </div>
            </div>
            
            {ticket.estimatedHours && ticket.actualHours && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Progress</span>
                  <span className="text-sm">
                    {Math.round((ticket.actualHours / ticket.estimatedHours) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((ticket.actualHours / ticket.estimatedHours) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Category Form Component
function CategoryForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    slaHours: 24,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="color">Color</Label>
        <Input
          id="color"
          type="color"
          value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="slaHours">SLA Hours</Label>
        <Input
          id="slaHours"
          type="number"
          min="1"
          value={formData.slaHours}
          onChange={(e) => setFormData(prev => ({ ...prev, slaHours: parseInt(e.target.value) }))}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Create Category</Button>
      </div>
    </form>
  );
}
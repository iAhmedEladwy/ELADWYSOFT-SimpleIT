import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/lib/authContext';
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
  DialogTitle,
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
import { format } from 'date-fns';
import { MoreHorizontal, UserCircle2 } from 'lucide-react';

interface TicketsTableProps {
  tickets: any[];
  employees: any[];
  assets: any[];
  users: any[];
  onStatusChange: (id: number, status: string, resolutionNotes?: string) => void;
  onAssign: (id: number, userId: number) => void;
}

export default function TicketsTable({
  tickets,
  employees,
  assets,
  users,
  onStatusChange,
  onAssign,
}: TicketsTableProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');

  // Translations
  const translations = {
    ticketId: language === 'English' ? 'Ticket ID' : 'رقم التذكرة',
    dateCreated: language === 'English' ? 'Date Created' : 'تاريخ الإنشاء',
    requestType: language === 'English' ? 'Request Type' : 'نوع الطلب',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    submittedBy: language === 'English' ? 'Submitted By' : 'مقدم من',
    relatedAsset: language === 'English' ? 'Related Asset' : 'الأصل المرتبط',
    assignedTo: language === 'English' ? 'Assigned To' : 'معين إلى',
    description: language === 'English' ? 'Description' : 'الوصف',
    actions: language === 'English' ? 'Actions' : 'الإجراءات',
    updateStatus: language === 'English' ? 'Update Status' : 'تحديث الحالة',
    assignTicket: language === 'English' ? 'Assign Ticket' : 'تعيين التذكرة',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    resolutionNotes: language === 'English' ? 'Resolution Notes' : 'ملاحظات الحل',
    update: language === 'English' ? 'Update' : 'تحديث',
    cancel: language === 'English' ? 'Cancel' : 'إلغاء',
    assign: language === 'English' ? 'Assign' : 'تعيين',
    selectUser: language === 'English' ? 'Select User' : 'اختر المستخدم',
    selectStatus: language === 'English' ? 'Select Status' : 'اختر الحالة',
    noTickets: language === 'English' ? 'No tickets found' : 'لم يتم العثور على تذاكر',
    open: language === 'English' ? 'Open' : 'مفتوح',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    resolved: language === 'English' ? 'Resolved' : 'تم الحل',
    closed: language === 'English' ? 'Closed' : 'مغلق',
    low: language === 'English' ? 'Low' : 'منخفض',
    medium: language === 'English' ? 'Medium' : 'متوسط',
    high: language === 'English' ? 'High' : 'مرتفع',
    hardware: language === 'English' ? 'Hardware' : 'أجهزة',
    software: language === 'English' ? 'Software' : 'برمجيات',
    network: language === 'English' ? 'Network' : 'شبكة',
    other: language === 'English' ? 'Other' : 'أخرى',
    none: language === 'English' ? 'None' : 'لا يوجد',
    unassigned: language === 'English' ? 'Unassigned' : 'غير معين',
  };

  const handleUpdateStatus = () => {
    if (selectedTicket && selectedStatus) {
      onStatusChange(selectedTicket.id, selectedStatus, resolutionNotes);
      setOpenStatusDialog(false);
      setResolutionNotes('');
      setSelectedStatus('');
    }
  };

  const handleAssignTicket = () => {
    if (selectedTicket && selectedUserId !== '') {
      onAssign(selectedTicket.id, selectedUserId as number);
      setOpenAssignDialog(false);
      setSelectedUserId('');
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Resolved':
        return 'outline';
      case 'Closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch (priority) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEmployeeName = (id: number) => {
    const employee = employees.find(emp => emp.id === id);
    return employee ? employee.englishName : translations.none;
  };

  const getAssetName = (id: number) => {
    const asset = assets.find(a => a.id === id);
    return asset ? asset.name : translations.none;
  };

  const getUserName = (id: number) => {
    const assignedUser = users.find(u => u.id === id);
    return assignedUser ? assignedUser.username : translations.unassigned;
  };

  const canUpdateStatus = (ticketStatus: string) => {
    // Only allow status changes in a forward direction
    if (user && parseInt(user.accessLevel) >= 2) return true; // Admins and managers can change to any status
    
    // Non-admin users can only move tickets forward in workflow
    switch (ticketStatus) {
      case 'Open':
        return ['In Progress'].includes(selectedStatus);
      case 'In Progress':
        return ['Resolved'].includes(selectedStatus);
      case 'Resolved':
        return ['Closed'].includes(selectedStatus);
      default:
        return false;
    }
  };

  const getAvailableStatuses = (currentStatus: string) => {
    // Full access for admins and managers
    if (user && parseInt(user.accessLevel) >= 2) {
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
        return [];
    }
  };

  if (tickets.length === 0) {
    return <div className="text-center py-8 text-gray-500">{translations.noTickets}</div>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.ticketId}</TableHead>
            <TableHead>{translations.dateCreated}</TableHead>
            <TableHead>{translations.requestType}</TableHead>
            <TableHead>{translations.priority}</TableHead>
            <TableHead>{translations.status}</TableHead>
            <TableHead>{translations.submittedBy}</TableHead>
            <TableHead>{translations.assignedTo}</TableHead>
            <TableHead>{translations.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket: any) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">{ticket.ticketId}</TableCell>
              <TableCell>
                {ticket.createdAt && format(new Date(ticket.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>{ticket.requestType}</TableCell>
              <TableCell>
                <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(ticket.status)}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>{ticket.submittedById ? getEmployeeName(ticket.submittedById) : translations.none}</TableCell>
              <TableCell>
                {ticket.assignedToId ? (
                  getUserName(ticket.assignedToId)
                ) : (
                  <span className="text-gray-400">{translations.unassigned}</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{translations.actions}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSelectedStatus('');
                        setOpenStatusDialog(true);
                      }}
                    >
                      {translations.updateStatus}
                    </DropdownMenuItem>
                    
                    {user && parseInt(user.accessLevel) >= 2 && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setSelectedUserId('');
                          setOpenAssignDialog(true);
                        }}
                      >
                        {translations.assignTicket}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Update Status Dialog */}
      <Dialog open={openStatusDialog} onOpenChange={setOpenStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.updateStatus}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">{translations.status}</Label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={translations.selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  {selectedTicket && getAvailableStatuses(selectedTicket.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'Open' ? translations.open :
                       status === 'In Progress' ? translations.inProgress :
                       status === 'Resolved' ? translations.resolved :
                       translations.closed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedStatus === 'Resolved' && (
              <div className="grid gap-2">
                <Label htmlFor="notes">{translations.resolutionNotes}</Label>
                <Textarea
                  id="notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenStatusDialog(false)}>
              {translations.cancel}
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || (selectedTicket && !canUpdateStatus(selectedTicket.status))}
            >
              {translations.update}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Dialog */}
      <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translations.assignTicket}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">{translations.assignedTo}</Label>
              <Select
                value={selectedUserId.toString()}
                onValueChange={(val) => setSelectedUserId(parseInt(val))}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder={translations.selectUser} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center">
                        <UserCircle2 className="h-4 w-4 mr-2" />
                        {user.username} ({user.email})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenAssignDialog(false)}>
              {translations.cancel}
            </Button>
            <Button
              onClick={handleAssignTicket}
              disabled={selectedUserId === ''}
            >
              {translations.assign}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
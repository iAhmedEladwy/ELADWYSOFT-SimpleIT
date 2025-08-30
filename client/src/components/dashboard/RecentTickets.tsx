import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket } from 'lucide-react';

interface RecentTicketsProps {
  tickets: any[];
  isLoading: boolean;
  onViewAll?: () => void;
}

export default function RecentTickets({ tickets, isLoading, onViewAll }: RecentTicketsProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    recentTickets: language === 'English' ? 'Recent Tickets' : 'التذاكر الحديثة',
    ticketId: language === 'English' ? 'Ticket ID' : 'معرف التذكرة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    noTickets: language === 'English' ? 'No recent tickets' : 'لا توجد تذاكر حديثة',
  };

  const getPriorityVariant = (priority: string): any => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'warning';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg">{translations.recentTickets}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll || (() => window.location.href = '/tickets')}
        >
          {translations.viewAll}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : tickets && tickets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations.ticketId}</TableHead>
                <TableHead>{translations.priority}</TableHead>
                <TableHead>{translations.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ENHANCED TABLE BODY WITH CLICKABLE ROWS */}
              {tickets.slice(0, 5).map((ticket) => (
                <TableRow 
                  key={ticket.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => window.location.href = `/tickets?search=${ticket.ticketId}`}
                >
                  <TableCell className="font-medium">{ticket.ticketId}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {translations.noTickets}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
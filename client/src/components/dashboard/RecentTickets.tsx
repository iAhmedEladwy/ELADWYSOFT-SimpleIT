import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface RecentTicketsProps {
  tickets: any[];
  isLoading: boolean;
}

export default function RecentTickets({ tickets, isLoading }: RecentTicketsProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    recentTickets: language === 'English' ? 'Recent Tickets' : 'التذاكر الحديثة',
    viewAll: language === 'English' ? 'View All' : 'عرض الكل',
    id: language === 'English' ? 'ID' : 'المعرف',
    issue: language === 'English' ? 'Issue' : 'المشكلة',
    priority: language === 'English' ? 'Priority' : 'الأولوية',
    status: language === 'English' ? 'Status' : 'الحالة',
    noData: language === 'English' ? 'No recent tickets' : 'لا توجد تذاكر حديثة',
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-error';
      case 'Medium':
        return 'bg-yellow-100 text-warning';
      case 'Low':
        return 'bg-green-100 text-success';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-info';
      case 'In Progress':
        return 'bg-yellow-100 text-warning';
      case 'Resolved':
        return 'bg-green-100 text-success';
      case 'Closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{translations.recentTickets}</h3>
        <Link href="/tickets">
          <a className="text-primary text-sm hover:underline">{translations.viewAll}</a>
        </Link>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-[216px] w-full" />
          ) : tickets && tickets.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.id}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.issue}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.priority}
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {translations.status}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.slice(0, 4).map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ticket.ticketId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {ticket.description.length > 30
                        ? `${ticket.description.substring(0, 30)}...`
                        : ticket.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className={`px-2 py-1 ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className={`px-2 py-1 ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-[216px] text-gray-500">
              {translations.noData}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

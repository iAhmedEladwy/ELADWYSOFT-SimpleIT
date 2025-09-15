import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { useTicketTranslations } from '@/lib/translations/tickets';
import { getPriorityColor } from '@/lib/utils/ticketUtils';

interface TicketStatusBadgeProps {
  status?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  type?: 'status' | 'priority';
  className?: string;
}

export default function TicketStatusBadge({ 
  status, 
  priority, 
  type = 'status',
  className 
}: TicketStatusBadgeProps) {
  const { language } = useLanguage();
  const t = useTicketTranslations(language);

  // Status Badge Logic
  if (type === 'status' && status) {
    const getStatusVariant = (status: string) => {
      switch (status.toLowerCase()) {
        case 'open':
          return 'default';
        case 'in progress':
          return 'secondary';
        case 'resolved':
          return 'outline';
        case 'closed':
          return 'outline';
        default:
          return 'default';
      }
    };

    const getStatusText = (status: string) => {
      switch (status.toLowerCase()) {
        case 'open':
          return t.statusOpen;
        case 'in progress':
          return t.statusInProgress;
        case 'resolved':
          return t.statusResolved;
        case 'closed':
          return t.statusClosed;
        default:
          return status;
      }
    };

    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className || ''}`}>
        {getStatusText(status)}
      </span>
    );
  }

  // Priority Badge Logic
  if (type === 'priority' && priority) {
    const getPriorityText = (priority: 'Low' | 'Medium' | 'High' | 'Critical') => {
      switch (priority) {
        case 'Low':
          return t.priorityLow;
        case 'Medium':
          return t.priorityMedium;
        case 'High':
          return t.priorityHigh;
        case 'Critical':
          return t.priorityCritical;
        default:
          return priority;
      }
    };

    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(priority)} ${className || ''}`}>
        {getPriorityText(priority)}
      </span>
    );
  }

  return null;
}
// client/src/components/dashboard/QuickActions.tsx

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserPlus, 
  Package, 
  TicketPlus,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface QuickActionsProps {
  data?: any;
  isLoading: boolean;
  onAddEmployee?: () => void;
  onAddAsset?: () => void;
  onOpenTicket?: () => void;
}

export default function QuickActions({ 
  data, 
  isLoading,
  onAddEmployee,
  onAddAsset,
  onOpenTicket 
}: QuickActionsProps) {
  const { language } = useLanguage();
  
  const translations = {
    quickActions: language === 'English' ? 'Quick Actions' : 'إجراءات سريعة',
    addEmployee: language === 'English' ? 'Add Employee' : 'إضافة موظف',
    addAsset: language === 'English' ? 'Add Asset' : 'إضافة أصل',
    openTicket: language === 'English' ? 'Open Ticket' : 'فتح تذكرة',
    pendingActions: language === 'English' ? 'Pending Actions' : 'إجراءات معلقة',
    approvals: language === 'English' ? 'Approvals' : 'الموافقات',
    maintenance: language === 'English' ? 'Maintenance' : 'الصيانة',
    reviews: language === 'English' ? 'Reviews' : 'المراجعات',
    new: language === 'English' ? 'New' : 'جديد',
    urgent: language === 'English' ? 'Urgent' : 'عاجل',
    pending: language === 'English' ? 'Pending' : 'معلق',
  };

  const quickActionItems = [
    {
      id: 'add-employee',
      title: translations.addEmployee,
      icon: UserPlus,
      color: 'primary',
      gradient: 'from-primary-400 to-primary-600',
      bgHover: 'hover:bg-primary-50 dark:hover:bg-primary-900/20',
      onClick: onAddEmployee || (() => {}),
      badge: translations.new,
      badgeColor: 'bg-primary-100 text-primary-700'
    },
    {
      id: 'add-asset',
      title: translations.addAsset,
      icon: Package,
      color: 'secondary',
      gradient: 'from-secondary-400 to-secondary-600',
      bgHover: 'hover:bg-secondary-50 dark:hover:bg-secondary-900/20',
      onClick: onAddAsset || (() => {}),
      badge: null
    },
    {
      id: 'open-ticket',
      title: translations.openTicket,
      icon: TicketPlus,
      color: 'tertiary',
      gradient: 'from-tertiary-400 to-tertiary-600',
      bgHover: 'hover:bg-tertiary-50 dark:hover:bg-tertiary-900/20',
      onClick: onOpenTicket || (() => {}),
      badge: null
    }
  ];

  const pendingActionItems = [
    {
      id: 'approvals',
      title: translations.approvals,
      count: data?.pendingApprovals || 0,
      icon: CheckCircle,
      color: 'warning',
      url: '/tickets?status=pending-approval',
      urgent: (data?.pendingApprovals || 0) > 5
    },
    {
      id: 'maintenance',
      title: translations.maintenance,
      count: data?.pendingMaintenance || 0,
      icon: Clock,
      color: 'error',
      url: '/assets?maintenanceDue=overdue',
      urgent: (data?.pendingMaintenance || 0) > 0
    },
    {
      id: 'reviews',
      title: translations.reviews,
      count: data?.pendingReviews || 0,
      icon: AlertCircle,
      color: 'info',
      url: '/tickets?status=review',
      urgent: false
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32 rounded-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary-500 animate-pulse" />
        <h2 className="text-headline-small font-medium text-gray-800 dark:text-gray-200">
          {translations.quickActions}
        </h2>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActionItems.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className={`relative overflow-hidden rounded-2xl border-0 shadow-md3-1 hover:shadow-md3-3 transition-all duration-300 cursor-pointer hover:scale-[1.02] animate-slideIn ${action.bgHover}`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={action.onClick}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-5`} />
              
              {/* Content */}
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md3-2 transform transition-transform duration-300 hover:scale-110 hover:rotate-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  {action.badge && (
                    <Badge className={`rounded-full text-xs ${action.badgeColor} animate-bounceIn`}>
                      {action.badge}
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-title-medium font-medium text-gray-900 dark:text-white mb-2">
                  {action.title}
                </h3>
                
                <div className="flex items-center gap-1 text-body-small text-gray-500 dark:text-gray-400 group">
                  <span>Click to {action.title.toLowerCase()}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          );
        })}
      </div>

      {/* Pending Actions Section */}
      {pendingActionItems.some(item => item.count > 0) && (
        <div className="mt-6 space-y-3">
          <h3 className="text-title-medium font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            {translations.pendingActions}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pendingActionItems.map((item, index) => {
              if (item.count === 0) return null;
              
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md3-2 animate-slideIn ${
                    item.urgent 
                      ? 'border-error-border bg-error-light/30 dark:bg-error/5' 
                      : 'border-gray-200 bg-white dark:bg-gray-800'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => window.location.href = item.url}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.urgent 
                          ? 'bg-error-light dark:bg-error/20' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          item.urgent ? 'text-error animate-pulse' : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-label-large font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-body-small text-gray-500 dark:text-gray-400">
                          {item.count} {translations.pending.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    {item.urgent && (
                      <Badge variant="destructive" className="rounded-full animate-pulse">
                        {translations.urgent}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
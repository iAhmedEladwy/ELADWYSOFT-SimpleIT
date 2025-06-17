import { useLanguage } from '@/hooks/use-language';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  CheckCircle,
  ArrowUp10,
  Trash2,
  Edit,
} from 'lucide-react';

interface RecentActivityProps {
  activities?: any[];
  isLoading: boolean;
}

export default function RecentActivity({ activities = [], isLoading }: RecentActivityProps) {
  const { language } = useLanguage();

  // Translations
  const translations = {
    systemActivity: language === 'English' ? 'System Activity Log' : 'سجل نشاط النظام',
    noActivity: language === 'English' ? 'No recent activity' : 'لا يوجد نشاط حديث',
    minutes: language === 'English' ? 'minutes ago' : 'منذ دقائق',
    hour: language === 'English' ? 'hour ago' : 'منذ ساعة',
    hours: language === 'English' ? 'hours ago' : 'منذ ساعات',
    create: language === 'English' ? 'Create' : 'إنشاء',
    update: language === 'English' ? 'Update' : 'تحديث',
    delete: language === 'English' ? 'Delete' : 'حذف',
    transfer: language === 'English' ? 'Transfer' : 'نقل',
    resolve: language === 'English' ? 'Resolve' : 'حل',
    asset: language === 'English' ? 'Asset' : 'الأصل',
    employee: language === 'English' ? 'Employee' : 'الموظف',
    ticket: language === 'English' ? 'Ticket' : 'تذكرة',
    user: language === 'English' ? 'User' : 'المستخدم',
  };

  // Generate user-readable messages for activities
  const generateActivityMessage = (activity: any) => {
    const action = activity.action;
    const entityType = activity.entityType;
    const details = activity.details || {};
    const user = activity.user?.username || 'System';

    switch (action) {
      case 'CREATE':
        switch (entityType) {
          case 'ASSET':
            return `${user} added new asset ${details.assetId || details.name || 'to inventory'}`;
          case 'EMPLOYEE':
            return `${user} created new employee profile for ${details.name || 'a team member'}`;
          case 'TICKET':
            return `${user} submitted a new ${details.requestType || 'support'} ticket`;
          case 'USER':
            return `${user} created new user account for ${details.username || 'someone'}`;
          default:
            return `${user} created a new ${entityType.toLowerCase()}`;
        }
      case 'UPDATE':
        switch (entityType) {
          case 'ASSET':
            return `${user} updated asset ${details.assetId || details.name || 'information'}`;
          case 'EMPLOYEE':
            return `${user} modified ${details.name || 'employee'} profile`;
          case 'TICKET':
            return `${user} updated ticket ${details.ticketId || 'status'}`;
          case 'USER':
            return `${user} updated user ${details.username || 'account'}`;
          default:
            return `${user} updated ${entityType.toLowerCase()}`;
        }
      case 'DELETE':
        switch (entityType) {
          case 'ASSET':
            return `${user} removed asset ${details.assetId || details.name || 'from inventory'}`;
          case 'EMPLOYEE':
            return `${user} removed ${details.name || 'employee'} from system`;
          case 'TICKET':
            return `${user} deleted ticket ${details.ticketId || ''}`;
          case 'USER':
            return `${user} deleted user ${details.username || 'account'}`;
          default:
            return `${user} deleted ${entityType.toLowerCase()}`;
        }
      case 'CHECK_OUT':
        return `${user} checked out ${details.assetId || 'asset'} to ${details.employeeName || 'employee'}`;
      case 'CHECK_IN':
        return `${user} checked in ${details.assetId || 'asset'} from ${details.employeeName || 'employee'}`;
      case 'LOGIN':
        return `${user} logged into the system`;
      case 'LOGOUT':
        return `${user} logged out of the system`;
      default:
        return `${user} performed ${action.toLowerCase()} on ${entityType.toLowerCase()}`;
    }
  };

  // Use backend data with enhanced messages
  const displayActivities = activities.length > 0 ? activities.map(activity => ({
    ...activity,
    enhancedMessage: generateActivityMessage(activity)
  })) : [];

  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} ${translations.minutes}`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} ${diffHours === 1 ? translations.hour : translations.hours}`;
    }
  };

  // Get icon based on action
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Create':
        return <PlusCircle className="h-4 w-4 text-white" />;
      case 'Resolve':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'Transfer':
        return <ArrowUp10 className="h-4 w-4 text-white" />;
      case 'Delete':
        return <Trash2 className="h-4 w-4 text-white" />;
      case 'Update':
        return <Edit className="h-4 w-4 text-white" />;
      default:
        return <PlusCircle className="h-4 w-4 text-white" />;
    }
  };

  // Get color based on action
  const getActionColor = (action: string) => {
    switch (action) {
      case 'Create':
        return 'bg-primary';
      case 'Resolve':
        return 'bg-success';
      case 'Transfer':
        return 'bg-warning';
      case 'Delete':
        return 'bg-error';
      case 'Update':
        return 'bg-info';
      default:
        return 'bg-primary';
    }
  };

  // Get badge color based on entity type
  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'Asset':
        return 'bg-gray-100 text-gray-500';
      case 'Employee':
        return 'bg-blue-100 text-blue-500';
      case 'Ticket':
        return 'bg-green-100 text-green-500';
      case 'User':
        return 'bg-purple-100 text-purple-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  // Get badge color based on action
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Create':
        return 'bg-primary bg-opacity-10 text-primary';
      case 'Resolve':
        return 'bg-success bg-opacity-10 text-success';
      case 'Transfer':
        return 'bg-warning bg-opacity-10 text-warning';
      case 'Delete':
        return 'bg-error bg-opacity-10 text-error';
      case 'Update':
        return 'bg-info bg-opacity-10 text-info';
      default:
        return 'bg-primary bg-opacity-10 text-primary';
    }
  };

  // Translate action
  const translateAction = (action: string) => {
    switch (action) {
      case 'Create':
        return translations.create;
      case 'Resolve':
        return translations.resolve;
      case 'Transfer':
        return translations.transfer;
      case 'Delete':
        return translations.delete;
      case 'Update':
        return translations.update;
      default:
        return action;
    }
  };

  // Translate entity type
  const translateEntity = (entityType: string) => {
    switch (entityType) {
      case 'Asset':
        return translations.asset;
      case 'Employee':
        return translations.employee;
      case 'Ticket':
        return translations.ticket;
      case 'User':
        return translations.user;
      default:
        return entityType;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg text-gray-900">{translations.systemActivity}</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : displayActivities.length > 0 ? (
          <div className="relative border-l-2 border-gray-200 ml-3">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="mb-10 ml-6">
                <div className={`absolute -left-5 mt-1 h-8 w-8 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {activity.enhancedMessage || activity.details?.description || `${activity.action} ${activity.entityType}`}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {getRelativeTime(new Date(activity.createdAt))}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className={`px-2 py-1 ${getEntityColor(activity.entityType)}`}>
                    {translateEntity(activity.entityType)}
                  </Badge>
                  <Badge variant="outline" className={`px-2 py-1 ${getActionBadgeColor(activity.action)}`}>
                    {translateAction(activity.action)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            {translations.noActivity}
          </div>
        )}
      </div>
    </div>
  );
}

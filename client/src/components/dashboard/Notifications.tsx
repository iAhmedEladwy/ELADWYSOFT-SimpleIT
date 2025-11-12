import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/authContext';
import { useLocation } from 'wouter';
import { 
  Bell,
  Package,
  Ticket,
  Users,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNotifications } from '@/hooks/use-notifications';

export default function Notifications() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Use shared notification hook for DB notifications only
  const { 
    notifications, 
    isLoading: dbNotificationsLoading, 
    markAllAsRead,
    dismissNotification
  } = useNotifications({
    limit: 100, // Dashboard shows more notifications than bell
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    pollingStrategy: 'adaptive', // 30s when focused, 60s when not focused
    enableSound: true // Enable sound notifications
  });

  const isLoading = authLoading || dbNotificationsLoading;

  if (authLoading || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Translation object
  const t = {
    allNotifications: language === 'English' ? 'All Notifications' : 'جميع الإشعارات',
    markAllAsRead: language === 'English' ? 'Mark All as Read' : 'تحديد الكل كمقروء',
    clearAll: language === 'English' ? 'Clear All' : 'مسح الكل',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    dismiss: language === 'English' ? 'Dismiss' : 'تجاهل',
    viewAssets: language === 'English' ? 'View Assets' : 'عرض الأصول',
    viewTickets: language === 'English' ? 'View Tickets' : 'عرض التذاكر',
    viewEmployees: language === 'English' ? 'View Employees' : 'عرض الموظفين',
    viewChangelog: language === 'English' ? 'View Changelog' : 'عرض سجل التغييرات',
    noNotifications: language === 'English' ? 'No notifications to display' : 'لا توجد إشعارات للعرض',
    justNow: language === 'English' ? 'Just now' : 'الآن',
  };

  const getTimeAgo = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { 
        addSuffix: true,
        locale: language === 'Arabic' ? ar : undefined 
      });
    } catch {
      return t.justNow;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Asset':
        return { icon: <Package className="h-5 w-5 text-white" />, color: 'bg-green-500' };
      case 'Ticket':
        return { icon: <Ticket className="h-5 w-5 text-white" />, color: 'bg-blue-500' };
      case 'Employee':
        return { icon: <Users className="h-5 w-5 text-white" />, color: 'bg-purple-500' };
      case 'System':
        return { icon: <CheckCircle className="h-5 w-5 text-white" />, color: 'bg-teal-500' };
      default:
        return { icon: <Bell className="h-5 w-5 text-white" />, color: 'bg-gray-500' };
    }
  };

  const getPrimaryAction = (type: string) => {
    switch (type) {
      case 'Asset':
        return t.viewAssets;
      case 'Ticket':
        return t.viewTickets;
      case 'Employee':
        return t.viewEmployees;
      case 'System':
        return t.viewChangelog;
      default:
        return t.viewDetails;
    }
  };

  const handlePrimaryAction = (notification: any) => {
    switch (notification.type) {
      case 'Asset':
        setLocation('/assets');
        break;
      case 'Ticket':
        setLocation('/tickets');
        break;
      case 'Employee':
        setLocation('/employees');
        break;
      case 'System':
        setLocation('/changes-log');
        break;
      default:
        setLocation('/');
    }
  };

  const handleDismiss = async (notification: any) => {
    await dismissNotification(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
        credentials: 'include',
      });
      // The hook will automatically refetch
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{t.allNotifications}</h3>
        <div className="flex gap-3">
          <button 
            onClick={handleMarkAllAsRead}
            className="text-primary text-sm hover:underline focus:outline-none"
            disabled={!notifications.length}
          >
            {t.markAllAsRead}
          </button>
          <button 
            onClick={handleClearAll}
            className="text-red-600 text-sm hover:underline focus:outline-none"
            disabled={!notifications.length}
          >
            {t.clearAll}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full mt-4" />
            <Skeleton className="h-24 w-full mt-4" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification: any) => {
            const { icon, color } = getNotificationIcon(notification.type);
            const primaryAction = getPrimaryAction(notification.type);
            
            return (
              <div 
                key={notification.id} 
                className={!notification.isRead ? "p-4 bg-blue-50" : "p-4"}
              >
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{getTimeAgo(notification.createdAt)}</span>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handlePrimaryAction(notification)}
                      >
                        {primaryAction}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-300 text-gray-600 hover:bg-gray-100"
                        onClick={() => handleDismiss(notification)}
                      >
                        {t.dismiss}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>{t.noNotifications}</p>
          </div>
        )}
      </div>
    </div>
  );
}
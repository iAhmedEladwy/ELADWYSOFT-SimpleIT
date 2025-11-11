import { Bell, Package, Ticket, Users, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/use-notifications';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function NotificationBell() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { 
    recentNotifications, 
    unreadCount, 
    isLoading, 
    markAllAsRead,
    markAsRead 
  } = useNotifications();

  const translations = {
    notifications: language === 'English' ? 'Notifications' : 'الإشعارات',
    markAllAsRead: language === 'English' ? 'Mark all as read' : 'تحديد الكل كمقروء',
    viewAll: language === 'English' ? 'View all notifications' : 'عرض جميع الإشعارات',
    noNotifications: language === 'English' ? 'No new notifications' : 'لا توجد إشعارات جديدة',
    justNow: language === 'English' ? 'just now' : 'الآن',
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Asset':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'Ticket':
        return <Ticket className="h-4 w-4 text-blue-600" />;
      case 'Employee':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'System':
        return <CheckCircle className="h-4 w-4 text-teal-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTimeAgo = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { 
        addSuffix: true,
        locale: language === 'Arabic' ? ar : undefined 
      });
    } catch {
      return translations.justNow;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead([notification.id]);
    }

    // Navigate based on type
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

  const handleViewAll = () => {
    setLocation('/?tab=notifications');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 md:w-96"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between pb-2">
          <span className="text-base font-semibold">{translations.notifications}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs text-primary hover:text-primary-dark"
            >
              {translations.markAllAsRead}
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="py-1">
              {recentNotifications.map((notification: any) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {getTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-500">{translations.noNotifications}</p>
            </div>
          )}
        </ScrollArea>

        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-center text-primary font-medium cursor-pointer"
              onClick={handleViewAll}
            >
              {translations.viewAll}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

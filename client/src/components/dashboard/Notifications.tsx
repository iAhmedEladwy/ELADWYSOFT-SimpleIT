import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Lock, 
  AlertTriangle, 
  Tag, 
  CheckCircle,
  Bell,
  Calendar,
  Clock,
  Wrench,
  Users,
} from 'lucide-react';

export default function Notifications() {
  const { language } = useLanguage();

  // Fetch real notification data
  const { data: assetsResponse, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/assets'],
  });
  const assets = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets'],
  });

  const { data: systemConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/system-config'],
  });

  const isLoading = assetsLoading || ticketsLoading || configLoading;
  const maintenanceAssets = assets.filter(asset => asset.status === 'Maintenance');


  // Translations
  const translations = {
    allNotifications: language === 'English' ? 'All Notifications' : 'جميع الإشعارات',
    markAllAsRead: language === 'English' ? 'Mark All as Read' : 'تحديد الكل كمقروء',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    dismiss: language === 'English' ? 'Dismiss' : 'تجاهل',
    viewCalendar: language === 'English' ? 'View Calendar' : 'عرض التقويم',
    requestAsset: language === 'English' ? 'Request Asset' : 'طلب أصل',
    viewReport: language === 'English' ? 'View Report' : 'عرض التقرير',
    viewChangelog: language === 'English' ? 'View Changelog' : 'عرض سجل التغييرات',
    minsAgo: language === 'English' ? 'mins ago' : 'دقائق مضت',
    hourAgo: language === 'English' ? 'hour ago' : 'ساعة مضت',
    daysAgo: language === 'English' ? 'days ago' : 'أيام مضت',
    hoursAgo: language === 'English' ? 'hours ago' : 'ساعات مضت',
    weekAgo: language === 'English' ? 'week ago' : 'أسبوع مضت',
    noNotifications: language === 'English' ? 'No notifications to display' : 'لا توجد إشعارات للعرض',
  };

  // Generate real notifications from system data
  const generateNotifications = () => {
    const notifications = [];
    
    if (!assets || !tickets || !systemConfig) return notifications;

    // Check for assets in maintenance
    const maintenanceAssets = assets.filter(asset => asset.status === 'Maintenance');
    if (maintenanceAssets.length > 0) {
      notifications.push({
        id: 'maintenance-alert',
        title: `${maintenanceAssets.length} Asset${maintenanceAssets.length > 1 ? 's' : ''} Under Maintenance`,
        message: `${maintenanceAssets.length} asset${maintenanceAssets.length > 1 ? 's are' : ' is'} currently under maintenance and unavailable for assignment.`,
        time: '2 ' + translations.minsAgo,
        icon: <Wrench className="h-5 w-5 text-white" />,
        iconColor: 'bg-warning',
        unread: true,
        primaryAction: translations.viewDetails,
      });
    }

    // Check for damaged assets
    const damagedAssets = assets.filter(asset => asset.status === 'Damaged');
    if (damagedAssets.length > 0) {
      notifications.push({
        id: 'damaged-alert',
        title: `${damagedAssets.length} Damaged Asset${damagedAssets.length > 1 ? 's' : ''} Need Attention`,
        message: `${damagedAssets.length} asset${damagedAssets.length > 1 ? 's require' : ' requires'} repair or replacement. Check asset management for details.`,
        time: '15 ' + translations.minsAgo,
        icon: <AlertTriangle className="h-5 w-5 text-white" />,
        iconColor: 'bg-error',
        unread: true,
        primaryAction: translations.viewDetails,
      });
    }

    // Check for open tickets
    const openTickets = tickets.filter(ticket => ticket.status === 'Open');
    if (openTickets.length > 0) {
      notifications.push({
        id: 'open-tickets',
        title: `${openTickets.length} Open Support Ticket${openTickets.length > 1 ? 's' : ''}`,
        message: `You have ${openTickets.length} unresolved support ticket${openTickets.length > 1 ? 's' : ''} awaiting attention.`,
        time: '1 ' + translations.hourAgo,
        icon: <Users className="h-5 w-5 text-white" />,
        iconColor: 'bg-primary',
        unread: true,
        primaryAction: translations.viewDetails,
      });
    }

    // Check for available assets
    const availableAssets = assets.filter(asset => asset.status === 'Available');
    if (availableAssets.length > 10) {
      notifications.push({
        id: 'available-assets',
        title: 'Assets Available for Assignment',
        message: `${availableAssets.length} assets are currently available and ready for assignment to employees.`,
        time: '3 ' + translations.hoursAgo,
        icon: <Tag className="h-5 w-5 text-white" />,
        iconColor: 'bg-success',
        unread: false,
        primaryAction: translations.viewDetails,
      });
    }

    // System update notification
    if (systemConfig?.systemVersion) {
      notifications.push({
        id: 'system-version',
        title: 'System Status',
        message: `SimpleIT is running version ${systemConfig.systemVersion}. All systems operational.`,
        time: '1 ' + translations.daysAgo,
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        iconColor: 'bg-success',
        unread: false,
        primaryAction: translations.viewChangelog,
      });
    }

    return notifications;
  };

  const notifications = generateNotifications();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{translations.allNotifications}</h3>
        <button className="text-primary text-sm hover:underline">{translations.markAllAsRead}</button>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className={notification.unread ? "p-4 bg-blue-50" : "p-4"}>
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-full ${notification.iconColor} flex items-center justify-center flex-shrink-0`}>
                  {notification.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                      {notification.primaryAction}
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-100">
                      {translations.dismiss}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>{translations.noNotifications}</p>
          </div>
        )}
      </div>
    </div>
  );
}

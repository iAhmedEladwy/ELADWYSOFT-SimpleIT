import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  AlertTriangle, 
  Tag, 
  CheckCircle,
  Bell,
} from 'lucide-react';

export default function Notifications() {
  const { language } = useLanguage();

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
    weekAgo: language === 'English' ? 'week ago' : 'أسبوع مضت',
  };

  // Sample notifications data
  const notifications = [
    {
      id: 1,
      title: 'License Expiration Warning',
      message: 'Adobe Creative Cloud licenses (10) will expire in 15 days. Please renew to avoid service interruption.',
      time: '10 ' + translations.minsAgo,
      icon: <Lock className="h-5 w-5 text-white" />,
      iconColor: 'bg-primary',
      unread: true,
      primaryAction: translations.viewDetails,
    },
    {
      id: 2,
      title: 'Maintenance Alert',
      message: 'Server maintenance scheduled for Sunday, 12th July from 2:00 AM to 5:00 AM. System will be unavailable during this time.',
      time: '1 ' + translations.hourAgo,
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      iconColor: 'bg-warning',
      unread: true,
      primaryAction: translations.viewCalendar,
    },
    {
      id: 3,
      title: 'New Hardware Available',
      message: 'New Dell XPS laptops are now available for requisition. Submit a request through the Assets portal.',
      time: 'Yesterday',
      icon: <Tag className="h-5 w-5 text-white" />,
      iconColor: 'bg-accent',
      unread: false,
      primaryAction: translations.requestAsset,
    },
    {
      id: 4,
      title: 'Employee Import Completed',
      message: 'The employee data import was completed successfully. 24 new employees were added to the system.',
      time: '2 ' + translations.daysAgo,
      icon: <CheckCircle className="h-5 w-5 text-white" />,
      iconColor: 'bg-success',
      unread: false,
      primaryAction: translations.viewReport,
    },
    {
      id: 5,
      title: 'System Update',
      message: 'SimpleIT Bolt.dev has been updated to version 2.3.0. View the changelog for new features and improvements.',
      time: '1 ' + translations.weekAgo,
      icon: <Bell className="h-5 w-5 text-white" />,
      iconColor: 'bg-gray-500',
      unread: false,
      primaryAction: translations.viewChangelog,
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{translations.allNotifications}</h3>
        <button className="text-primary text-sm hover:underline">{translations.markAllAsRead}</button>
      </div>
      <div className="divide-y divide-gray-200">
        {notifications.map((notification) => (
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
        ))}
      </div>
    </div>
  );
}

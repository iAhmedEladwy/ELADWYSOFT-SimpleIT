import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
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
  TrendingUp,
  UserPlus,
  Package,
  Shield,
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore, addDays } from 'date-fns';

export default function Notifications() {
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();

  // Fetch real notification data - only when authenticated
  const { data: assetsResponse, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/assets'],
    enabled: isAuthenticated,
  });
  const assets = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets'],
    enabled: isAuthenticated,
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    enabled: isAuthenticated,
  });

  const { data: maintenance, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/asset-maintenance'],
    enabled: isAuthenticated,
  });

  const { data: systemConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/system-config'],
    enabled: isAuthenticated,
  });

  const isLoading = assetsLoading || ticketsLoading || employeesLoading || maintenanceLoading || configLoading;


  // Translations
  const translations = {
    allNotifications: language === 'English' ? 'All Notifications' : 'جميع الإشعارات',
    markAllAsRead: language === 'English' ? 'Mark All as Read' : 'تحديد الكل كمقروء',
    viewDetails: language === 'English' ? 'View Details' : 'عرض التفاصيل',
    dismiss: language === 'English' ? 'Dismiss' : 'تجاهل',
    viewAssets: language === 'English' ? 'View Assets' : 'عرض الأصول',
    viewTickets: language === 'English' ? 'View Tickets' : 'عرض التذاكر',
    viewEmployees: language === 'English' ? 'View Employees' : 'عرض الموظفين',
    viewMaintenance: language === 'English' ? 'View Maintenance' : 'عرض الصيانة',
    viewChangelog: language === 'English' ? 'View Changelog' : 'عرض سجل التغييرات',
    minsAgo: language === 'English' ? 'mins ago' : 'دقائق مضت',
    hourAgo: language === 'English' ? 'hour ago' : 'ساعة مضت',
    hoursAgo: language === 'English' ? 'hours ago' : 'ساعات مضت',
    daysAgo: language === 'English' ? 'days ago' : 'أيام مضت',
    weekAgo: language === 'English' ? 'week ago' : 'أسبوع مضت',
    noNotifications: language === 'English' ? 'No notifications to display' : 'لا توجد إشعارات للعرض',
    justNow: language === 'English' ? 'Just now' : 'الآن',
  };

  // Helper function to format time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const minutes = differenceInMinutes(now, date);
    const hours = differenceInHours(now, date);
    const days = differenceInDays(now, date);

    if (minutes < 1) return translations.justNow;
    if (minutes < 60) return `${minutes} ${translations.minsAgo}`;
    if (hours < 24) return `${hours} ${translations.hoursAgo}`;
    if (days < 7) return `${days} ${translations.daysAgo}`;
    return `${Math.floor(days / 7)} ${translations.weekAgo}`;
  };

  // Generate real notifications from system data
  const generateNotifications = () => {
    const notifications: any[] = [];
    const now = new Date();
    
    if (!assets || !tickets) return notifications;

    // 1. Critical: Damaged assets requiring immediate attention
    const damagedAssets = assets.filter((asset: any) => asset.status === 'Damaged');
    if (damagedAssets.length > 0) {
      notifications.push({
        id: 'damaged-alert',
        title: language === 'English' 
          ? `${damagedAssets.length} Damaged Asset${damagedAssets.length > 1 ? 's' : ''} Need Attention`
          : `${damagedAssets.length} أصل تالف يحتاج اهتمام`,
        message: language === 'English'
          ? `${damagedAssets.length} asset${damagedAssets.length > 1 ? 's require' : ' requires'} immediate repair or replacement.`
          : `${damagedAssets.length} أصل يتطلب إصلاح أو استبدال فوري.`,
        time: getTimeAgo(new Date(Date.now() - 15 * 60 * 1000)), // 15 mins ago
        icon: <AlertTriangle className="h-5 w-5 text-white" />,
        iconColor: 'bg-red-500',
        unread: true,
        primaryAction: translations.viewAssets,
        priority: 'critical',
      });
    }

    // 2. High: Open tickets (especially urgent ones)
    const openTickets = tickets.filter((ticket: any) => ticket.status === 'Open');
    const urgentTickets = openTickets.filter((ticket: any) => ticket.priority === 'urgent');
    if (openTickets.length > 0) {
      notifications.push({
        id: 'open-tickets',
        title: language === 'English'
          ? `${openTickets.length} Open Ticket${openTickets.length > 1 ? 's' : ''}${urgentTickets.length > 0 ? ` (${urgentTickets.length} Urgent)` : ''}`
          : `${openTickets.length} تذكرة مفتوحة${urgentTickets.length > 0 ? ` (${urgentTickets.length} عاجل)` : ''}`,
        message: language === 'English'
          ? `${openTickets.length} support ticket${openTickets.length > 1 ? 's' : ''} awaiting resolution.`
          : `${openTickets.length} تذكرة دعم في انتظار الحل.`,
        time: getTimeAgo(new Date(Date.now() - 30 * 60 * 1000)), // 30 mins ago
        icon: <Users className="h-5 w-5 text-white" />,
        iconColor: urgentTickets.length > 0 ? 'bg-orange-500' : 'bg-blue-500',
        unread: true,
        primaryAction: translations.viewTickets,
        priority: urgentTickets.length > 0 ? 'high' : 'medium',
      });
    }

    // 3. Medium: Assets in maintenance
    const maintenanceAssets = assets.filter((asset: any) => asset.status === 'Maintenance');
    if (maintenanceAssets.length > 0) {
      notifications.push({
        id: 'maintenance-alert',
        title: language === 'English'
          ? `${maintenanceAssets.length} Asset${maintenanceAssets.length > 1 ? 's' : ''} Under Maintenance`
          : `${maintenanceAssets.length} أصل تحت الصيانة`,
        message: language === 'English'
          ? `${maintenanceAssets.length} asset${maintenanceAssets.length > 1 ? 's are' : ' is'} currently undergoing maintenance.`
          : `${maintenanceAssets.length} أصل يخضع حاليا للصيانة.`,
        time: getTimeAgo(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
        icon: <Wrench className="h-5 w-5 text-white" />,
        iconColor: 'bg-yellow-500',
        unread: true,
        primaryAction: translations.viewMaintenance,
        priority: 'medium',
      });
    }

    // 4. Info: Warranty expiring soon (within 30 days)
    const expiringSoonAssets = assets.filter((asset: any) => {
      if (!asset.warrantyExpiryDate) return false;
      const expiryDate = new Date(asset.warrantyExpiryDate);
      const daysUntilExpiry = differenceInDays(expiryDate, now);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    });
    if (expiringSoonAssets.length > 0) {
      notifications.push({
        id: 'warranty-expiring',
        title: language === 'English'
          ? `${expiringSoonAssets.length} Warranty${expiringSoonAssets.length > 1 ? ' Expiring' : ' Expires'} Soon`
          : `${expiringSoonAssets.length} ضمان ينتهي قريباً`,
        message: language === 'English'
          ? `${expiringSoonAssets.length} asset${expiringSoonAssets.length > 1 ? 's have warranties' : ' has warranty'} expiring within 30 days.`
          : `${expiringSoonAssets.length} أصل الضمان الخاص به ينتهي خلال 30 يوماً.`,
        time: getTimeAgo(new Date(Date.now() - 6 * 60 * 60 * 1000)), // 6 hours ago
        icon: <Shield className="h-5 w-5 text-white" />,
        iconColor: 'bg-purple-500',
        unread: false,
        primaryAction: translations.viewAssets,
        priority: 'low',
      });
    }

    // 5. Info: Recently added employees (last 7 days)
    if (employees && employees.length > 0) {
      const recentEmployees = employees.filter((emp: any) => {
        if (!emp.joiningDate) return false;
        const joinDate = new Date(emp.joiningDate);
        return differenceInDays(now, joinDate) <= 7 && differenceInDays(now, joinDate) >= 0;
      });
      if (recentEmployees.length > 0) {
        notifications.push({
          id: 'new-employees',
          title: language === 'English'
            ? `${recentEmployees.length} New Employee${recentEmployees.length > 1 ? 's' : ''} Joined`
            : `${recentEmployees.length} موظف جديد انضم`,
          message: language === 'English'
            ? `${recentEmployees.length} employee${recentEmployees.length > 1 ? 's have' : ' has'} joined in the last 7 days.`
            : `${recentEmployees.length} موظف انضم في آخر 7 أيام.`,
          time: getTimeAgo(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
          icon: <UserPlus className="h-5 w-5 text-white" />,
          iconColor: 'bg-green-500',
          unread: false,
          primaryAction: translations.viewEmployees,
          priority: 'low',
        });
      }
    }

    // 6. Info: Available assets ready for assignment
    const availableAssets = assets.filter((asset: any) => asset.status === 'Available');
    if (availableAssets.length >= 10) {
      notifications.push({
        id: 'available-assets',
        title: language === 'English'
          ? `${availableAssets.length} Assets Ready for Assignment`
          : `${availableAssets.length} أصل جاهز للتخصيص`,
        message: language === 'English'
          ? `${availableAssets.length} assets are currently available for employee assignment.`
          : `${availableAssets.length} أصل متاح حالياً لتخصيص للموظفين.`,
        time: getTimeAgo(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
        icon: <Package className="h-5 w-5 text-white" />,
        iconColor: 'bg-teal-500',
        unread: false,
        primaryAction: translations.viewAssets,
        priority: 'low',
      });
    }

    // 7. System version info
    if (systemConfig?.systemVersion) {
      notifications.push({
        id: 'system-version',
        title: language === 'English' ? 'System Running Smoothly' : 'النظام يعمل بسلاسة',
        message: language === 'English'
          ? `SimpleIT v${systemConfig.systemVersion} - All systems operational.`
          : `SimpleIT v${systemConfig.systemVersion} - جميع الأنظمة تعمل.`,
        time: getTimeAgo(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
        icon: <CheckCircle className="h-5 w-5 text-white" />,
        iconColor: 'bg-green-600',
        unread: false,
        primaryAction: translations.viewChangelog,
        priority: 'info',
      });
    }

    // Sort by priority: critical > high > medium > low > info
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return notifications.sort((a, b) => 
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
    );
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

import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import { useLocation } from 'wouter';
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
  Ticket,
  UserCheck,
  ArrowUpCircle,
  ClipboardCheck,
  FileText,
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore, addDays } from 'date-fns';

export default function Notifications() {
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [allRead, setAllRead] = useState(false);

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

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/asset-transactions'],
    enabled: isAuthenticated,
  });

  const { data: upgrades, isLoading: upgradesLoading } = useQuery({
    queryKey: ['/api/asset-upgrades'],
    enabled: isAuthenticated,
  });

  const { data: systemConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/system-config'],
    enabled: isAuthenticated,
  });

  // Fetch database notifications
  const { data: dbNotifications, isLoading: dbNotificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
  });

  const isLoading = assetsLoading || ticketsLoading || employeesLoading || maintenanceLoading || transactionsLoading || upgradesLoading || configLoading || dbNotificationsLoading;


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
    
    if (!user || !tickets) return notifications;

    // Get user's employee record if exists
    const userEmployee = employees?.find((emp: any) => emp.id === user.employeeId);

    // ====================
    // PERSONALIZED NOTIFICATIONS FOR LOGGED-IN USER
    // ====================

    // 1. CRITICAL: Tickets assigned TO YOU (Open or In Progress)
    const myAssignedTickets = tickets.filter((ticket: any) => 
      ticket.assignedTo === user.id && 
      (ticket.status === 'Open' || ticket.status === 'In Progress')
    );
    if (myAssignedTickets.length > 0) {
      const urgentCount = myAssignedTickets.filter((t: any) => t.priority === 'urgent').length;
      const mostRecentTicket = myAssignedTickets.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      notifications.push({
        id: `my-assigned-tickets-${myAssignedTickets.length}`,
        title: language === 'English' 
          ? `${myAssignedTickets.length} Ticket${myAssignedTickets.length > 1 ? 's' : ''} Assigned to You${urgentCount > 0 ? ` (${urgentCount} Urgent)` : ''}`
          : `${myAssignedTickets.length} تذكرة معينة لك${urgentCount > 0 ? ` (${urgentCount} عاجل)` : ''}`,
        message: language === 'English'
          ? `You have ${myAssignedTickets.length} ticket${myAssignedTickets.length > 1 ? 's' : ''} requiring your attention.${urgentCount > 0 ? ` ${urgentCount} marked as urgent!` : ''}`
          : `لديك ${myAssignedTickets.length} تذكرة تتطلب انتباهك.`,
        time: getTimeAgo(new Date(mostRecentTicket.createdAt)),
        icon: <UserCheck className="h-5 w-5 text-white" />,
        iconColor: urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500',
        unread: true,
        primaryAction: translations.viewTickets,
        priority: urgentCount > 0 ? 'critical' : 'high',
      });
    }

    // 2. HIGH: New tickets created in last 24 hours (that YOU submitted)
    const mySubmittedTickets = tickets.filter((ticket: any) => {
      if (!ticket.createdAt || ticket.submittedBy !== user.employeeId) return false;
      const ticketDate = new Date(ticket.createdAt);
      const hoursOld = differenceInHours(now, ticketDate);
      return hoursOld <= 24 && ticket.status !== 'Closed';
    });
    if (mySubmittedTickets.length > 0) {
      const inProgressCount = mySubmittedTickets.filter((t: any) => t.status === 'In Progress').length;
      notifications.push({
        id: `my-submitted-tickets-${mySubmittedTickets.length}`,
        title: language === 'English'
          ? `${mySubmittedTickets.length} Ticket${mySubmittedTickets.length > 1 ? 's' : ''} You Created${inProgressCount > 0 ? ` (${inProgressCount} In Progress)` : ''}`
          : `${mySubmittedTickets.length} تذكرة أنشأتها${inProgressCount > 0 ? ` (${inProgressCount} قيد التنفيذ)` : ''}`,
        message: language === 'English'
          ? `${mySubmittedTickets.length} of your ticket${mySubmittedTickets.length > 1 ? 's are' : ' is'} being processed.`
          : `${mySubmittedTickets.length} من تذاكرك قيد المعالجة.`,
        time: getTimeAgo(new Date(mySubmittedTickets[0].createdAt)),
        icon: <FileText className="h-5 w-5 text-white" />,
        iconColor: 'bg-indigo-500',
        unread: true,
        primaryAction: translations.viewTickets,
        priority: 'medium',
      });
    }

    // 3. HIGH: Upgrade requests requiring YOUR approval (Managers/Admins only)
    if ((user.role === 'Manager' || user.role === 'Admin') && upgrades && upgrades.length > 0) {
      const pendingUpgrades = upgrades.filter((upgrade: any) => 
        upgrade.status === 'pending' || upgrade.status === 'Pending'
      );
      if (pendingUpgrades.length > 0) {
        notifications.push({
          id: `pending-upgrades-${pendingUpgrades.length}`,
          title: language === 'English'
            ? `${pendingUpgrades.length} Upgrade Request${pendingUpgrades.length > 1 ? 's' : ''} Awaiting Approval`
            : `${pendingUpgrades.length} طلب ترقية في انتظار الموافقة`,
          message: language === 'English'
            ? `${pendingUpgrades.length} asset upgrade${pendingUpgrades.length > 1 ? 's require' : ' requires'} your approval.`
            : `${pendingUpgrades.length} ترقية أصل تتطلب موافقتك.`,
          time: pendingUpgrades[0].requestDate ? getTimeAgo(new Date(pendingUpgrades[0].requestDate)) : translations.justNow,
          icon: <ArrowUpCircle className="h-5 w-5 text-white" />,
          iconColor: 'bg-orange-500',
          unread: true,
          primaryAction: translations.viewAssets,
          priority: 'high',
        });
      }
    }

    // 4. MEDIUM: Assets assigned TO YOU recently (last 7 days)
    if (userEmployee && assets && assets.length > 0) {
      const myAssets = assets.filter((asset: any) => asset.assignedEmployeeId === userEmployee.id);
      const recentlyAssignedAssets = transactions && transactions.length > 0 
        ? transactions.filter((trans: any) => {
            if (trans.employeeId !== userEmployee.id || trans.type !== 'Check-Out') return false;
            const transDate = new Date(trans.transactionDate);
            return differenceInDays(now, transDate) <= 7;
          })
        : [];
      
      if (recentlyAssignedAssets.length > 0) {
        notifications.push({
          id: `my-new-assets-${recentlyAssignedAssets.length}`,
          title: language === 'English'
            ? `${recentlyAssignedAssets.length} New Asset${recentlyAssignedAssets.length > 1 ? 's' : ''} Assigned to You`
            : `${recentlyAssignedAssets.length} أصل جديد معين لك`,
          message: language === 'English'
            ? `${recentlyAssignedAssets.length} asset${recentlyAssignedAssets.length > 1 ? 's have' : ' has'} been assigned to you in the last week.`
            : `${recentlyAssignedAssets.length} أصل تم تعيينه لك في الأسبوع الماضي.`,
          time: getTimeAgo(new Date(recentlyAssignedAssets[0].transactionDate)),
          icon: <Package className="h-5 w-5 text-white" />,
          iconColor: 'bg-green-500',
          unread: true,
          primaryAction: translations.viewAssets,
          priority: 'medium',
        });
      }

      // 5. MEDIUM: Maintenance on YOUR assigned assets
      if (maintenance && maintenance.length > 0 && myAssets.length > 0) {
        const myAssetIds = myAssets.map((a: any) => a.id);
        const myAssetMaintenance = maintenance.filter((m: any) => 
          myAssetIds.includes(m.assetId) && 
          (m.status === 'Scheduled' || m.status === 'In Progress')
        );
        if (myAssetMaintenance.length > 0) {
          notifications.push({
            id: `my-asset-maintenance-${myAssetMaintenance.length}`,
            title: language === 'English'
              ? `Maintenance on Your Asset${myAssetMaintenance.length > 1 ? 's' : ''}`
              : `صيانة على أصولك`,
            message: language === 'English'
              ? `${myAssetMaintenance.length} of your assigned asset${myAssetMaintenance.length > 1 ? 's are' : ' is'} undergoing maintenance.`
              : `${myAssetMaintenance.length} من أصولك المعينة تخضع للصيانة.`,
            time: getTimeAgo(new Date(myAssetMaintenance[0].date)),
            icon: <Wrench className="h-5 w-5 text-white" />,
            iconColor: 'bg-yellow-500',
            unread: false,
            primaryAction: translations.viewMaintenance,
            priority: 'medium',
          });
        }
      }
    }

    // 6. MEDIUM: Tickets YOU assigned to others (Managers/Agents)
    if ((user.role === 'Manager' || user.role === 'Agent' || user.role === 'Admin') && tickets.length > 0) {
      const ticketsIAssigned = tickets.filter((ticket: any) => {
        // Check if ticket was assigned by current user (would need handledById field)
        // For now, check tickets created in last 3 days that are assigned to someone
        if (!ticket.assignedTo || ticket.status === 'Closed') return false;
        const ticketDate = new Date(ticket.createdAt);
        return differenceInDays(now, ticketDate) <= 3;
      });
      
      const openAssignedTickets = ticketsIAssigned.filter((t: any) => t.status === 'Open');
      if (openAssignedTickets.length > 0) {
        notifications.push({
          id: `tickets-i-assigned-${openAssignedTickets.length}`,
          title: language === 'English'
            ? `${openAssignedTickets.length} Assigned Ticket${openAssignedTickets.length > 1 ? 's' : ''} Pending`
            : `${openAssignedTickets.length} تذكرة معينة في الانتظار`,
          message: language === 'English'
            ? `${openAssignedTickets.length} ticket${openAssignedTickets.length > 1 ? 's you assigned are' : ' you assigned is'} still open.`
            : `${openAssignedTickets.length} تذكرة قمت بتعيينها لا تزال مفتوحة.`,
          time: getTimeAgo(new Date(openAssignedTickets[0].createdAt)),
          icon: <ClipboardCheck className="h-5 w-5 text-white" />,
          iconColor: 'bg-purple-500',
          unread: false,
          primaryAction: translations.viewTickets,
          priority: 'low',
        });
      }
    }

    // Sort by priority: critical > high > medium > low > info
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return notifications.sort((a, b) => 
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
    );
  };

  // Convert database notifications to display format
  const convertDbNotifications = () => {
    if (!dbNotifications || dbNotifications.length === 0) return [];
    
    return dbNotifications.map((dbNotif: any) => {
      // Map notification type to icon and color
      let icon = <Bell className="h-5 w-5 text-white" />;
      let iconColor = 'bg-blue-500';
      let primaryAction = translations.viewDetails;
      
      switch (dbNotif.type) {
        case 'Ticket':
          icon = <Ticket className="h-5 w-5 text-white" />;
          iconColor = 'bg-blue-500';
          primaryAction = translations.viewTickets;
          break;
        case 'Asset':
          icon = <Package className="h-5 w-5 text-white" />;
          iconColor = 'bg-green-500';
          primaryAction = translations.viewAssets;
          break;
        case 'Employee':
          icon = <Users className="h-5 w-5 text-white" />;
          iconColor = 'bg-purple-500';
          primaryAction = translations.viewEmployees;
          break;
        case 'System':
          icon = <CheckCircle className="h-5 w-5 text-white" />;
          iconColor = 'bg-teal-500';
          primaryAction = translations.viewChangelog;
          break;
      }

      return {
        id: `db-${dbNotif.id}`, // Prefix with 'db-' to distinguish from generated notifications
        title: dbNotif.title,
        message: dbNotif.message,
        time: getTimeAgo(new Date(dbNotif.createdAt)),
        icon,
        iconColor,
        unread: !dbNotif.isRead,
        primaryAction,
        priority: !dbNotif.isRead ? 'high' : 'low',
        entityId: dbNotif.entityId,
        dbId: dbNotif.id, // Keep original DB ID for deletion
      };
    });
  };

  // Merge generated and database notifications
  const allNotifications = [...generateNotifications(), ...convertDbNotifications()];
  
  // Filter out dismissed notifications
  const notifications = allNotifications.filter(n => !dismissedNotifications.includes(n.id));

  // Handler for marking all as read
  const handleMarkAllAsRead = async () => {
    setAllRead(true);
    
    // Also mark database notifications as read
    try {
      const notificationIds = (dbNotifications || []).map((n: any) => n.id);
      if (notificationIds.length > 0) {
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationIds }),
        });
        refetchNotifications();
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Handler for dismissing a notification
  const handleDismiss = async (notification: any) => {
    // For database notifications (have dbId), delete from backend
    if (notification.dbId) {
      try {
        await fetch(`/api/notifications/${notification.dbId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        refetchNotifications();
      } catch (error) {
        console.error('Failed to dismiss notification:', error);
      }
    } else {
      // For generated notifications, just hide locally
      setDismissedNotifications(prev => [...prev, notification.id]);
    }
  };

  // Handler for primary action clicks
  const handlePrimaryAction = (notification: any) => {
    // Mark as read when clicking action
    setAllRead(true);
    
    // Navigate based on notification type
    switch (notification.id) {
      case 'damaged-alert':
      case 'available-assets':
      case 'warranty-expiring':
        setLocation('/assets');
        break;
      case 'open-tickets':
        setLocation('/tickets');
        break;
      case 'maintenance-alert':
        setLocation('/maintenance');
        break;
      case 'new-employees':
        setLocation('/employees');
        break;
      case 'system-version':
        setLocation('/changelog');
        break;
      default:
        // Generic navigation - could be enhanced based on action text
        if (notification.primaryAction === translations.viewAssets) {
          setLocation('/assets');
        } else if (notification.primaryAction === translations.viewTickets) {
          setLocation('/tickets');
        } else if (notification.primaryAction === translations.viewEmployees) {
          setLocation('/employees');
        } else if (notification.primaryAction === translations.viewMaintenance) {
          setLocation('/maintenance');
        }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{translations.allNotifications}</h3>
        <button 
          onClick={handleMarkAllAsRead}
          className="text-primary text-sm hover:underline focus:outline-none"
        >
          {translations.markAllAsRead}
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} className={(notification.unread && !allRead) ? "p-4 bg-blue-50" : "p-4"}>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                      onClick={() => handlePrimaryAction(notification)}
                    >
                      {notification.primaryAction}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-gray-300 text-gray-600 hover:bg-gray-100"
                      onClick={() => handleDismiss(notification)}
                    >
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

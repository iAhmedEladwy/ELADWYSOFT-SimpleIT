import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/authContext';
import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { 
  Bell,
  Package,
  Ticket,
  Users,
  UserCheck,
  ArrowUpCircle,
  FileText,
  Wrench,
  CheckCircle,
  ClipboardCheck,
} from 'lucide-react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useNotifications } from '@/hooks/use-notifications';

export default function Notifications() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [allRead, setAllRead] = useState(false);

  // Use shared notification hook for DB notifications
  const { 
    notifications: dbNotifications, 
    isLoading: dbNotificationsLoading, 
    refetch: refetchNotifications,
    markAllAsRead: hookMarkAllAsRead,
    dismissNotification: hookDismissNotification
  } = useNotifications({
    limit: 100, // Dashboard shows more notifications than bell
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Fetch all data for smart notifications
  const { data: assetsResponse, isLoading: assetsLoading } = useQuery({
    queryKey: ['/api/assets'],
    enabled: !!user,
  });
  const assets = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []);

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets'],
    enabled: !!user,
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    enabled: !!user,
  });

  // Only fetch maintenance if we might need it (user has assets)
  const { data: maintenance, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/asset-maintenance'],
    enabled: !!user && !!assets?.length,
  });

  // Only fetch transactions if we might need it (user has assets)
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/asset-transactions'],
    enabled: !!user && !!assets?.length,
  });

  // Only fetch upgrades if user is Manager/Admin/Super Admin (they need to approve)
  const { data: upgrades, isLoading: upgradesLoading } = useQuery({
    queryKey: ['/api/asset-upgrades'],
    enabled: !!user && (user.role === 'manager' || user.role === 'admin' || user.role === 'super_admin'),
  });

  const isLoading = authLoading || assetsLoading || ticketsLoading || employeesLoading || 
                    maintenanceLoading || transactionsLoading || upgradesLoading || 
                    dbNotificationsLoading;

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
    ticketsAssigned: language === 'English' ? 'Ticket(s) Assigned to You' : 'تذكرة معينة لك',
    urgent: language === 'English' ? 'Urgent' : 'عاجل',
    requireAttention: language === 'English' ? 'requiring your attention' : 'تتطلب انتباهك',
    markedUrgent: language === 'English' ? 'marked as urgent!' : 'عاجل!',
    ticketsCreated: language === 'English' ? 'Ticket(s) You Created' : 'تذكرة أنشأتها',
    inProgress: language === 'English' ? 'In Progress' : 'قيد التنفيذ',
    beingProcessed: language === 'English' ? 'being processed' : 'قيد المعالجة',
    upgradeRequests: language === 'English' ? 'Upgrade Request(s) Awaiting Approval' : 'طلب ترقية في انتظار الموافقة',
    requiresApproval: language === 'English' ? 'requires your approval' : 'تتطلب موافقتك',
    newAssetsAssigned: language === 'English' ? 'New Asset(s) Assigned to You' : 'أصل جديد معين لك',
    assignedLastWeek: language === 'English' ? 'been assigned to you in the last week' : 'تم تعيينه لك في الأسبوع الماضي',
    maintenanceOnAssets: language === 'English' ? 'Maintenance on Your Asset(s)' : 'صيانة على أصولك',
    undergoingMaintenance: language === 'English' ? 'undergoing maintenance' : 'تخضع للصيانة',
    assignedTicketsPending: language === 'English' ? 'Assigned Ticket(s) Pending' : 'تذكرة معينة في الانتظار',
    stillOpen: language === 'English' ? 'still open' : 'لا تزال مفتوحة',
    youHave: language === 'English' ? 'You have' : 'لديك',
    ticket: language === 'English' ? 'ticket' : 'تذكرة',
    tickets: language === 'English' ? 'tickets' : 'تذاكر',
    asset: language === 'English' ? 'asset' : 'أصل',
    assets: language === 'English' ? 'assets' : 'أصول',
    upgrade: language === 'English' ? 'asset upgrade' : 'ترقية أصل',
    upgrades: language === 'English' ? 'asset upgrades' : 'ترقيات أصل',
    require: language === 'English' ? 'require' : 'تتطلب',
    requires: language === 'English' ? 'requires' : 'تتطلب',
    ofYour: language === 'English' ? 'of your' : 'من',
    are: language === 'English' ? 'are' : '',
    is: language === 'English' ? 'is' : '',
    have: language === 'English' ? 'have' : '',
    has: language === 'English' ? 'has' : '',
    youAssigned: language === 'English' ? 'you assigned' : 'قمت بتعيينها',
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const minutes = differenceInMinutes(now, date);
    const hours = differenceInHours(now, date);
    const days = differenceInDays(now, date);

    if (minutes < 1) return t.justNow;
    if (minutes < 60) return `${minutes} ${t.minsAgo}`;
    if (hours < 24) return `${hours} ${t.hoursAgo}`;
    if (days < 7) return `${days} ${t.daysAgo}`;
    return `${Math.floor(days / 7)} ${t.weekAgo}`;
  };

  const notifications = useMemo(() => {
    const generatedNotifications: any[] = [];
    const now = new Date();
    
    if (!user) return [];

    const userEmployee = employees?.find((emp: any) => emp.id === user.employeeId);

    // 1. Tickets assigned to you
    if (tickets && Array.isArray(tickets) && tickets.length > 0) {
      const myAssignedTickets = tickets.filter((ticket: any) => 
        ticket.assignedToId === user.id && 
        (ticket.status === 'Open' || ticket.status === 'In Progress')
      );
      
      if (myAssignedTickets.length > 0) {
        const urgentCount = myAssignedTickets.filter((t: any) => 
          t.priority === 'urgent' || t.priority === 'Critical'
        ).length;
        const mostRecentTicket = myAssignedTickets.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        const title = `${myAssignedTickets.length} ${myAssignedTickets.length > 1 ? t.tickets : t.ticket} ${t.ticketsAssigned}${urgentCount > 0 ? ` (${urgentCount} ${t.urgent})` : ''}`;
        const message = `${t.youHave} ${myAssignedTickets.length} ${myAssignedTickets.length > 1 ? t.tickets : t.ticket} ${t.requireAttention}.${urgentCount > 0 ? ` ${urgentCount} ${t.markedUrgent}` : ''}`;
        
        generatedNotifications.push({
          id: `my-assigned-tickets-${myAssignedTickets.length}`,
          title,
          message,
          time: getTimeAgo(new Date(mostRecentTicket.createdAt)),
          icon: <UserCheck className="h-5 w-5 text-white" />,
          iconColor: urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500',
          unread: true,
          primaryAction: t.viewTickets,
          priority: urgentCount > 0 ? 'critical' : 'high',
        });
      }
    }

    // 2. Tickets you submitted
    if (tickets && Array.isArray(tickets) && tickets.length > 0 && userEmployee) {
      const mySubmittedTickets = tickets.filter((ticket: any) => {
        if (!ticket.createdAt) return false;
        const ticketDate = new Date(ticket.createdAt);
        const hoursOld = differenceInHours(now, ticketDate);
        return ticket.submittedById === userEmployee.id && 
               hoursOld <= 24 && 
               ticket.status !== 'Closed';
      });
      
      if (mySubmittedTickets.length > 0) {
        const inProgressCount = mySubmittedTickets.filter((t: any) => t.status === 'In Progress').length;
        const title = `${mySubmittedTickets.length} ${mySubmittedTickets.length > 1 ? t.tickets : t.ticket} ${t.ticketsCreated}${inProgressCount > 0 ? ` (${inProgressCount} ${t.inProgress})` : ''}`;
        const message = `${mySubmittedTickets.length} ${t.ofYour} ${mySubmittedTickets.length > 1 ? t.tickets : t.ticket} ${mySubmittedTickets.length > 1 ? t.are : t.is} ${t.beingProcessed}.`;
        
        generatedNotifications.push({
          id: `my-submitted-tickets-${mySubmittedTickets.length}`,
          title,
          message,
          time: getTimeAgo(new Date(mySubmittedTickets[0].createdAt)),
          icon: <FileText className="h-5 w-5 text-white" />,
          iconColor: 'bg-indigo-500',
          unread: true,
          primaryAction: t.viewTickets,
          priority: 'medium',
        });
      }
    }

    // 3. Upgrade requests (Managers/Admins/Super Admins)
    if ((user.role === 'Manager' || user.role === 'Admin' || user.role === 'super_admin') && upgrades && upgrades.length > 0) {
      const pendingUpgrades = upgrades.filter((upgrade: any) => 
        upgrade.status === 'pending' || upgrade.status === 'Pending'
      );
      if (pendingUpgrades.length > 0) {
        const title = `${pendingUpgrades.length} ${t.upgradeRequests}`;
        const message = `${pendingUpgrades.length} ${pendingUpgrades.length > 1 ? t.upgrades : t.upgrade} ${pendingUpgrades.length > 1 ? t.require : t.requires} ${t.requiresApproval}.`;
        
        generatedNotifications.push({
          id: `pending-upgrades-${pendingUpgrades.length}`,
          title,
          message,
          time: pendingUpgrades[0].requestDate ? getTimeAgo(new Date(pendingUpgrades[0].requestDate)) : t.justNow,
          icon: <ArrowUpCircle className="h-5 w-5 text-white" />,
          iconColor: 'bg-orange-500',
          unread: true,
          primaryAction: t.viewAssets,
          priority: 'high',
        });
      }
    }

    // 4. Recently assigned assets
    if (userEmployee && assets && assets.length > 0 && transactions && transactions.length > 0) {
      const recentlyAssignedAssets = transactions.filter((trans: any) => {
        if (trans.employeeId !== userEmployee.id || trans.type !== 'Check-Out') return false;
        const transDate = new Date(trans.transactionDate);
        return differenceInDays(now, transDate) <= 7;
      });
      
      if (recentlyAssignedAssets.length > 0) {
        const title = `${recentlyAssignedAssets.length} ${recentlyAssignedAssets.length > 1 ? t.assets : t.asset} ${t.newAssetsAssigned}`;
        const message = `${recentlyAssignedAssets.length} ${recentlyAssignedAssets.length > 1 ? t.assets : t.asset} ${recentlyAssignedAssets.length > 1 ? t.have : t.has} ${t.assignedLastWeek}.`;
        
        generatedNotifications.push({
          id: `my-new-assets-${recentlyAssignedAssets.length}`,
          title,
          message,
          time: getTimeAgo(new Date(recentlyAssignedAssets[0].transactionDate)),
          icon: <Package className="h-5 w-5 text-white" />,
          iconColor: 'bg-green-500',
          unread: true,
          primaryAction: t.viewAssets,
          priority: 'medium',
        });
      }

      // 5. Maintenance on your assets
      if (maintenance && Array.isArray(maintenance) && maintenance.length > 0 && Array.isArray(assets)) {
        const myAssets = assets.filter((asset: any) => asset.assignedEmployeeId === userEmployee.id);
        const myAssetIds = myAssets.map((a: any) => a.id);
        const myAssetMaintenance = maintenance.filter((m: any) => 
          myAssetIds.includes(m.assetId) && 
          (m.status === 'Scheduled' || m.status === 'In Progress')
        );
        
        if (myAssetMaintenance.length > 0) {
          const title = `${t.maintenanceOnAssets}`;
          const message = `${myAssetMaintenance.length} ${t.ofYour} ${myAssetMaintenance.length > 1 ? t.assets : t.asset} ${myAssetMaintenance.length > 1 ? t.are : t.is} ${t.undergoingMaintenance}.`;
          
          generatedNotifications.push({
            id: `my-asset-maintenance-${myAssetMaintenance.length}`,
            title,
            message,
            time: getTimeAgo(new Date(myAssetMaintenance[0].date)),
            icon: <Wrench className="h-5 w-5 text-white" />,
            iconColor: 'bg-yellow-500',
            unread: false,
            primaryAction: t.viewMaintenance,
            priority: 'medium',
          });
        }
      }
    }

    // 6. Tickets you assigned (Managers/Agents/Admins/Super Admins)
    if ((user.role === 'Manager' || user.role === 'Agent' || user.role === 'Admin' || user.role === 'super_admin') && tickets && tickets.length > 0) {
      const ticketsIAssigned = tickets.filter((ticket: any) => {
        if (!ticket.assignedToId || ticket.status === 'Closed') return false;
        const ticketDate = new Date(ticket.createdAt);
        return differenceInDays(now, ticketDate) <= 3;
      });
      
      const openAssignedTickets = ticketsIAssigned.filter((t: any) => t.status === 'Open');
      if (openAssignedTickets.length > 0) {
        const title = `${openAssignedTickets.length} ${t.assignedTicketsPending}`;
        const message = `${openAssignedTickets.length} ${t.ticket} ${t.youAssigned} ${openAssignedTickets.length > 1 ? t.are : t.is} ${t.stillOpen}.`;
        
        generatedNotifications.push({
          id: `tickets-i-assigned-${openAssignedTickets.length}`,
          title,
          message,
          time: getTimeAgo(new Date(openAssignedTickets[0].createdAt)),
          icon: <ClipboardCheck className="h-5 w-5 text-white" />,
          iconColor: 'bg-purple-500',
          unread: false,
          primaryAction: t.viewTickets,
          priority: 'low',
        });
      }
    }

    // Add database notifications
    if (dbNotifications && Array.isArray(dbNotifications)) {
      dbNotifications.forEach((dbNotif: any) => {
        let icon = <Bell className="h-5 w-5 text-white" />;
        let iconColor = 'bg-blue-500';
        let primaryAction = t.viewDetails;
        
        switch (dbNotif.type) {
          case 'Ticket':
            icon = <Ticket className="h-5 w-5 text-white" />;
            primaryAction = t.viewTickets;
            break;
          case 'Asset':
            icon = <Package className="h-5 w-5 text-white" />;
            iconColor = 'bg-green-500';
            primaryAction = t.viewAssets;
            break;
          case 'Employee':
            icon = <Users className="h-5 w-5 text-white" />;
            iconColor = 'bg-purple-500';
            primaryAction = t.viewEmployees;
            break;
          case 'System':
            icon = <CheckCircle className="h-5 w-5 text-white" />;
            iconColor = 'bg-teal-500';
            primaryAction = t.viewChangelog;
            break;
        }

        generatedNotifications.push({
          id: `db-${dbNotif.id}`,
          title: dbNotif.title,
          message: dbNotif.message,
          time: getTimeAgo(new Date(dbNotif.createdAt)),
          icon,
          iconColor,
          unread: !dbNotif.isRead,
          primaryAction,
          priority: !dbNotif.isRead ? 'high' : 'low',
          dbId: dbNotif.id,
        });
      });
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return generatedNotifications.sort((a, b) => 
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
    );
  }, [
    user?.id,
    user?.role,
    user?.employeeId,
    tickets?.length,
    assets?.length,
    employees?.length,
    maintenance?.length,
    transactions?.length,
    upgrades?.length,
    dbNotifications?.length,
    language,
  ]);

  const visibleNotifications = Array.isArray(notifications) 
    ? notifications.filter(n => !dismissedNotifications.includes(n.id))
    : [];

  const handleMarkAllAsRead = async () => {
    setAllRead(true);
    // Use the hook's method for marking all as read
    await hookMarkAllAsRead();
  };

  const handleDismiss = async (notification: any) => {
    if (notification.dbId) {
      // Use the hook's method for dismissing DB notifications
      await hookDismissNotification(notification.dbId);
    } else {
      // For generated notifications, just hide them locally
      setDismissedNotifications(prev => [...prev, notification.id]);
    }
  };

  const handlePrimaryAction = (notification: any) => {
    setAllRead(true);
    
    if (notification.primaryAction === t.viewTickets) {
      setLocation('/tickets');
    } else if (notification.primaryAction === t.viewAssets) {
      setLocation('/assets');
    } else if (notification.primaryAction === t.viewEmployees) {
      setLocation('/employees');
    } else if (notification.primaryAction === t.viewMaintenance) {
      setLocation('/maintenance');
    } else if (notification.primaryAction === t.viewChangelog) {
      setLocation('/changes-log');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-900">{t.allNotifications}</h3>
        <button 
          onClick={handleMarkAllAsRead}
          className="text-primary text-sm hover:underline focus:outline-none"
        >
          {t.markAllAsRead}
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-24 w-full" />
          </div>
        ) : visibleNotifications.length > 0 ? (
          visibleNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={(notification.unread && !allRead) ? "p-4 bg-blue-50" : "p-4"}
            >
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
                      {t.dismiss}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
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
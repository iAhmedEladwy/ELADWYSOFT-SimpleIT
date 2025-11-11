import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/authContext';
import { useMemo } from 'react';

export interface Notification {
  id: number;
  dbId?: number;
  userId?: number;
  title: string;
  message: string;
  type: 'Asset' | 'Ticket' | 'System' | 'Employee';
  entityId?: number;
  isRead: boolean;
  createdAt: Date | string;
  icon?: React.ReactNode;
  iconColor?: string;
  primaryAction?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  unread?: boolean;
  time?: string;
}

export interface UseNotificationsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const { enabled = true, refetchInterval = 30000 } = options;

  // Fetch database notifications
  const {
    data: dbNotifications = [],
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: enabled && !!user,
    refetchInterval, // Auto-refresh every 30 seconds by default
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  // Calculate unread count
  const unreadCount = useMemo(() => {
    if (!Array.isArray(dbNotifications)) return 0;
    return dbNotifications.filter((n: any) => !n.isRead).length;
  }, [dbNotifications]);

  // Get recent notifications (last 5)
  const recentNotifications = useMemo(() => {
    if (!Array.isArray(dbNotifications)) return [];
    return dbNotifications
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [dbNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationIds: number[]) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds }),
      });
      refetch();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const notificationIds = (dbNotifications || []).map((n: any) => n.id);
      if (notificationIds.length > 0) {
        await markAsRead(notificationIds);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      refetch();
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  return {
    notifications: dbNotifications as Notification[],
    recentNotifications: recentNotifications as Notification[],
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  };
}

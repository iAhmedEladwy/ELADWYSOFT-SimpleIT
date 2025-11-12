import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/authContext';
import { useMemo, useRef, useEffect } from 'react';
import { playNotificationTone, getSoundPreference, initAudioContext } from '@/lib/notificationSound';

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
  limit?: number; // Limit number of notifications fetched (default: 50)
  enableSound?: boolean; // Enable sound for new notifications (default: true)
  pollingStrategy?: 'fixed' | 'adaptive' | 'visibility'; // Polling strategy
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const { 
    enabled = true, 
    refetchInterval = 30000, 
    limit = 50,
    enableSound = true,
    pollingStrategy = 'adaptive'
  } = options;

  // Track previous notification IDs to detect new ones
  const previousNotificationIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);

  // Initialize audio context on mount (requires user interaction)
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext();
      // Remove listener after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  // Calculate dynamic refetch interval based on strategy
  const dynamicRefetchInterval = useMemo(() => {
    if (refetchInterval === false) return false;

    switch (pollingStrategy) {
      case 'fixed':
        return refetchInterval;
      
      case 'adaptive':
        // Faster polling when page is active, slower when idle
        return typeof document !== 'undefined' && document.hasFocus() 
          ? refetchInterval 
          : refetchInterval * 2; // Double interval when not focused
      
      case 'visibility':
        // Only poll when page is visible
        return typeof document !== 'undefined' && !document.hidden
          ? refetchInterval
          : false; // Stop polling when hidden
      
      default:
        return refetchInterval;
    }
  }, [refetchInterval, pollingStrategy]);

  // Fetch database notifications
  const {
    data: dbNotifications = [],
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ['/api/notifications', { limit }],
    queryFn: async () => {
      const response = await fetch(`/api/notifications?limit=${limit}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: enabled && !!user,
    refetchInterval: dynamicRefetchInterval,
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  // Detect new notifications and play sound
  useEffect(() => {
    if (!Array.isArray(dbNotifications) || dbNotifications.length === 0) return;

    // Skip on first load to avoid playing sound for existing notifications
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      // Store initial notification IDs
      previousNotificationIds.current = new Set(
        dbNotifications.map((n: any) => n.id)
      );
      return;
    }

    // Check for new notifications
    const currentIds = new Set(dbNotifications.map((n: any) => n.id));
    const newNotifications = dbNotifications.filter(
      (n: any) => !previousNotificationIds.current.has(n.id) && !n.isRead
    );

    // Play sound if there are new unread notifications
    if (newNotifications.length > 0 && enableSound && getSoundPreference()) {
      playNotificationTone();
    }

    // Update previous notification IDs
    previousNotificationIds.current = currentIds;
  }, [dbNotifications, enableSound]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    if (!Array.isArray(dbNotifications)) return 0;
    return dbNotifications.filter((n: any) => !n.isRead).length;
  }, [dbNotifications]);

  // Get recent notifications (last 5, already sorted by server in descending order)
  const recentNotifications = useMemo(() => {
    if (!Array.isArray(dbNotifications)) return [];
    // Server returns sorted by createdAt DESC, so just take first 5
    return dbNotifications.slice(0, 5);
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

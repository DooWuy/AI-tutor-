import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Notification as AppNotification } from '../services/notificationApi';
import { 
  getMyNotifications, 
  markNotificationAsRead as apiMarkAsRead, 
  markAllNotificationsAsRead as apiMarkAllAsRead 
} from '../services/notificationApi';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Connect to STOMP WebSocket
  const { lastMessage } = useWebSocket(token);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      setIsLoading(true);
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Request browser notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Listen to incoming WebSocket notification
  useEffect(() => {
    if (!lastMessage) return;

    setNotifications((prev) => [lastMessage, ...prev]);

    // Show floating toast alert
    toast.info(lastMessage.message, {
      title: lastMessage.title || 'Thông báo mới',
      duration: 6000,
    });

    // Native Browser Notification if window is in background
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new window.Notification(lastMessage.title || 'AI Tutor', {
          body: lastMessage.message,
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error('Browser notification error:', e);
      }
    }
  }, [lastMessage, toast]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiMarkAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const value = useMemo<NotificationContextType>(() => ({
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications,
  }), [notifications, unreadCount, isLoading, markAsRead, markAllAsRead, fetchNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

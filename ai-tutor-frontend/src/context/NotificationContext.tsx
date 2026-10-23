import React, { createContext, useContext, useMemo, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import { getNotificationFeed, getNotificationUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationApi';
import { NotificationStore, type NotificationState } from '../services/notificationStore';
import type { Notification as AppNotification } from '../types/notification';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';

export interface NotificationContextType extends NotificationState {
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const userId = isAuthenticated ? user?.userId ?? null : null;
  const store = useMemo(() => new NotificationStore({ feed: getNotificationFeed, count: getNotificationUnreadCount,
    read: markNotificationAsRead, readAll: markAllNotificationsAsRead }), [userId]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const onNotification = useCallback((notification: AppNotification) => {
    if (!store.receive(notification)) return;
    toast.info(notification.message, { title: notification.title, duration: 6000 });
    if (document.hidden && 'Notification' in window && window.Notification.permission === 'granted') {
      try { new window.Notification(notification.title, { body: notification.message, tag: notification.id }); }
      catch { /* Browser notifications are optional; in-app delivery remains available. */ }
    }
  }, [store, toast]);
  const onReconnect = useCallback(() => { void store.refresh(); }, [store]);
  const { isConnected } = useWebSocket(token, userId, onNotification, onReconnect);

  useEffect(() => {
    store.activate();
    if (userId) void store.refresh();
    return () => store.dispose();
  }, [store, userId]);

  useEffect(() => {
    if (!userId) return;
    const resume = () => { if (!document.hidden) void store.refresh(); };
    const timer = window.setInterval(() => { if (!document.hidden && !isConnected) void store.refresh(); }, 30000);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
    };
  }, [store, userId, isConnected]);

  const value = useMemo<NotificationContextType>(() => ({ ...state, isConnected,
    markAsRead: store.markAsRead, markAllAsRead: store.markAllAsRead,
    refreshNotifications: store.refresh, loadMore: store.loadMore }), [state, isConnected, store]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

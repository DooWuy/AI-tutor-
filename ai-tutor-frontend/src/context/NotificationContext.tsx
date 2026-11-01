import React, { createContext, useContext, useMemo, useEffect, useCallback, useSyncExternalStore, useRef, useState, type ReactNode } from 'react';
import { getNotificationFeed, getNotificationUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationApi';
import { NotificationStore, type NotificationState } from '../services/notificationStore';
import type { Notification as AppNotification } from '../types/notification';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';

export interface NotificationContextType extends NotificationState {
  isConnected: boolean;
  permission: NotificationPermission | 'unsupported';
  requestDesktopPermission: () => Promise<NotificationPermission | 'unsupported'>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function playNotificationSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    /* AudioContext may be blocked before first user gesture */
  }
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const userId = isAuthenticated ? user?.userId ?? null : null;
  const store = useMemo(() => new NotificationStore({ feed: getNotificationFeed, count: getNotificationUnreadCount,
    read: markNotificationAsRead, readAll: markAllNotificationsAsRead }), [userId]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return window.Notification.permission;
  });

  const requestDesktopPermission = useCallback(async (): Promise<NotificationPermission | 'unsupported'> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    try {
      const result = await window.Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      setPermission('denied');
      return 'denied';
    }
  }, []);

  const showDesktopNotification = useCallback((notification: AppNotification) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;
    try {
      const notif = new window.Notification(notification.title, {
        body: notification.message,
        tag: notification.id,
      });
      notif.onclick = () => {
        try { window.focus(); } catch { /* ignore */ }
        if (notification.link && typeof window !== 'undefined') {
          window.location.href = notification.link;
        }
      };
    } catch {
      /* Browser notifications are optional; in-app delivery remains available. */
    }
  }, []);

  const alertedIdsRef = useRef<Set<string>>(new Set());

  const onNotification = useCallback((notification: AppNotification) => {
    if (!store.receive(notification)) return;
    const isClassReminder = notification.type === 'CLASS_REMINDER';
    const notifyToast = isClassReminder && typeof toast?.warning === 'function' ? toast.warning : toast.info;
    notifyToast(notification.message, {
      title: notification.title,
      duration: isClassReminder ? 10000 : 6000,
      action: isClassReminder ? {
        label: 'Xem lịch',
        onClick: () => {
          if (notification.link && typeof window !== 'undefined') window.location.href = notification.link;
        }
      } : undefined
    });
    if (isClassReminder) {
      alertedIdsRef.current.add(notification.id);
      try { sessionStorage.setItem(`aitutor_alerted_${notification.id}`, '1'); } catch { /* ignore */ }
      playNotificationSound();
    }
    showDesktopNotification(notification);
  }, [store, toast, showDesktopNotification]);

  const onReconnect = useCallback(() => { void store.refresh(); }, [store]);
  const { isConnected } = useWebSocket(token, userId, onNotification, onReconnect);

  // Catch up unread class reminders upon initial feed fetch / reconnect / soft refresh
  useEffect(() => {
    if (!state.notifications || state.notifications.length === 0) return;
    const now = Date.now();
    for (const item of state.notifications) {
      if (item.type !== 'CLASS_REMINDER' || item.isRead) continue;
      if (alertedIdsRef.current.has(item.id)) continue;

      let isRelevant = false;
      const startsAtStr = item.metadata?.startsAt;
      if (typeof startsAtStr === 'string') {
        const startsAt = Date.parse(startsAtStr);
        if (!isNaN(startsAt)) {
          const diffMinutes = (startsAt - now) / 60000;
          // Class is starting in <= 20 minutes or started within the last 15 minutes
          if (diffMinutes >= -15 && diffMinutes <= 20) {
            isRelevant = true;
          }
        }
      } else {
        const createdAt = Date.parse(item.createdAt);
        if (!isNaN(createdAt) && (now - createdAt) <= 15 * 60 * 1000) {
          isRelevant = true;
        }
      }

      if (isRelevant) {
        alertedIdsRef.current.add(item.id);
        let alreadyAlertedInSession = false;
        try {
          if (sessionStorage.getItem(`aitutor_alerted_${item.id}`) === '1') {
            alreadyAlertedInSession = true;
          } else {
            sessionStorage.setItem(`aitutor_alerted_${item.id}`, '1');
          }
        } catch { /* storage fallback */ }

        if (!alreadyAlertedInSession) {
          const notifyToast = typeof toast?.warning === 'function' ? toast.warning : toast.info;
          notifyToast(item.message, {
            title: item.title,
            duration: 10000,
            action: {
              label: 'Xem lịch',
              onClick: () => {
                if (item.link && typeof window !== 'undefined') window.location.href = item.link;
              }
            }
          });
          playNotificationSound();
          showDesktopNotification(item);
        }
      }
    }
  }, [state.notifications, toast, showDesktopNotification]);

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
    permission, requestDesktopPermission,
    markAsRead: store.markAsRead, markAllAsRead: store.markAllAsRead,
    refreshNotifications: store.refresh, loadMore: store.loadMore }), [state, isConnected, permission, requestDesktopPermission, store]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

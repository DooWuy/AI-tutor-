import { useEffect, useState } from 'react';
import { getStoredSession } from '../services/authApi';
import { createNotificationConnection, websocketUrl } from '../services/notificationConnection';
import type { Notification } from '../types/notification';

export const useWebSocket = (token: string | null, userId: string | null,
  onNotification: (notification: Notification) => void, onReconnect: () => void) => {
  const [connection, setConnection] = useState({ userId: null as string | null, connected: false });

  useEffect(() => {
    if (!token || !userId) return;
    setConnection({ userId, connected: false });
    return createNotificationConnection({
      url: websocketUrl(import.meta.env.VITE_WS_URL, import.meta.env.VITE_API_BASE_URL, window.location.href),
      getToken: () => { const session = getStoredSession(); return session?.user.userId === userId ? session.accessToken : null; },
      onNotification,
      onConnectionChange: connected => { setConnection({ userId, connected }); if (connected) onReconnect(); },
      dev: import.meta.env.DEV,
    });
  }, [token, userId, onNotification, onReconnect]);

  return { isConnected: Boolean(token && userId && connection.userId === userId && connection.connected) };
};

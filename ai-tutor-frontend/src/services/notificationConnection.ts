import { Client } from '@stomp/stompjs';
import type { Notification } from '../types/notification';
import { isNotification } from './notificationValidation';

export function websocketUrl(explicit: string | undefined, apiBase: string | undefined, pageUrl: string): string {
  if (explicit) return new URL(explicit, pageUrl).href;
  const url = new URL(apiBase || 'http://localhost:8088/api/v1', pageUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.href;
}

export interface NotificationConnectionOptions {
  url: string;
  getToken: () => string | null;
  onNotification: (notification: Notification) => void;
  onConnectionChange: (connected: boolean) => void;
  dev?: boolean;
}

/** Injectable STOMP factory keeps reconnect, burst delivery and cleanup testable without React. */
export function createNotificationConnection(options: NotificationConnectionOptions, createClient: () => Client = () => new Client()) {
  let alive = true;
  const client = createClient();
  const debug = (event: string) => { if (options.dev) console.debug(`[Notifications] ${event}`); };
  client.configure({ brokerURL: options.url, reconnectDelay: 5000, heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000, debug: () => {}, // STOMP's raw debug frames include the Authorization header.
    beforeConnect: async () => {
      const token = alive ? options.getToken() : null;
      if (!token) { await client.deactivate(); return; }
      client.connectHeaders = { Authorization: `Bearer ${token}` };
    },
    onConnect: () => {
      if (!alive) return;
      client.subscribe('/user/queue/notifications', frame => {
        if (!alive) return;
        try {
          const payload: unknown = JSON.parse(frame.body);
          if (isNotification(payload)) options.onNotification(payload);
          else debug('Ignored invalid notification');
        } catch { debug('Ignored malformed notification'); }
      });
      debug('Connected');
      options.onConnectionChange(true);
    },
    onWebSocketClose: () => { if (alive) { debug('Disconnected'); options.onConnectionChange(false); } },
    onDisconnect: () => { if (alive) options.onConnectionChange(false); },
    onWebSocketError: () => { if (alive) options.onConnectionChange(false); },
    onStompError: () => {
      if (!alive) return;
      debug('Broker rejected connection');
      options.onConnectionChange(false);
      client.forceDisconnect();
    },
  });
  client.activate();
  return () => {
    alive = false;
    void client.deactivate().catch(() => debug('Connection cleanup failed'));
  };
}

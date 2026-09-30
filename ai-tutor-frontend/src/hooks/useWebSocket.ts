import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';

export const useWebSocket = (token: string | null) => {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8088/ws';

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: function (str) {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function (frame) {
      setIsConnected(true);
      console.log('Connected: ' + frame);
      
      // The backend sends to "/user/queue/notifications"
      client.subscribe('/user/queue/notifications', (message: IMessage) => {
        if (message.body) {
          const body = JSON.parse(message.body);
          setLastMessage(body);
        }
      });
    };

    client.onStompError = function (frame) {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [token]);

  return { isConnected, lastMessage };
};

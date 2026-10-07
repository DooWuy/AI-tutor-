import { Client, type StompSubscription, type IMessage } from '@stomp/stompjs';
import { getStoredSession } from './authApi';

export interface ChatSession {
  id: string;
  studentId?: string;
  subject: string;
  title: string;
  status: string;
  createdAt: string;
  lastMessageAt?: string | null;
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  senderType: 'STUDENT' | 'AI';
  content: string;
  audioUrl?: string;
  intent?: string;
  citationLinks?: any[];
  createdAt: string;
}

export interface ChatStreamEvent {
  type: 'token' | 'citations' | 'done' | 'error';
  content?: string;
  message?: string;
  citations?: any[];
}

export interface ChatStreamCallbacks {
  onToken?: (token: string) => void;
  onCitations?: (citations: any[]) => void;
  onDone?: () => void;
  onError?: (errorMessage: string) => void;
}

export class ChatApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

function resolveErrorMessage(payload: any, status: number): string {
  if (payload?.error && typeof payload.error === 'object') {
    const values = Object.values(payload.error);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }
  if (payload?.message && typeof payload.message === 'string') {
    return payload.message;
  }
  if (status === 400) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thao tác trên phiên chat này.';
  if (status === 404) return 'Phiên chat không tồn tại hoặc đã bị xóa.';
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  return `Yêu cầu thất bại (mã ${status}). Vui lòng thử lại.`;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null;
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function fetchApi<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new ChatApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.', 0);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const payload = await parseJson<any>(response);

  if (!response.ok) {
    const message = resolveErrorMessage(payload, response.status);
    const fieldErrors = payload?.error && typeof payload.error === 'object' ? payload.error : undefined;
    throw new ChatApiError(message, response.status, fieldErrors);
  }

  return (payload?.data !== undefined ? payload.data : payload) as T;
}

export const getChatSessions = async (): Promise<ChatSession[]> => {
  return fetchApi('/chat-sessions');
};

export const getChatSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  return fetchApi(`/chat-sessions/${sessionId}/messages`);
};

export const createChatSession = async (subject: string): Promise<ChatSession> => {
  return fetchApi(`/chat-sessions?subject=${encodeURIComponent(subject)}`, { method: 'POST' });
};

export const renameChatSession = async (sessionId: string, title: string): Promise<ChatSession> => {
  return fetchApi(`/chat-sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: title.trim() }),
  });
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
  await fetchApi(`/chat-sessions/${sessionId}`, {
    method: 'DELETE',
  });
};

// WebSocket STOMP Client Helpers
export function createChatStompClient(token?: string, options?: { onConnect?: () => void; onError?: (err: any) => void }): Client {
  const authToken = token || getStoredSession()?.accessToken || '';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8088/ws';

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => {
      if (import.meta.env.DEV) {
        console.debug('[STOMP]', str);
      }
    },
  });

  if (options?.onConnect) {
    client.onConnect = () => options.onConnect?.();
  }
  if (options?.onError) {
    client.onStompError = (frame) => options.onError?.(frame);
    client.onWebSocketError = (event) => options.onError?.(event);
  }

  return client;
}

export function subscribeChatSessionStream(
  client: Client,
  sessionId: string,
  callbacks: ChatStreamCallbacks
): StompSubscription {
  return client.subscribe(`/user/queue/chat-sessions/${sessionId}/stream`, (message: IMessage) => {
    try {
      const event: ChatStreamEvent = JSON.parse(message.body);
      if (event.type === 'token') {
        callbacks.onToken?.(event.content || '');
      } else if (event.type === 'citations') {
        callbacks.onCitations?.(event.citations || []);
      } else if (event.type === 'done') {
        callbacks.onDone?.();
      } else if (event.type === 'error') {
        callbacks.onError?.(event.message || 'Đã có lỗi xảy ra trong quá trình phản hồi.');
      }
    } catch (e) {
      console.error('Lỗi phân tích stream message:', e);
      callbacks.onError?.('Dữ liệu phản hồi không hợp lệ.');
    }
  });
}

export function publishChatMessage(
  client: Client,
  sessionId: string,
  message: string
): void {
  client.publish({
    destination: `/app/chat-sessions/${sessionId}/messages`,
    body: JSON.stringify({ message: message.trim() }),
  });
}

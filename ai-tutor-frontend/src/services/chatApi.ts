export interface ChatSession {
  id: string;
  studentId: string;
  subject: string;
  title: string;
  status: string;
  createdAt: string;
  lastMessageAt: string;
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null;
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

async function fetchApi(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: 'include' });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const payload = await parseJson<any>(response);
  return payload?.data !== undefined ? payload.data : payload;
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


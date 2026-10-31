import type { Notification, NotificationFeed } from '../types/notification';
import { isRecord, parseNotificationFeed } from './notificationValidation';
export type { Notification, NotificationMetadata, NotificationType, NotificationFeed } from '../types/notification';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

async function request(path: string, method = 'GET', signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}/notifications${path}`, { method, credentials: 'include', signal });
  const payload: unknown = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  if (!response.ok || !isRecord(payload) || payload.success !== true) {
    throw new Error(isRecord(payload) && typeof payload.message === 'string' ? payload.message : `Không thể cập nhật thông báo (HTTP ${response.status}).`);
  }
  return payload.data;
}

export const getNotificationFeed = async (options: { cursor?: string; size?: number; unreadOnly?: boolean } = {}, signal?: AbortSignal): Promise<NotificationFeed> => {
  const query = new URLSearchParams();
  if (options.cursor) query.set('cursor', options.cursor);
  if (options.size !== undefined) query.set('size', String(options.size));
  if (options.unreadOnly !== undefined) query.set('unreadOnly', String(options.unreadOnly));
  const suffix = query.toString();
  return parseNotificationFeed(await request(`/feed${suffix ? `?${suffix}` : ''}`, 'GET', signal));
};

export const getMyNotifications = async (): Promise<Notification[]> => (await getNotificationFeed()).items;

export const getNotificationUnreadCount = async (signal?: AbortSignal): Promise<number> => {
  const data = await request('/unread-count', 'GET', signal);
  if (!isRecord(data) || typeof data.unreadCount !== 'number' || !Number.isSafeInteger(data.unreadCount) || data.unreadCount < 0) {
    throw new Error('Số thông báo chưa đọc không hợp lệ.');
  }
  return data.unreadCount;
};

export const markNotificationAsRead = async (id: string, signal?: AbortSignal): Promise<void> => {
  await request(`/${encodeURIComponent(id)}/read`, 'PUT', signal);
};

export const markAllNotificationsAsRead = async (signal?: AbortSignal): Promise<void> => {
  await request('/read-all', 'PUT', signal);



};

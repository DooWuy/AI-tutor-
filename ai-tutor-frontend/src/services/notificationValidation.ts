import type { Notification, NotificationFeed } from '../types/notification';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const instant = (value: unknown): value is string => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

export function isNotification(value: unknown): value is Notification {
  if (!isRecord(value) || typeof value.id !== 'string' || !uuid.test(value.id)
    || typeof value.type !== 'string' || !value.type.trim()
    || typeof value.title !== 'string' || !value.title.trim()
    || typeof value.message !== 'string' || !value.message.trim()
    || (value.link !== null && typeof value.link !== 'string')
    || typeof value.isRead !== 'boolean' || !instant(value.createdAt) || !isRecord(value.metadata)) return false;
  for (const key of ['scheduleId', 'slotId', 'quizId', 'jobId', 'classId', 'enrollmentId', 'studentId']) {
    if (value.metadata[key] !== undefined && (typeof value.metadata[key] !== 'string' || !uuid.test(value.metadata[key]))) return false;
  }
  for (const key of ['subject', 'room', 'className', 'studentName']) {
    if (value.metadata[key] !== undefined && typeof value.metadata[key] !== 'string') return false;
  }
  if (value.metadata.enrollmentStatus !== undefined && !['PENDING', 'APPROVED', 'REJECTED'].includes(String(value.metadata.enrollmentStatus))) return false;
  const statuses: Record<string, string> = { STUDY_CLASS_JOIN_REQUESTED: 'PENDING', STUDY_CLASS_JOIN_APPROVED: 'APPROVED', STUDY_CLASS_JOIN_REJECTED: 'REJECTED' };
  if (statuses[value.type]) {
    const metadata = value.metadata;
    if (!metadata.classId || !metadata.enrollmentId || typeof metadata.className !== 'string' || !metadata.className.trim()
      || metadata.enrollmentStatus !== statuses[value.type]) return false;
    if (value.type === 'STUDY_CLASS_JOIN_REQUESTED' && (!metadata.studentId || typeof metadata.studentName !== 'string' || !metadata.studentName.trim())) return false;
  }
  return value.metadata.startsAt === undefined || instant(value.metadata.startsAt);
}

export function parseNotificationFeed(value: unknown): NotificationFeed {
  if (!isRecord(value) || !Array.isArray(value.items)
    || (value.nextCursor !== null && typeof value.nextCursor !== 'string')
    || typeof value.unreadCount !== 'number' || !Number.isSafeInteger(value.unreadCount) || value.unreadCount < 0) {
    throw new Error('Dữ liệu thông báo không hợp lệ. Vui lòng thử lại.');
  }
  return { items: value.items.filter(isNotification), nextCursor: value.nextCursor, unreadCount: value.unreadCount };
}

export function safeNotificationLink(link: string | null, role: string): string | null {
  if (!link || !link.startsWith('/') || link.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(link)) return null;
  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) return null;
  const url = new URL(link, 'https://notification.invalid');
  if (url.origin !== 'https://notification.invalid' || !url.pathname.startsWith(`/${role.toLowerCase()}/`)) return null;
  return url.pathname + url.search + url.hash;
}

import type { ApiResponse } from '../types/auth'
import type { NotificationList, ReminderPreferences, StudyNotification } from '../types/notification'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '')

export class NotificationApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function notificationSocketUrl(): string {
  const url = new URL(API_BASE_URL, window.location.origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/ws'
  url.search = ''
  url.hash = ''
  return url.toString()
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null
  return response.json() as Promise<ApiResponse<T>>
}

function resolveErrorMessage(payload: ApiResponse<unknown> | null, status: number) {
  if (payload?.error && typeof payload.error === 'object') {
    const firstError = Object.values(payload.error)[0]
    if (firstError) return String(firstError)
  }
  if (payload?.message && typeof payload.message === 'string') return payload.message
  return `Thao tác không thành công (HTTP ${status}). Vui lòng thử lại.`
}

async function request<T>(path: string, init?: RequestInit, requireData = true): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const payload = await parseJson<T>(response)
  if (!response.ok || !payload?.success || (requireData && (payload?.data === undefined || payload?.data === null))) {
    throw new NotificationApiError(resolveErrorMessage(payload, response.status), response.status)
  }
  return payload.data as T
}

export function listNotifications(limit = 20): Promise<NotificationList> {
  return request<NotificationList>(`/notifications?limit=${limit}`)
}

export function getNotification(id: string): Promise<StudyNotification> {
  return request<StudyNotification>(`/notifications/${id}`)
}

export function markNotificationRead(id: string): Promise<StudyNotification> {
  return request<StudyNotification>(`/notifications/${id}/read`, { method: 'POST' })
}

export function markAllNotificationsRead(): Promise<void> {
  return request<void>('/notifications/read-all', { method: 'POST' }, false)
}

export function getReminderPreferences(): Promise<ReminderPreferences> {
  return request<ReminderPreferences>('/notifications/preferences')
}

export function updateReminderPreferences(enabled: boolean): Promise<ReminderPreferences> {
  return request<ReminderPreferences>('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  })
}

export function isSafeStudentPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/student/') && !path.startsWith('//')
}

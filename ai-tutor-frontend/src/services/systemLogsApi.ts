import { getStoredSession } from './authApi';
import type { PageResponseDTO } from '../types/skills';
import type { SystemLogFilterParams, SystemLogItem } from '../types/systemLogs';
import type { ApiResponse } from '../types/auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

function authHeaders(json = true): HeadersInit {
  const token = getStoredSession()?.accessToken;
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null;
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export class SystemLogsApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SystemLogsApiError';
    this.status = status;
  }
}

function errorMessage(payload: ApiResponse<unknown> | null, status: number) {
  if (payload?.message) return payload.message;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền xem nhật ký hệ thống.';
  return 'Thao tác không thành công. Vui lòng thử lại.';
}

export const systemLogsApi = {
  async fetchLogs(params: SystemLogFilterParams = {}): Promise<PageResponseDTO<SystemLogItem>> {
    const search = new URLSearchParams();
    if (params.level) search.set('level', params.level);
    if (params.keyword) search.set('keyword', params.keyword);
    if (params.fromDate) search.set('fromDate', params.fromDate);
    if (params.toDate) search.set('toDate', params.toDate);
    if (params.page) search.set('page', String(params.page));
    if (params.size) search.set('size', String(params.size));
    if (params.direction) search.set('direction', params.direction);

    const qs = search.toString();
    const response = await fetch(`${API_BASE_URL}/admin/logs${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(false),
      credentials: 'include',
    });

    const payload = await parseJson<PageResponseDTO<SystemLogItem>>(response);
    if (!response.ok || !payload) {
      throw new SystemLogsApiError(errorMessage(payload as unknown as ApiResponse<unknown>, response.status), response.status);
    }
    return payload;
  },

  async purgeOldLogs(daysOld = 30): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/admin/logs/purge?daysOld=${daysOld}`, {
      method: 'DELETE',
      headers: authHeaders(false),
      credentials: 'include',
    });
    const payload = await parseJson<ApiResponse<number>>(response);
    if (!response.ok || payload?.data === undefined) {
      throw new SystemLogsApiError(errorMessage(payload, response.status), response.status);
    }
    return payload.data;
  },
};

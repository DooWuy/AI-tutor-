import { getStoredSession } from './authApi';
import type { MaintenanceStatus, SystemSettingsGroupMap } from '../types/systemSettings';
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

export class SystemSettingsApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SystemSettingsApiError';
    this.status = status;
  }
}

function errorMessage(payload: ApiResponse<unknown> | null, status: number) {
  if (payload?.message) return payload.message;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền quản trị hệ thống.';
  return 'Thao tác cài đặt không thành công. Vui lòng thử lại.';
}

export const systemSettingsApi = {
  async fetchSettings(): Promise<SystemSettingsGroupMap> {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      headers: authHeaders(false),
      credentials: 'include',
    });
    const payload = await parseJson<ApiResponse<SystemSettingsGroupMap>>(response);
    if (!response.ok || !payload) {
      throw new SystemSettingsApiError(errorMessage(payload, response.status), response.status);
    }
    return payload.data || {};
  },

  async updateSettings(settings: Record<string, string>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: authHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) {
      const payload = await parseJson<ApiResponse<unknown>>(response);
      throw new SystemSettingsApiError(errorMessage(payload, response.status), response.status);
    }
  },

  async fetchMaintenanceStatus(): Promise<MaintenanceStatus> {
    const response = await fetch(`${API_BASE_URL}/admin/maintenance/status`, {
      headers: authHeaders(false),
      credentials: 'include',
    });
    const payload = await parseJson<ApiResponse<MaintenanceStatus>>(response);
    if (!response.ok || !payload) {
      throw new SystemSettingsApiError(errorMessage(payload, response.status), response.status);
    }
    return payload.data || { enabled: false, message: '' };
  },

  async toggleMaintenance(enabled: boolean, message?: string): Promise<MaintenanceStatus> {
    const response = await fetch(`${API_BASE_URL}/admin/maintenance/toggle`, {
      method: 'POST',
      headers: authHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ enabled, message }),
    });
    const payload = await parseJson<ApiResponse<MaintenanceStatus>>(response);
    if (!response.ok || !payload) {
      throw new SystemSettingsApiError(errorMessage(payload, response.status), response.status);
    }
    return payload.data || { enabled, message: message || '' };
  },
};

import { getStoredSession } from './authApi';

export type AccountRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export interface Account {
  userId: string; username: string; fullName: string; email: string;
  role: AccountRole; active: boolean; createdAt: string;
}
export interface AccountPage { content: Account[]; page: number; size: number; totalElements: number; totalPages: number }
export interface AccountFilters { search: string; role: string; active: string; page: number; size: number; sort: string; direction: string }
const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

async function request(path: string, init: RequestInit = {}) {
  const token = getStoredSession()?.accessToken;
  const response = await fetch(`${base}/users${path}`, {
    ...init, credentials: 'include',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      : response.status === 403 ? 'Bạn không có quyền quản lý tài khoản.'
      : payload?.message || 'Không thể thực hiện thao tác. Vui lòng thử lại.');
  }
  return payload;
}
export async function searchAccounts(filters: AccountFilters, signal?: AbortSignal): Promise<AccountPage> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== '') query.set(key, String(value)); });
  const result = await request(`/accounts?${query}`, { signal });
  if (!result || !Array.isArray(result.content)) throw new Error('Phản hồi danh sách tài khoản không hợp lệ.');
  return result;
}
export async function setAccountStatus(userId: string, active: boolean): Promise<Account> {
  const result = await request(`/${encodeURIComponent(userId)}/status`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }),
  });
  if (!result?.success || !result.data) throw new Error(result?.message || 'Không thể cập nhật trạng thái.');
  return result.data;
}

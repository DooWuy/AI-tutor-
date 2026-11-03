import { getStoredSession } from './authApi';
export interface AdminDashboard { totalUsers: number; totalDocuments: number; totalQuizzes: number; chatCount: number; attemptCount: number; updatedAt: string }
export async function fetchAdminDashboard(signal?: AbortSignal): Promise<AdminDashboard> {
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');
  const token = getStoredSession()?.accessToken;
  const response = await fetch(`${base}/dashboard/admin`, { signal, credentials: 'include', cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' : response.status === 403 ? 'Bạn không có quyền xem tổng quan.' : 'Không thể tải tổng quan. Vui lòng thử lại.');
  const data = body?.data;
  if (!body?.success || !data || !['totalUsers','totalDocuments','totalQuizzes','chatCount','attemptCount'].every(k => Number.isSafeInteger(data[k]) && data[k] >= 0) || typeof data.updatedAt !== 'string' || !Number.isFinite(Date.parse(data.updatedAt))) throw new Error('Dữ liệu tổng quan không hợp lệ.');
  return data;
}

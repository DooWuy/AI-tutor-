import type { ApiResponse } from '../types/auth';
import type {
  AdminStudentDetail,
  AdminStudentListItem,
  AdminStudentListParams,
  ApiFieldErrors,
  CreateAdminStudentPayload,
  PageResponse,
  StudentStatusUpdate,
  UpdateAdminStudentPayload,
} from '../types/adminStudent';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');
const STUDENTS_PATH = '/admin/students';

export class AdminStudentApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldErrors;

  constructor(
    message: string,
    status: number,
    fieldErrors: ApiFieldErrors = {},
  ) {
    super(message);
    this.name = 'AdminStudentApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function parseJson<T>(response: Response): Promise<T | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null;
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

function apiError(payload: ApiResponse<unknown> | null, status: number) {
  const rawError = payload?.error;
  const fieldErrors = rawError && typeof rawError === 'object' && !Array.isArray(rawError)
    ? Object.fromEntries(Object.entries(rawError).map(([key, value]) => [key, String(value)]))
    : {};
  const firstFieldError = Object.values(fieldErrors)[0];
  const message = firstFieldError
    || (typeof rawError === 'string' ? rawError : '')
    || payload?.message
    || (status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : '')
    || (status === 403 ? 'Bạn không có quyền quản lý học sinh.' : '')
    || (status === 404 ? 'Không tìm thấy học sinh.' : '')
    || 'Không thể hoàn thành thao tác. Vui lòng thử lại.';
  return new AdminStudentApiError(message, status, fieldErrors);
}

async function fetchApi(path: string, init: RequestInit = {}) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: 'include' });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new AdminStudentApiError('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.', 0);
  }
}

async function requestWrapped<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchApi(path, init);
  const payload = await parseJson<ApiResponse<T>>(response);
  if (!response.ok || !payload?.success) throw apiError(payload, response.status);
  return payload.data;
}

function toQuery(params: AdminStudentListParams) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export async function fetchStudents(params: AdminStudentListParams = {}, signal?: AbortSignal): Promise<PageResponse<AdminStudentListItem>> {
  const query = toQuery(params);
  const response = await fetchApi(`${STUDENTS_PATH}${query ? `?${query}` : ''}`, { signal });
  const payload = await parseJson<PageResponse<AdminStudentListItem> | ApiResponse<unknown>>(response);
  if (!response.ok) throw apiError(payload as ApiResponse<unknown> | null, response.status);
  if (!payload || !('content' in payload) || !Array.isArray(payload.content)) {
    throw new AdminStudentApiError('Phản hồi danh sách học sinh không hợp lệ.', response.status);
  }
  return payload;
}

export function fetchStudentDetail(studentId: string) {
  return requestWrapped<AdminStudentDetail>(`${STUDENTS_PATH}/${encodeURIComponent(studentId)}`);
}

export function createStudent(payload: CreateAdminStudentPayload) {
  return requestWrapped<AdminStudentDetail>(STUDENTS_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateStudent(studentId: string, payload: UpdateAdminStudentPayload) {
  return requestWrapped<AdminStudentDetail>(`${STUDENTS_PATH}/${encodeURIComponent(studentId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function toggleStudentStatus(studentId: string) {
  return requestWrapped<StudentStatusUpdate>(`${STUDENTS_PATH}/${encodeURIComponent(studentId)}/status`, { method: 'PATCH' });
}

export function deleteStudent(studentId: string) {
  return requestWrapped<string>(`${STUDENTS_PATH}/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
}

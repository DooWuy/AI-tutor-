import type { ApiResponse } from '../types/auth';
import type { StudyClass, StudyClassCreateInput, StudyClassJoinResult, StudyClassList, StudyMember } from '../types/studyClass';
import { getStoredSession } from './authApi';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export class StudyClassApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StudyClassApiError';
    this.status = status;
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredSession()?.accessToken;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: authHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new StudyClassApiError('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.', 0);
  }
  const payload = response.headers.get('content-type')?.includes('application/json')
    ? await response.json() as ApiResponse<T>
    : null;
  if (!response.ok || !payload?.success) {
    const raw = payload?.error;
    const field = raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.values(raw)[0] : '';
    const message = (field ? String(field) : '')
      || payload?.message
      || (response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : '')
      || 'Không thể hoàn thành thao tác. Vui lòng thử lại.';
    throw new StudyClassApiError(message, response.status);
  }
  return payload.data;
}

export function listStudyClasses(params?: { status?: string; keyword?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.keyword) query.set('keyword', params.keyword);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<StudyClassList>(`/teacher/study-classes${suffix}`);
}

export function createStudyClass(input: StudyClassCreateInput) {
  return request<StudyClass>('/teacher/study-classes', 'POST', input);
}

export function getStudyClass(classId: string) {
  return request<StudyClass>(`/teacher/study-classes/${classId}`);
}

export function updateStudyClass(classId: string, input: { name: string; description: string; maxStudents: number; endDate: string | null }) {
  return request<StudyClass>(`/teacher/study-classes/${classId}`, 'PUT', input);
}

export function dissolveStudyClass(classId: string) {
  return request<StudyClass>(`/teacher/study-classes/${classId}/dissolve`, 'POST');
}

export function listStudyRequests(classId: string) {
  return request<StudyMember[]>(`/teacher/study-classes/${classId}/requests?status=PENDING`);
}

export function actOnStudyRequest(classId: string, requestId: string, action: 'approve' | 'reject') {
  return request<StudyMember>(`/teacher/study-classes/${classId}/requests/${requestId}/action`, 'POST', { action });
}

export function joinStudyClass(classCode: string) {
  return request<StudyClassJoinResult>('/student/study-classes/join', 'POST', { classCode });
}

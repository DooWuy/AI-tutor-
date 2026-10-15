import type { ApiResponse } from '../types/auth';
import type { AdminStudentDetail, AdminStudentListItem, PageResponse, StudentSortField, SortDirection } from '../types/adminStudent';
import type { TeacherClass, TeacherClassQuiz } from '../types/teacherClass';
import { getStoredSession } from './authApi';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export class TeacherClassApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'TeacherClassApiError';
    this.status = status;
  }
}

function authHeaders(): HeadersInit {
  const token = getStoredSession()?.accessToken;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', headers: authHeaders() });
  } catch {
    throw new TeacherClassApiError('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.', 0);
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
      || (response.status === 403 ? 'Bạn không có quyền xem lớp này.' : '')
      || (response.status === 404 ? 'Không tìm thấy lớp học.' : '')
      || 'Không thể hoàn thành thao tác. Vui lòng thử lại.';
    throw new TeacherClassApiError(message, response.status);
  }
  return payload.data;
}

export function listTeacherClasses() {
  return request<TeacherClass[]>('/teacher/classes');
}

export function getTeacherClass(classId: string) {
  return request<TeacherClass>(`/teacher/classes/${classId}`);
}

export function listClassStudents(
  classId: string,
  params: { search?: string; page: number; size: number; sort: StudentSortField; direction: SortDirection },
) {
  const query = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
    sort: params.sort,
    direction: params.direction,
  });
  if (params.search) query.set('search', params.search);
  return request<PageResponse<AdminStudentListItem>>(`/teacher/classes/${classId}/students?${query.toString()}`);
}

export function listClassQuizzes(classId: string) {
  return request<TeacherClassQuiz[]>(`/teacher/classes/${classId}/quizzes`);
}

export function fetchTeacherStudent(studentId: string) {
  return request<AdminStudentDetail>(`/teacher/students/${studentId}`);
}

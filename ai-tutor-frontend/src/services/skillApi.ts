import { getStoredSession } from './authApi';
import type {
  LessonSummary,
  PageResponseDTO,
  SkillCreatePayload,
  SkillFilterParams,
  SkillItem,
  SkillUpdatePayload,
} from '../types/skills';
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

export class SkillApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SkillApiError';
    this.status = status;
  }
}

function errorMessage(payload: ApiResponse<unknown> | null, status: number) {
  if (payload?.message) return payload.message;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy kỹ năng yêu cầu.';
  return 'Thao tác không thành công. Vui lòng thử lại.';
}

export const skillApi = {
  async searchSkills(params: SkillFilterParams = {}): Promise<PageResponseDTO<SkillItem>> {
    const search = new URLSearchParams();
    if (params.keyword) search.set('keyword', params.keyword);
    if (params.subject) search.set('subject', params.subject);
    if (params.gradeLevel) search.set('gradeLevel', params.gradeLevel);
    if (params.page) search.set('page', String(params.page));
    if (params.size) search.set('size', String(params.size));
    if (params.sort) search.set('sort', params.sort);
    if (params.direction) search.set('direction', params.direction);

    const qs = search.toString();
    const response = await fetch(`${API_BASE_URL}/skills${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(false),
      credentials: 'include',
    });

    const payload = await parseJson<PageResponseDTO<SkillItem>>(response);
    if (!response.ok || !payload) {
      throw new SkillApiError(errorMessage(payload as unknown as ApiResponse<unknown>, response.status), response.status);
    }
    return payload;
  },

  async getSkillById(id: string): Promise<SkillItem> {
    const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
      headers: authHeaders(false),
      credentials: 'include',
    });
    const payload = await parseJson<ApiResponse<SkillItem>>(response);
    if (!response.ok || !payload?.data) {
      throw new SkillApiError(errorMessage(payload, response.status), response.status);
    }
    return payload.data;
  },

  async createSkill(payload: SkillCreatePayload): Promise<SkillItem> {
    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'POST',
      headers: authHeaders(true),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const resPayload = await parseJson<ApiResponse<SkillItem>>(response);
    if (!response.ok || !resPayload?.data) {
      throw new SkillApiError(errorMessage(resPayload, response.status), response.status);
    }
    return resPayload.data;
  },

  async updateSkill(id: string, payload: SkillUpdatePayload): Promise<SkillItem> {
    const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
      method: 'PUT',
      headers: authHeaders(true),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const resPayload = await parseJson<ApiResponse<SkillItem>>(response);
    if (!response.ok || !resPayload?.data) {
      throw new SkillApiError(errorMessage(resPayload, response.status), response.status);
    }
    return resPayload.data;
  },

  async deleteSkill(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
      method: 'DELETE',
      headers: authHeaders(false),
      credentials: 'include',
    });
    if (!response.ok) {
      const payload = await parseJson<ApiResponse<unknown>>(response);
      throw new SkillApiError(errorMessage(payload, response.status), response.status);
    }
  },

  async getAvailableLessons(skillId: string): Promise<LessonSummary[]> {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}/available-lessons`, {
      headers: authHeaders(false),
      credentials: 'include',
    });
    const payload = await parseJson<ApiResponse<LessonSummary[]>>(response);
    if (!response.ok || !payload) {
      throw new SkillApiError(errorMessage(payload as unknown as ApiResponse<unknown>, response.status), response.status);
    }
    return payload.data || [];
  },

  async getAssignedLessons(skillId: string): Promise<LessonSummary[]> {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}/lessons`, {
      headers: authHeaders(false),
      credentials: 'include',
    });
    const payload = await parseJson<ApiResponse<LessonSummary[]>>(response);
    if (!response.ok || !payload) {
      throw new SkillApiError(errorMessage(payload as unknown as ApiResponse<unknown>, response.status), response.status);
    }
    return payload.data || [];
  },

  async assignLessons(skillId: string, lessonIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/skills/${skillId}/lessons`, {
      method: 'PUT',
      headers: authHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ lessonIds }),
    });
    if (!response.ok) {
      const payload = await parseJson<ApiResponse<unknown>>(response);
      throw new SkillApiError(errorMessage(payload, response.status), response.status);
    }
  },
};

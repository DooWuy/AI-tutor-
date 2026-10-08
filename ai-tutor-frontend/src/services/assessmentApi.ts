import type { ApiResponse } from '../types/auth';
import { getStoredSession } from './authApi';
import type {
  QuestionBatch,
  QuestionDraft,
  QuestionItem,
  QuizDraft,
  QuizItem,
  QuizStatistics,
  SkillItem,
} from '../types/assessment';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export class AssessmentApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AssessmentApiError';
    this.status = status;
  }
}

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

function errorMessage(payload: ApiResponse<unknown> | null, status: number) {
  const raw = payload?.error;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const first = Object.values(raw)[0];
    if (first) return String(first);
  }
  if (typeof raw === 'string' && raw) return raw;
  if (payload?.message) return payload.message;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  return 'Không thể hoàn thành thao tác. Vui lòng thử lại.';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...authHeaders(!init.body || typeof init.body === 'string'), ...init.headers },
    });
  } catch {
    throw new AssessmentApiError('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.', 0);
  }
  const payload = await parseJson<ApiResponse<T>>(response);
  if (!response.ok || !payload?.success) throw new AssessmentApiError(errorMessage(payload, response.status), response.status);
  return payload.data;
}

function query(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const questionBankApi = {
  listSkills: (subject?: string, gradeLevel?: string) =>
    request<SkillItem[]>(`/question-bank/skills${query({ subject, gradeLevel })}`),
  listQuestions: (lessonId: string) =>
    request<QuestionItem[]>(`/question-bank/skills/${lessonId}/questions`),
  createQuestion: (lessonId: string, body: QuestionDraft) =>
    request<QuestionItem>(`/question-bank/skills/${lessonId}/questions`, { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (questionId: string, body: QuestionDraft) =>
    request<QuestionItem>(`/question-bank/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (questionId: string) =>
    request<null>(`/question-bank/questions/${questionId}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) =>
    request<{ deleted: number }>('/question-bank/questions/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  generate: (lessonId: string, difficulty: number, count: number) =>
    request<QuestionBatch>(`/question-bank/skills/${lessonId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ difficulty, count }),
    }),
  updateDraft: (batchId: string, questionId: string, body: QuestionDraft) =>
    request<QuestionItem>(`/question-bank/batches/${batchId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteDraft: (batchId: string, questionId: string) =>
    request<null>(`/question-bank/batches/${batchId}/questions/${questionId}`, { method: 'DELETE' }),
  confirmBatch: (batchId: string) =>
    request<QuestionItem[]>(`/question-bank/batches/${batchId}/confirm`, { method: 'POST' }),
  discardBatch: (batchId: string) =>
    request<null>(`/question-bank/batches/${batchId}`, { method: 'DELETE' }),
};

export const quizAdminApi = {
  list: (subject?: string, gradeLevel?: string, status?: string) =>
    request<QuizItem[]>(`/quizzes${query({ subject, gradeLevel, status })}`),
  get: (quizId: string) => request<QuizItem>(`/quizzes/${quizId}`),
  create: (body: QuizDraft) => request<QuizItem>('/quizzes', { method: 'POST', body: JSON.stringify(toQuizBody(body)) }),
  update: (quizId: string, body: QuizDraft) =>
    request<QuizItem>(`/quizzes/${quizId}`, { method: 'PUT', body: JSON.stringify(toQuizBody(body)) }),
  publish: (quizId: string) => request<QuizItem>(`/quizzes/${quizId}/publish`, { method: 'POST' }),
  archive: (quizId: string) => request<QuizItem>(`/quizzes/${quizId}/archive`, { method: 'POST' }),
  draft: (quizId: string) => request<QuizItem>(`/quizzes/${quizId}/draft`, { method: 'POST' }),
  remove: (quizId: string) => request<null>(`/quizzes/${quizId}`, { method: 'DELETE' }),
  assign: (quizId: string, questionIds: string[]) =>
    request<QuizItem>(`/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify({ questionIds }) }),
  removeQuestion: (quizId: string, questionId: string) =>
    request<QuizItem>(`/quizzes/${quizId}/questions/${questionId}`, { method: 'DELETE' }),
  generate: (
    quizId: string,
    body: {
      topic: string;
      count: number;
      minDifficulty: number;
      maxDifficulty: number;
      multipleChoice: number;
      trueFalse: number;
      fillBlank: number;
    },
  ) => request<QuizItem>(`/quizzes/${quizId}/generate`, { method: 'POST', body: JSON.stringify(body) }),
  statistics: (quizId: string) => request<QuizStatistics>(`/quizzes/${quizId}/statistics`),
  async downloadExcel(quizId: string) {
    const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/statistics/export.xlsx`, {
      credentials: 'include',
      headers: authHeaders(false),
    });
    if (!response.ok) {
      const payload = await parseJson<ApiResponse<unknown>>(response);
      throw new AssessmentApiError(errorMessage(payload, response.status), response.status);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ket-qua-de-thi.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  },
};

function toQuizBody(body: QuizDraft) {
  return {
    title: body.title,
    description: body.description,
    subject: body.subject,
    gradeLevel: body.gradeLevel,
    lessonId: body.lessonId || null,
    timeLimitMinutes: Number(body.timeLimitMinutes),
    maxAttempts: Number(body.maxAttempts),
    passingScore: Number(body.passingScore),
  };
}

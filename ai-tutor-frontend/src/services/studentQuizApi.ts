import type { ApiResponse } from '../types/auth';
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export interface StudentQuizGenerateRequest {
  subjectId: string;
  topic: string;
  difficulty: number;
  count: number;
}

export interface StudentQuizDto {
  id: string;
  title: string;
  duration: number;
  questionCount: number;
  status: string;
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_BLANK' | 'SHORT_ANSWER';
export interface QuizQuestion { id: string; questionText: string; type: QuestionType; options: { key: string; content: string }[]; orderIndex: number }
export interface QuizContent { id: string; title: string; subject: string; duration: number; questions: QuizQuestion[] }
export interface QuizAnswer { questionId: string; value: string | null }
export interface QuizDraft { draftId: string; quizId: string; startedAt: string; expiresAt: string; serverTime: string; answeredCount: number; answers: QuizAnswer[]; attemptId: string | null }
export interface QuizResultAnswer { questionId: string; questionText: string; type: QuestionType; options: { key: string; content: string }[]; selectedOptionKey: string | null; correctOptionKey: string; explanation: string; isCorrect?: boolean; correct?: boolean; orderIndex: number }
export interface QuizHistory { id: string; quizId: string; quizTitle: string; isAiGenerated: boolean; score: number; xpEarned: number; durationSeconds: number; submittedAt: string }
export interface QuizResult extends QuizHistory { correctCount: number; totalQuestions: number; totalXp: number; currentLevel: number; answers: QuizResultAnswer[] }
export class QuizApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
async function request<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, { method, credentials: 'include', signal: AbortSignal.timeout(15000),
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const payload: ApiResponse<T> | null = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
  if (!response.ok || !payload?.success || (payload.data === undefined && method !== 'PATCH'))
    throw new QuizApiError(payload?.message || 'Không thể hoàn thành thao tác. Vui lòng thử lại.', response.status);
  return payload?.data as T;
}

export const studentQuizApi = {
  getQuiz: (id: string) => request<QuizContent>(`/student/quizzes/${id}`),
  saveDraft: (quizId: string, answers: QuizAnswer[], draftId?: string) => request<QuizDraft>('/student/quiz-attempts/draft', { quizId, draftId, answers }),
  getDraft: (id: string) => request<QuizDraft>(`/student/quiz-attempts/draft/${id}`),
  submit: (draftId: string, answers: QuizAnswer[]) => request<QuizResult>('/student/quiz-attempts/submit', { draftId, answers }),
  getResult: (id: string) => request<QuizResult>(`/student/quiz-attempts/${id}`),
  getHistory: () => request<QuizHistory[]>('/student/quiz-attempts/history'),
  hide: (id: string) => request<void>(`/student/quiz-attempts/${id}/hide`, undefined, 'PATCH'),
  getAssignedQuizzes: async (subject: string): Promise<StudentQuizDto[]> => {
    return request<StudentQuizDto[]>(`/student/quizzes/assigned?subject=${encodeURIComponent(subject)}`);
  },

  getCustomQuizzes: async (subject: string): Promise<StudentQuizDto[]> => {
    return request<StudentQuizDto[]>(`/student/quizzes/custom?subject=${encodeURIComponent(subject)}`);
  },

  generateCustomQuiz: async (body: StudentQuizGenerateRequest): Promise<StudentQuizDto> => {
    return request<StudentQuizDto>('/student/quizzes/generate-ai', body);
  }
};

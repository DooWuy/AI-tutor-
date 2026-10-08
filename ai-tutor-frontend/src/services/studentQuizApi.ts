const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8088/api/v1';

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

export const studentQuizApi = {
  getAssignedQuizzes: async (subject: string): Promise<StudentQuizDto[]> => {
    const response = await fetch(`${BASE_URL}/student/quizzes/assigned?subject=${encodeURIComponent(subject)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch assigned quizzes');
    const res = await response.json();
    return res.data;
  },

  getCustomQuizzes: async (subject: string): Promise<StudentQuizDto[]> => {
    const response = await fetch(`${BASE_URL}/student/quizzes/custom?subject=${encodeURIComponent(subject)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch custom quizzes');
    const res = await response.json();
    return res.data;
  },

  generateCustomQuiz: async (request: StudentQuizGenerateRequest): Promise<StudentQuizDto> => {
    const response = await fetch(`${BASE_URL}/student/quizzes/generate-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to generate quiz');
    const res = await response.json();
    return res.data;
  }
};

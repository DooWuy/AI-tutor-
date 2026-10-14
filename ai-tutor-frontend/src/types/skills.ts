export interface SkillItem {
  id: string;
  skillCode: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  importance: number;
  masteryThreshold: number;
  minAttempts: number;
  canSkip: boolean;
  questionCount: number;
  assignedLessonCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonSummary {
  id: string;
  lessonCode: string;
  title: string;
  chapterTitle?: string;
  bookTitle?: string;
  subject?: string;
  gradeLevel?: string;
}

export interface SkillCreatePayload {
  code: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  importance: number;
  masteryThreshold: number;
  minAttempts: number;
  canSkip: boolean;
}

export interface SkillUpdatePayload {
  code: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  description?: string;
  importance: number;
  masteryThreshold: number;
  minAttempts: number;
  canSkip: boolean;
}

export interface SkillFilterParams {
  keyword?: string;
  subject?: string;
  gradeLevel?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export interface PageResponseDTO<T> {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: T[];
  hasNext: boolean;
  hasPrevious: boolean;
}

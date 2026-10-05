export type StudentGender = 'MALE' | 'FEMALE' | 'OTHER';
export type StudentSortField = 'fullName' | 'createdAt' | 'totalXp' | 'lastActivityDate';
export type SortDirection = 'asc' | 'desc';

export interface AdminStudentListParams {
  search?: string;
  active?: boolean;
  gradeLevel?: string;
  schoolName?: string;
  classId?: string;
  page?: number;
  size?: 10 | 20 | 50;
  sort?: StudentSortField;
  direction?: SortDirection;
}

export interface AdminStudentListItem {
  studentId: string;
  userId: string;
  studentCode: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  gender: StudentGender | null;
  dateOfBirth: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
  classId: string | null;
  className: string | null;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  lastActivityDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStudentDetail extends AdminStudentListItem {
  longestStreak: number;
  address: string | null;
  studyPreferences: Record<string, unknown> | null;
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  quizAttemptCount: number;
  averageScore: number | null;
  lastQuizSubmittedAt: string | null;
  chatSessionCount: number;
  scheduleCount: number;
}

export interface CreateAdminStudentPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  schoolName: string;
  gradeLevel: string;
  className?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: StudentGender;
}

export interface UpdateAdminStudentPayload {
  fullName: string;
  dateOfBirth?: string | null;
  gender?: StudentGender | null;
  phoneNumber?: string;
  schoolName?: string;
  gradeLevel?: string;
  className?: string;
  address?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  studyPreferences?: Record<string, unknown>;
}

export interface StudentStatusUpdate {
  studentId: string;
  userId: string;
  active: boolean;
}

export interface PageResponse<T> {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: T[];
  hasNext: boolean;
  hasPrevious: boolean;
}

export type ApiFieldErrors = Record<string, string>;

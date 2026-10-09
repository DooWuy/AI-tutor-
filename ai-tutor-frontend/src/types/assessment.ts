export interface SkillItem {
  id: string;
  skillCode: string;
  name: string;
  subject: string;
  gradeLevel: string;
  questionCount: number;
}

export interface ChoiceItem {
  id?: string;
  key: string;
  text: string;
  correct: boolean;
  displayOrder?: number;
}

export interface QuestionItem {
  id: string;
  lessonId: string;
  skillCode: string;
  skillName: string;
  stem: string;
  explanation: string;
  difficulty: number;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | string;
  reviewStatus: 'PENDING' | 'ACTIVE' | string;
  tags: string[];
  choices: ChoiceItem[];
  correctText?: string | null;
  batchId?: string | null;
}

export interface QuestionBatch {
  batchId: string;
  warning?: string | null;
  questions: QuestionItem[];
}

export interface GenerationJob {
  id: string;
  kind: 'BANK' | 'QUIZ' | string;
  status: 'RUNNING' | 'DONE' | 'FAILED' | 'ACKNOWLEDGED' | string;
  lessonId?: string | null;
  quizId?: string | null;
  batchId?: string | null;
  message?: string | null;
  questions?: QuestionItem[] | null;
}

export interface QuestionDraft {
  stem: string;
  explanation: string;
  difficulty: number;
  questionType: string;
  tags: string[];
  choices: ChoiceItem[];
  correctText?: string;
}

export interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  subject: string;
  gradeLevel: string;
  lessonId?: string | null;
  lessonTitle?: string | null;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | string;
  aiGenerated: boolean;
  questionCount: number;
  attemptCount: number;
  createdByName?: string | null;
  createdAt?: string | null;
  questions?: QuizQuestionItem[] | null;
}

export interface QuizQuestionItem {
  id: string;
  stem: string;
  explanation?: string | null;
  difficulty: number;
  questionType: string;
  tags: string[];
  options: { key?: string; text?: string }[];
  correctOptionKey?: string | null;
  correctText?: string | null;
  orderIndex: number;
  sourceQuestionId?: string | null;
}

export interface QuizDraft {
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  lessonId: string;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
}

export interface HardQuestion {
  questionId: string;
  stem: string;
  wrongCount: number;
  answerCount: number;
  wrongRate: number;
}

export interface StudentQuizResult {
  studentId: string;
  studentCode: string;
  fullName: string;
  className?: string | null;
  bestScore: number;
  attemptCount: number;
  passed: boolean;
  lastSubmittedAt?: string | null;
}

export interface QuizStatistics {
  quizId: string;
  title: string;
  passingScore: number;
  attemptCount: number;
  averageScore?: number | null;
  passingRate: number;
  hardestQuestions: HardQuestion[];
  students: StudentQuizResult[];
}

export const SUBJECTS = [
  { value: 'TOAN', label: 'Toán' },
  { value: 'LY', label: 'Vật lý' },
  { value: 'HOA', label: 'Hóa học' },
  { value: 'SINH', label: 'Sinh học' },
  { value: 'ANH', label: 'Tiếng Anh' },
  { value: 'VAN', label: 'Ngữ văn' },
  { value: 'SU', label: 'Lịch sử' },
  { value: 'DIA', label: 'Địa lý' },
  { value: 'GDCD', label: 'GDCD' },
  { value: 'TIN', label: 'Tin học' },
];

export const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export function subjectLabel(value?: string | null) {
  return SUBJECTS.find((item) => item.value === value)?.label || value || '—';
}

export function questionTypeLabel(value?: string | null) {
  if (value === 'TRUE_FALSE') return 'Đúng/Sai';
  if (value === 'FILL_BLANK') return 'Điền từ';
  return 'Trắc nghiệm';
}

export function statusLabel(value?: string | null) {
  if (value === 'PUBLISHED') return 'Đã phát hành';
  if (value === 'ARCHIVED') return 'Ngừng hoạt động';
  return 'Bản nháp';
}

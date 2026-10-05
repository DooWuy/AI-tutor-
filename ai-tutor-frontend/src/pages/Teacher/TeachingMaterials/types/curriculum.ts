export interface BookItem {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  curriculumName: string;
  createdAt: string;
  updatedAt?: string;
  chapters?: ChapterItem[];
}

export interface ChapterItem {
  id: string;
  chapterCode: string;
  title: string;
  displayOrder: number;
  lessons?: LessonItem[];
}

export interface LessonItem {
  id: string;
  lessonCode: string;
  title: string;
  displayOrder: number;
}

export interface BookUpsertPayload {
  title: string;
  subject: string;
  gradeLevel: string;
  curriculumName: string;
}

export interface PendingUploadBook {
  id: string;
  file: File;
  fileName: string;
  fileSizeFormatted: string;
  fileSizeBytes: number;
  title: string;
  subject: string;
  gradeLevel: string;
  curriculumName: string;
  status: 'PENDING' | 'SAVING' | 'READY_FOR_SCAN' | 'SAVED' | 'ERROR';
  savedBookId?: string;
  errorMessage?: string;
}

export interface TocLessonDraft {
  lessonName: string;
  startPage: number | null;
  endPage: number | null;
  appendix: boolean;
  warning?: string | null;
}

export interface TocChapterDraft {
  chapterName: string;
  appendix: boolean;
  lessons: TocLessonDraft[];
}

export interface TocAnalysisResult {
  pdfPageCount: number;
  pdfPageOffset: number | null;
  chapters: TocChapterDraft[];
}

export interface ExtractLessonNode {
  lessonName: string;
  lessonCode?: string;
  startPage: number | null;
  endPage: number | null;
  documentType?: string;
}

export interface ExtractChapterNode {
  chapterName: string;
  chapterCode?: string;
  lessons: ExtractLessonNode[];
}

export interface ExtractStructurePayload {
  pdfPageOffset?: number | null;
  documentType?: string;
  chapters: ExtractChapterNode[];
}

export const SUBJECT_OPTIONS = [
  'Toán',
  'Ngữ văn',
  'Tiếng Anh',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lý',
  'GDCD',
  'Tin học',
] as const;

export const GRADE_OPTIONS = [
  'Lớp 10',
  'Lớp 11',
  'Lớp 12',
] as const;

export const CURRICULUM_OPTIONS = [
  'Kết nối tri thức với cuộc sống',
  'Cánh Diều',
  'Chân trời sáng tạo',
  'Cùng học để phát triển năng lực',
  'Vì sự bình đẳng và dân chủ trong giáo dục',
  'Chương trình chuẩn Bộ GD&ĐT',
] as const;

export function normalizeSubjectForBackend(raw: string): string {
  const trimmed = (raw || '').trim();
  if (trimmed.toLowerCase().includes('toán')) return 'Toán';
  if (
    trimmed.toLowerCase().includes('vật lý') ||
    trimmed.toLowerCase().includes('vật lí') ||
    trimmed.toLowerCase() === 'lí' ||
    trimmed.toLowerCase() === 'lý'
  ) {
    return 'Vật lý';
  }
  if (trimmed.toLowerCase().includes('hóa')) return 'Hóa học';
  if (trimmed.toLowerCase().includes('sinh')) return 'Sinh học';
  if (trimmed.toLowerCase().includes('anh')) return 'Tiếng Anh';
  if (trimmed.toLowerCase().includes('văn')) return 'Ngữ văn';
  if (trimmed.toLowerCase().includes('sử')) return 'Lịch sử';
  if (trimmed.toLowerCase().includes('địa')) return 'Địa lý';
  if (trimmed.toLowerCase().includes('công dân') || trimmed.toUpperCase() === 'GDCD') return 'GDCD';
  if (trimmed.toLowerCase().includes('tin')) return 'Tin học';
  return 'Toán';
}

export function normalizeGradeForBackend(raw: string): string {
  const trimmed = (raw || '').trim();
  const match = trimmed.match(/(?:10|11|12)/);
  if (match) return `Lớp ${match[0]}`;
  return 'Lớp 10';
}

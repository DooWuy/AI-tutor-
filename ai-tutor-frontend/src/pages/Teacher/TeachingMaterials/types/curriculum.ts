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
  'Lớp 1',
  'Lớp 2',
  'Lớp 3',
  'Lớp 4',
  'Lớp 5',
  'Lớp 6',
  'Lớp 7',
  'Lớp 8',
  'Lớp 9',
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

function foldVi(value: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function guessSubject(raw: string): string {
  const folded = foldVi(raw);
  const tokens = new Set(folded.split(/[^a-z0-9]+/).filter(Boolean));
  if (tokens.has('hoa') || tokens.has('hoahoc')) return 'Hóa học';
  if (tokens.has('sinh') || tokens.has('sinhhoc')) return 'Sinh học';
  if (tokens.has('anh') || tokens.has('tienganh')) return 'Tiếng Anh';
  if (tokens.has('van') || tokens.has('nguvan')) return 'Ngữ văn';
  if (tokens.has('su') || tokens.has('lichsu')) return 'Lịch sử';
  if (tokens.has('dia') || tokens.has('dialy')) return 'Địa lý';
  if (tokens.has('ly') || tokens.has('vatly')) return 'Vật lý';
  if (tokens.has('gdcd') || folded.includes('cong dan')) return 'GDCD';
  if (tokens.has('tin') || tokens.has('tinhoc')) return 'Tin học';
  if (tokens.has('toan')) return 'Toán';
  return 'Toán';
}

export function normalizeSubjectForBackend(raw: string): string {
  return guessSubject(raw);
}

export function normalizeGradeForBackend(raw: string): string {
  const trimmed = (raw || '').trim();
  const match = trimmed.match(/(?:lớp|khối|grade)?\s*(1[0-2]|[1-9])\b/i);
  if (match && match[1]) return `Lớp ${match[1]}`;
  return 'Lớp 10';
}

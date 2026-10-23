export interface TeacherClass {
  id: string;
  name: string;
  gradeLevel: string;
  schoolName: string | null;
  academicYear: string;
  subject: string | null;
  isHomeroom: boolean;
  studentCount: number;
}

export interface TeacherClassQuiz {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  questionCount: number;
  attemptCount: number;
  timeLimitMinutes: number;
  availableFrom?: string | null;
  availableUntil?: string | null;
}

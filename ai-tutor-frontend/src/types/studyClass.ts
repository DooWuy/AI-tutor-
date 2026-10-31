export type StudyClassStatus = 'ACTIVE' | 'DISSOLVED';
export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StudyMember {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  studentCode: string;
  status: EnrollmentStatus;
  requestedAt: string;
}

export interface StudyClass {
  id: string;
  name: string;
  description: string | null;
  classCode: string;
  status: StudyClassStatus;
  maxStudents: number;
  approvedCount: number;
  pendingCount: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  members: StudyMember[] | null;
}

export interface StudyClassList {
  activeCount: number;
  classes: StudyClass[];
}

export interface StudyClassJoinResult {
  enrollmentId: string;
  classId: string;
  requestedAt: string;
  className: string;
  classCode: string;
  status: EnrollmentStatus;
}

export interface StudentSchoolClass {
  id: string;
  name: string;
  gradeLevel: string;
  schoolName: string | null;
  academicYear: string;
}

export interface StudentPublishedQuiz {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  timeLimitMinutes: number;
  availableFrom: string | null;
  availableUntil: string | null;
  phase: 'UPCOMING' | 'OPEN' | 'CLOSED' | string;
  classNames: string;
  teacherName: string | null;
  attemptId: string | null;
  score: number | null;
  submittedAt: string | null;
  canStart: boolean;
  canReview: boolean;
}

export interface StudentStudyQuiz {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  timeLimitMinutes: number;
}

export interface StudentStudyClassCard {
  className: string;
  reviewedAt: string | null;
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatus;
  requestedAt: string;
  classId: string;
  name: string;
  description: string | null;
  classCode: string;
  classStatus: StudyClassStatus;
  teacherName: string | null;
  startDate: string;
  endDate: string | null;
  maxStudents: number;
  approvedCount: number;
  quizzes: StudentStudyQuiz[];
}

export interface StudyClassCreateInput {
  name: string;
  description?: string;
  maxStudents?: number;
  endDate?: string | null;
  durationAmount?: number | null;
  durationUnit?: 'WEEKS' | 'MONTHS' | null;
}

export interface StudentStudyClass {
  enrollmentId: string;
  classId: string;
  className: string;
  description: string | null;
  classCode: string;
  teacherName: string;
  classStatus: StudyClassStatus;
  enrollmentStatus: EnrollmentStatus;
  requestedAt: string;
  reviewedAt: string | null;
  startDate: string;
  endDate: string | null;
}

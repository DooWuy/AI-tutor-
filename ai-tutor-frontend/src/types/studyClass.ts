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
  className: string;
  classCode: string;
  status: EnrollmentStatus;
}

export interface StudyClassCreateInput {
  name: string;
  description?: string;
  maxStudents?: number;
  endDate?: string | null;
  durationAmount?: number | null;
  durationUnit?: 'WEEKS' | 'MONTHS' | null;
}

/** Shared wire contract documented in docs/notification_contract.md. */
export type NotificationType = 'CLASS_REMINDER' | 'QUIZ_GENERATED' | 'QUIZ_GENERATION_FAILED' | 'STUDY_CLASS_JOIN_REQUESTED' | 'STUDY_CLASS_JOIN_APPROVED' | 'STUDY_CLASS_JOIN_REJECTED';

export interface NotificationMetadata {
  classId?: string;
  enrollmentId?: string;
  className?: string;
  enrollmentStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  studentId?: string;
  studentName?: string;
  scheduleId?: string;
  slotId?: string;
  subject?: string;
  startsAt?: string;
  room?: string;
  quizId?: string;
  jobId?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  /** Existing database records may contain legacy notification types. */
  type: NotificationType | (string & {});
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  metadata: NotificationMetadata;
}

export interface NotificationFeed {
  items: Notification[];
  nextCursor: string | null;
  unreadCount: number;
}

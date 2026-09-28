export type ReportPeriod = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'SEMESTER_1' | 'CUSTOM';

export type RiskLevel = 'RED' | 'ORANGE';

export type RiskReason = 'LOW_SCORE' | 'INACTIVE' | 'KNOWLEDGE_GAPS';

export type ParentChannel = 'EMAIL' | 'SMS' | 'ZALO' | 'PUSH';

export type ParentMessageStatus = 'SENT' | 'FAILED';

export interface ClassOption {
  id: string;
  name: string;
  gradeLevel: string;
  isHomeroom: boolean;
}

export interface SubjectOption {
  code: string;
  name: string;
}

export interface AnalyticsFiltersResponse {
  classes: ClassOption[];
  subjects: SubjectOption[];
  defaultClassId: string;
  defaultPeriod: ReportPeriod;
}

export interface AppliedFilters {
  classId: string;
  className: string;
  subject: string;
  period: ReportPeriod;
  from?: string;
  to?: string;
}

export interface KpiMetrics {
  studentCount: number;
  quizAttemptCount: number;
  averageQuizScore: number | null;
  averageStudyHoursPerWeek: number;
  atRiskStudentCount: number;
}

export interface ScoreTrendPoint {
  weekStart: string;
  averageScore: number;
  attemptCount: number;
}

export interface StudyTimePoint {
  dayOfWeek: number;
  label: string;
  averageHours: number;
}

export interface DashboardSummaryResponse {
  filters: AppliedFilters;
  kpis: KpiMetrics;
  scoreTrend: ScoreTrendPoint[];
  studyTimeByWeekday: StudyTimePoint[];
}

export interface KnowledgeGapItem {
  rank: number;
  topic: string;
  subject: string;
  affectedStudentCount: number;
  affectedPercent: number;
  wrongAnswerCount: number;
  correctAnswerCount: number;
  askingStudentCount: number;
  advice: string;
}

export interface KnowledgeGapsResponse {
  filters: AppliedFilters;
  classSize: number;
  analyzedAt: string;
  gaps: KnowledgeGapItem[];
}

export interface AtRiskStudent {
  studentId: string;
  studentCode: string;
  fullName: string;
  averageScore: number | null;
  inactiveDays: number | null;
  gapTopicCount: number;
  gapTopics: string[];
  subjects: string[];
  level: RiskLevel;
  reasons: RiskReason[];
}

export interface AtRiskListResponse {
  filters: AppliedFilters;
  evaluatedAt: string;
  students: AtRiskStudent[];
}

export interface ParentMessageDraftResponse {
  studentId: string;
  fullName: string;
  inactiveDays: number | null;
  averageScore: number | null;
  gapTopics: string[];
  subjects: string[];
  body: string;
  minLength: number;
  maxLength: number;
}

export interface ParentMessageChannelResult {
  messageId: string;
  channel: ParentChannel;
  status: ParentMessageStatus;
  errorMessage?: string | null;
}

export interface ParentMessageSendResponse {
  studentId: string;
  results: ParentMessageChannelResult[];
}

export interface ParentMessageSendRequest {
  classId: string;
  body: string;
  channels: ParentChannel[];
}

export interface AlertSettingsView {
  classId: string;
  scoreThreshold: number;
  inactivityDays: number;
  maxGapTopics: number;
  messageTemplate: string;
  customized: boolean;
}

export interface AlertSettingsRequest {
  scoreThreshold: number;
  inactivityDays: number;
  maxGapTopics: number;
  messageTemplate: string;
}

export interface AlertSettingsUpdateResponse {
  settings: AlertSettingsView;
  atRisk: AtRiskListResponse;
}

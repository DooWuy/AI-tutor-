export interface ProgressSummary {
  totalXp: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpPerLevel: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastLearningActivityAt: string | null;
}
export interface DailyActivity {
  date: string;
  quizCount: number;
  studyMinutes: number;
  xpEarned: number;
}
export interface SubjectStats {
  subject: string | null;
  attemptCount: number;
  averageScore: number | null;
  bestScore: number | null;
  xpEarned: number;
}
export interface RecentQuiz {
  attemptId: string;
  quizId: string;
  title: string;
  subject: string | null;
  score: number | null;
  xpEarned: number;
  durationSeconds: number | null;
  submittedAt: string | null;
}
export interface StudentProgress {
  summary: ProgressSummary;
  dailyActivity: DailyActivity[];
  subjectStats: SubjectStats[];
  recentQuizzes: RecentQuiz[];
}
export type LeaderboardScope = "GLOBAL" | "CLASS";
export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  currentLevel: number;
}
export interface Leaderboard {
  scope: LeaderboardScope;
  generatedAt: string;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry;
}
export type XpAwardStatus =
  | "AWARDED"
  | "PARTIALLY_CAPPED"
  | "DAILY_CAP_REACHED"
  | "ALREADY_REWARDED"
  | "NO_XP_EARNED"
  | "LEGACY_UNKNOWN";

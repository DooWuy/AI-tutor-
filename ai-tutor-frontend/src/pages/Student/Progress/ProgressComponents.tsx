import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  Crown,
  Flame,
  Medal,
  RefreshCw,
  Trophy,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  useStudentLearning,
  type Resource,
} from "../../../context/StudentLearningContext";
import { GamificationApiError } from "../../../services/gamificationApi";
import type {
  LeaderboardEntry,
  LeaderboardScope,
  ProgressSummary,
  StudentProgress,
} from "../../../types/gamification";
import "./Progress.css";

export const number = (value: number) => value.toLocaleString("vi-VN");
export const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

export function ResourceState({
  resource,
  retry,
  label,
}: {
  resource: Resource<unknown>;
  retry: () => void;
  label: string;
}) {
  if (resource.loading)
    return (
      <div className="learning-loading" role="status">
        <span className="learning-skeleton" />
        <span>Đang tải {label}…</span>
      </div>
    );
  if (resource.error)
    return (
      <div className="learning-state" role="alert">
        <BookOpen aria-hidden="true" />
        <h3>Chưa tải được {label}</h3>
        <p>{resource.error.message}</p>
        <button className="learning-button" onClick={retry}>
          <RefreshCw size={16} aria-hidden="true" />
          Thử lại
        </button>
      </div>
    );
  return null;
}

export function SummaryCards({ summary }: { summary: ProgressSummary }) {
  const metrics = [
    {
      title: "Tổng XP",
      value: number(summary.totalXp),
      suffix: "XP",
      Icon: Zap,
      tone: "blue",
      hint: "Tích lũy qua từng bài luyện tập",
      badge: "Kinh nghiệm học",
    },
    {
      title: "Cấp độ hiện tại",
      value: number(summary.currentLevel),
      suffix: "",
      Icon: TrendingUp,
      tone: "purple",
      hint: `Còn ${number(summary.xpToNextLevel)} XP đến cấp ${summary.currentLevel + 1}`,
      badge: `Cấp ${summary.currentLevel}`,
    },
    {
      title: "Chuỗi học hiện tại",
      value: number(summary.currentStreak),
      suffix: "ngày",
      Icon: Flame,
      tone: "orange",
      hint: "Nộp quiz mỗi ngày để giữ nhịp",
      badge: summary.currentStreak > 0 ? "Đang duy trì" : "Bắt đầu chuỗi",
    },
    {
      title: "Chuỗi dài nhất",
      value: number(summary.longestStreak),
      suffix: "ngày",
      Icon: Trophy,
      tone: "green",
      hint: "Cột mốc kiên trì của riêng bạn",
      badge: "Kỷ lục cá nhân",
    },
  ];

  return (
    <div className="learning-metrics">
      {metrics.map(({ title, value, suffix, Icon, tone, hint, badge }) => (
        <article className="learning-metric" key={title}>
          <div className="learning-metric-top">
            <span>{title}</span>
            <span className={`learning-icon ${tone}`}>
              <Icon size={20} aria-hidden="true" />
            </span>
          </div>
          <p className="learning-metric-value">
            {value} <span>{suffix}</span>
          </p>
          <div className="learning-metric-footer">
            <span className={`learning-metric-badge ${tone}`}>{badge}</span>
            <p className="learning-muted">{hint}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LevelAndStreak({ data }: { data: StudentProgress }) {
  const { summary, dailyActivity } = data;
  const percent = Math.max(
    0,
    Math.min(100, (summary.xpInCurrentLevel / summary.xpPerLevel) * 100),
  );

  return (
    <section className="learning-card learning-level">
      <div className="learning-level-main">
        <div className="learning-section-title">
          <span className="learning-icon blue">
            <TrendingUp size={21} aria-hidden="true" />
          </span>
          <div>
            <h2>Từng bước lên một tầm cao mới</h2>
            <p>
              Cấp {summary.currentLevel} <span aria-hidden="true">→</span> Cấp{" "}
              {summary.currentLevel + 1}
            </p>
          </div>
        </div>
        <div className="learning-between">
          <strong className="learning-level-xp-text">
            {number(summary.xpInCurrentLevel)} / {number(summary.xpPerLevel)} XP
          </strong>
          <span className="learning-percent-badge">{Math.floor(percent)}%</span>
        </div>
        <div className="learning-progress-wrapper">
          <progress
            aria-label={`Tiến độ cấp ${summary.currentLevel}`}
            max={summary.xpPerLevel}
            value={summary.xpInCurrentLevel}
          />
        </div>
        <p className="learning-muted">
          Thêm {number(summary.xpToNextLevel)} XP để mở cột mốc tiếp theo. Mỗi
          câu đúng ở lần hoàn tất đầu tiên mang lại 10 XP, trong hạn mức ngày.
        </p>
      </div>

      <div className="learning-streak">
        <div className="learning-between">
          <div className="learning-streak-heading">
            <span className="learning-streak-icon-wrap">
              <Flame size={18} aria-hidden="true" />
            </span>
            <h3>Nhịp học 7 ngày</h3>
          </div>
          <span className="learning-streak-counter">
            {summary.currentStreak} ngày liên tiếp
          </span>
        </div>
        <div className="learning-days">
          {dailyActivity.map((day, index) => (
            <div key={day.date} className={day.quizCount ? "is-active" : ""}>
              <span>{dayLabel(day.date)}</span>
              <span
                className="learning-day-mark"
                aria-label={`${dayLabel(day.date)}: ${day.quizCount ? `${day.quizCount} lượt quiz` : "chưa nộp quiz"}`}
              >
                {day.quizCount ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">·</span>
                )}
              </span>
              {index === dailyActivity.length - 1 && <small>Hôm nay</small>}
            </div>
          ))}
        </div>
        <p className="learning-muted">
          Mỗi quiz đã nộp đều được tính hoạt động, kể cả khi không nhận thêm XP.
        </p>
      </div>
    </section>
  );
}

export function SubjectStatsCard({ data }: { data: StudentProgress }) {
  const [filterMode, setFilterMode] = useState<"ALL" | "BEST" | "MOST">("ALL");

  const rawSubjects = data.subjectStats;
  let displayedSubjects = [...rawSubjects];

  if (filterMode === "BEST") {
    displayedSubjects.sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
  } else if (filterMode === "MOST") {
    displayedSubjects.sort((a, b) => b.attemptCount - a.attemptCount);
  }

  return (
    <section className="learning-card">
      <div className="learning-section-header-flex">
        <div className="learning-section-title">
          <span className="learning-icon purple">
            <BookOpen size={20} aria-hidden="true" />
          </span>
          <div>
            <h2>Tiến bộ theo môn học</h2>
            <p>Phân tích điểm số và khối lượng luyện tập theo từng môn</p>
          </div>
        </div>

        {rawSubjects.length > 1 && (
          <div className="learning-subfilter-tabs" role="group" aria-label="Lọc môn học">
            <button
              type="button"
              className={filterMode === "ALL" ? "is-active" : ""}
              onClick={() => setFilterMode("ALL")}
            >
              Tất cả ({rawSubjects.length})
            </button>
            <button
              type="button"
              className={filterMode === "BEST" ? "is-active" : ""}
              onClick={() => setFilterMode("BEST")}
            >
              Điểm cao nhất
            </button>
            <button
              type="button"
              className={filterMode === "MOST" ? "is-active" : ""}
              onClick={() => setFilterMode("MOST")}
            >
              Làm nhiều nhất
            </button>
          </div>
        )}
      </div>

      {!displayedSubjects.length ? (
        <div className="learning-state">
          <BookOpen aria-hidden="true" />
          <h3>Chưa có kết quả theo môn</h3>
          <p>Hoàn thành quiz đầu tiên để bắt đầu xem phân tích chi tiết từng môn.</p>
          <Link className="learning-text-link" to="/student/practice">
            Chọn môn luyện tập <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="learning-subjects">
          {displayedSubjects.map((subject, i) => {
            const score = subject.averageScore;
            const scorePct = score !== null ? Math.round((score / 10) * 100) : 0;

            return (
              <article
                className="learning-subject"
                key={subject.subject ?? "unknown"}
              >
                <div className="learning-between">
                  <div className="learning-subject-title-wrap">
                    <span className={`learning-subject-dot tone-${i % 3}`} />
                    <h3>{subject.subject || "Chưa phân môn"}</h3>
                  </div>
                  <span className="learning-xp">
                    +{number(subject.xpEarned)} XP
                  </span>
                </div>

                {/* Score progress meter bar */}
                <div className="learning-subject-score-bar-wrap">
                  <div className="learning-subject-score-track">
                    <div
                      className="learning-subject-score-fill"
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>
                </div>

                <dl>
                  <div>
                    <dt>Lượt làm</dt>
                    <dd>{number(subject.attemptCount)}</dd>
                  </div>
                  <div>
                    <dt>Điểm TB</dt>
                    <dd className="learning-score-num">
                      {subject.averageScore === null
                        ? "—"
                        : `${subject.averageScore.toFixed(1)}/10`}
                    </dd>
                  </div>
                  <div>
                    <dt>Cao nhất</dt>
                    <dd className="learning-score-num highlight">
                      {subject.bestScore === null
                        ? "—"
                        : `${subject.bestScore.toFixed(1)}/10`}
                    </dd>
                  </div>
                </dl>

                <div className="learning-subject-action">
                  <Link
                    to={subject.subject ? `/student/practice/${encodeURIComponent(subject.subject)}` : "/student/practice"}
                    className="learning-subject-practice-btn"
                  >
                    <span>Luyện môn này</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function RecentQuizzes({ data }: { data: StudentProgress }) {
  return (
    <section className="learning-card">
      <div className="learning-between learning-section-heading">
        <div>
          <h2>Bài luyện gần đây</h2>
          <p className="learning-muted">Nhìn lại kết quả, xem lại đáp án và tiếp tục tiến bộ</p>
        </div>
        <Link to="/student/practice" className="learning-text-link">
          Luyện thêm đề mới <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {!data.recentQuizzes.length ? (
        <div className="learning-state">
          <BookOpen aria-hidden="true" />
          <h3>Hành trình đang chờ bạn</h3>
          <p>Chưa có bài luyện gần đây. Bắt đầu bằng một quiz ngắn nhé.</p>
          <Link className="learning-button primary" to="/student/practice">
            Làm quiz đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="learning-recent">
          {data.recentQuizzes.map((quiz) => {
            const score = quiz.score;
            const scoreClass =
              score === null
                ? "score-none"
                : score >= 8
                  ? "score-high"
                  : score >= 5
                    ? "score-medium"
                    : "score-low";

            return (
              <li key={quiz.attemptId}>
                <Link to={`/student/quiz-results/${quiz.attemptId}`} className="learning-recent-row-link">
                  <span className="learning-icon blue">
                    <BookOpen size={18} aria-hidden="true" />
                  </span>
                  <div className="learning-recent-title">
                    <strong>{quiz.title}</strong>
                    <div className="learning-recent-subline">
                      <span className="learning-subject-tag">
                        {quiz.subject || "Chưa phân môn"}
                      </span>
                      {quiz.submittedAt && (
                        <span>
                          · {new Date(quiz.submittedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="learning-recent-score">
                    <span className={`learning-score-pill ${scoreClass}`}>
                      {quiz.score === null ? "—" : `${quiz.score.toFixed(1)}/10`}
                    </span>
                    <span className="learning-recent-xp-earned">+{number(quiz.xpEarned)} XP</span>
                  </div>
                  <span className="learning-recent-arrow">
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RankingEntry({
  entry,
  me = false,
}: {
  entry: LeaderboardEntry;
  me?: boolean;
}) {
  const isPodium = entry.rank <= 3;
  const podiumClass = entry.rank === 1 ? "podium-gold" : entry.rank === 2 ? "podium-silver" : entry.rank === 3 ? "podium-bronze" : "";

  return (
    <div className={`learning-ranking-row ${me ? "is-me" : ""} ${podiumClass}`}>
      <div className="learning-rank-wrap">
        <span className={`learning-rank rank-${entry.rank}`}>
          {entry.rank === 1 ? (
            <Crown size={14} className="podium-icon" aria-hidden="true" />
          ) : entry.rank === 2 ? (
            <Medal size={14} className="podium-icon" aria-hidden="true" />
          ) : entry.rank === 3 ? (
            <Award size={14} className="podium-icon" aria-hidden="true" />
          ) : null}
          #{number(entry.rank)}
        </span>
      </div>

      <span className="learning-avatar">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
        <span aria-hidden="true">
          {entry.displayName.trim().charAt(0).toUpperCase() || "?"}
        </span>
      </span>

      <div className="learning-ranking-name">
        <div className="learning-name-with-badge">
          <strong>{entry.displayName}</strong>
          {me && <span className="learning-you-tag">Bạn</span>}
          {isPodium && (
            <span className={`learning-top-badge top-${entry.rank}`}>
              Top {entry.rank}
            </span>
          )}
        </div>
        <span>
          Cấp {number(entry.currentLevel)}
        </span>
      </div>

      <strong className="learning-ranking-xp">
        {number(entry.totalXp)}
        <small> XP</small>
      </strong>
    </div>
  );
}

export function LeaderboardCard() {
  const learning = useStudentLearning();
  const [scope, setScope] = useState<LeaderboardScope>("GLOBAL");
  const id = useId();
  const resource = learning[scope];
  const data = resource.data;
  const noClass =
    resource.error instanceof GamificationApiError &&
    resource.error.code === "STUDENT_CLASS_REQUIRED";

  return (
    <section
      className="learning-card learning-leaderboard"
      aria-labelledby={`${id}-title`}
    >
      <div className="learning-section-title">
        <span className="learning-icon orange">
          <Trophy size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 id={`${id}-title`}>Bảng vàng thi đua</h2>
          <p>Xếp hạng học sinh theo tổng điểm XP</p>
        </div>
      </div>

      <div
        className="learning-segments"
        role="group"
        aria-label="Phạm vi bảng xếp hạng"
      >
        {(["GLOBAL", "CLASS"] as const).map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={scope === value}
            onClick={() => setScope(value)}
          >
            {value === "GLOBAL" ? "Toàn hệ thống" : "Lớp của tôi"}
          </button>
        ))}
      </div>

      <div aria-live="polite" aria-busy={resource.loading}>
        {noClass ? (
          <div className="learning-state">
            <BookOpen aria-hidden="true" />
            <h3>Bạn chưa được xếp lớp</h3>
            <p>
              Nhờ giáo viên hoặc quản trị viên xếp lớp để cùng đua điểm thi đua với các bạn.
            </p>
            <button
              type="button"
              className="learning-text-link"
              onClick={() => setScope("GLOBAL")}
            >
              Xem toàn hệ thống <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <ResourceState
              resource={resource}
              retry={learning.refresh}
              label="bảng xếp hạng"
            />
            {data && (
              <>
                <div className="learning-ranking-label">
                  <span>Học sinh</span>
                  <span>Tổng XP</span>
                </div>

                <ol
                  className="learning-ranking-list"
                  tabIndex={0}
                  aria-label="Danh sách 20 thứ hạng đầu, có thể cuộn"
                >
                  {data.entries.map((entry) => (
                    <li key={entry.rank}>
                      <RankingEntry entry={entry} />
                    </li>
                  ))}
                </ol>

                {!data.entries.length && (
                  <p className="learning-muted">
                    Chưa có học sinh trong bảng xếp hạng.
                  </p>
                )}

                <div className="learning-me">
                  <div className="learning-me-header">
                    <p>Vị trí của bạn</p>
                    <span className="learning-me-scope-pill">
                      {scope === "GLOBAL" ? "Toàn quốc" : "Lớp học"}
                    </span>
                  </div>
                  <RankingEntry entry={data.me} me />
                </div>

                <p className="learning-ranking-foot">
                  Cập nhật lúc{" "}
                  {new Date(data.generatedAt).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · Xếp theo tổng XP tích lũy
                </p>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

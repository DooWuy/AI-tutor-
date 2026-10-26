import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Crown,
  Flame,
  MessageCircle,
  Medal,
  MoveUpRight,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useStudentLearning } from "../../../context/StudentLearningContext";
import { useAuth } from "../../../context/AuthContext";
import { ResourceState, number, dayLabel } from "../Progress/ProgressComponents";
import type { LeaderboardEntry } from "../../../types/gamification";
import "./Home.css";

export const DashboardPage = () => {
  const { user } = useAuth();
  const { profile, progress, GLOBAL, refresh } = useStudentLearning();
  const name = (profile.data?.fullName || user?.fullName || "bạn").trim();
  const data = progress.data;
  const today = data?.dailyActivity.at(-1);
  const recent = data?.recentQuizzes.slice(0, 3) || [];
  const subjects =
    data?.subjectStats.filter((subject) => subject.averageScore !== null) || [];
  const focus = [...subjects].sort(
    (a, b) => a.averageScore! - b.averageScore!,
  )[0];

  const [chartMetric, setChartMetric] = useState<"xpEarned" | "studyMinutes">("xpEarned");
  const days = data?.dailyActivity || [];
  const maxMetricVal = Math.max(1, ...days.map((d) => d[chartMetric]));
  const weekTotalXp = days.reduce((sum, d) => sum + d.xpEarned, 0);
  const weekTotalMinutes = days.reduce((sum, d) => sum + d.studyMinutes, 0);
  const weekTotalQuizzes = days.reduce((sum, d) => sum + d.quizCount, 0);
  const chartPoints = days.map((day, index) => {
    const x = days.length > 1 ? (index / (days.length - 1)) * 100 : 50;
    const y = 92 - (day[chartMetric] / maxMetricVal) * 72;
    return { x, y };
  });
  const chartLine = chartPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const chartArea = chartPoints.length
    ? `0,92 ${chartLine} 100,92`
    : "0,92 100,92";

  const compactLeaderboard = GLOBAL.data?.entries.slice(0, 5) || [];

  const RankingRow = ({ entry, me = false }: { entry: LeaderboardEntry; me?: boolean }) => (
    <div className={`home-ranking-row ${me ? "is-me" : ""}`}>
      <span className={`home-ranking-place place-${entry.rank}`}>
        {entry.rank === 1 ? <Crown size={13} aria-hidden="true" /> : entry.rank === 2 ? <Medal size={13} aria-hidden="true" /> : entry.rank === 3 ? <Award size={13} aria-hidden="true" /> : `#${entry.rank}`}
      </span>
      <span className="home-ranking-avatar">
        {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" loading="lazy" /> : entry.displayName.trim().charAt(0).toUpperCase() || "?"}
      </span>
      <span className="home-ranking-name">
        <strong>{entry.displayName}</strong>
        <small>Cấp {number(entry.currentLevel)}</small>
      </span>
      <strong className="home-ranking-xp">{number(entry.totalXp)} <small>XP</small></strong>
    </div>
  );

  return (
    <div className="home-page learning-page">
      <header className="home-heading">
        <div>
          <p className="learning-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            GÓC HỌC TẬP THÔNG MINH
          </p>
          <h1>
            Chào {name}
            <span className="home-wave">.</span>
          </h1>
          <p>Mỗi câu hỏi hôm nay là một bước tiến vững chắc cho ngày mai.</p>
        </div>
        <div className="home-header-actions">
          <Link to="/student/progress" className="home-overview-link">
            <span>Hành trình học tập</span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="home-hero" aria-labelledby="home-start-title">
        <div className="home-hero-copy">
          <div className="home-hero-tags">
            <span className="home-hero-label">
              <span className="home-pulse-dot" />
              MỖI NGÀY MỘT BƯỚC TIẾN
            </span>
            {data && data.summary.currentStreak > 0 && (
              <span className="home-hero-streak-badge">
                <Flame size={13} aria-hidden="true" />
                {data.summary.currentStreak} ngày liên tiếp
              </span>
            )}
          </div>
          <h2 id="home-start-title">
            Một bài luyện nhỏ.
            <br />
            Một bước tiến mới.
          </h2>
          <p>
            Chọn môn bạn muốn chinh phục, thử sức với bộ câu hỏi ngắn và củng cố
            kiến thức ngay sau mỗi câu trả lời.
          </p>
          <div className="home-hero-cta-group">
            <Link to="/student/practice" className="home-start-button">
              <span>Bắt đầu luyện tập ngay</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/student/chat" className="home-hero-secondary-button">
              <MessageCircle size={16} aria-hidden="true" />
              <span>Hỏi gia sư AI</span>
            </Link>
          </div>
          <span className="home-hero-foot">
            <Check size={14} aria-hidden="true" />
            Theo nhịp độ của riêng bạn. Học chủ động, không áp lực.
          </span>
        </div>
        <div className="home-hero-art" aria-hidden="true">
          <div className="home-orbit orbit-outer" />
          <div className="home-orbit orbit-inner" />
          <div className="home-book">
            <BookOpen strokeWidth={1.2} />
            <span>HỌC • HIỂU • TIẾN BỘ</span>
          </div>
          <span className="home-art-spark">
            <Sparkles size={25} />
          </span>
          <span className="home-art-check">
            <Check size={20} />
          </span>
          <span className="home-art-note">Khởi đầu từ sự tò mò.</span>
        </div>
      </section>

      {/* Quick Action Prompts for UX Efficiency */}
      <div className="home-quick-prompts" aria-label="Gợi ý truy cập nhanh">
        <span className="home-quick-label">
          <Target size={14} aria-hidden="true" /> Lối tắt học nhanh:
        </span>
        <div className="home-quick-chips">
          <Link to="/student/practice" className="home-prompt-chip">
            <BookOpen size={14} aria-hidden="true" />
            <span>Luyện đề thi thử</span>
          </Link>
          <Link to="/student/chat" className="home-prompt-chip">
            <MessageCircle size={14} aria-hidden="true" />
            <span>Giải thích bài khó với AI</span>
          </Link>
          <Link to="/student/timetable" className="home-prompt-chip">
            <CalendarDays size={14} aria-hidden="true" />
            <span>Lịch học tuần này</span>
          </Link>
          <Link to="/student/progress" className="home-prompt-chip">
            <TrendingUp size={14} aria-hidden="true" />
            <span>Xem xếp hạng thi đua</span>
          </Link>
        </div>
      </div>

      <nav className="home-shortcuts" aria-label="Công cụ học tập">
        <Link to="/student/chat" className="home-shortcut">
          <span className="home-tool-icon home-tool-ai">
            <MessageCircle size={22} aria-hidden="true" />
          </span>
          <div>
            <h2>Có câu hỏi khó?</h2>
            <p>Cùng gia sư AI giải đáp và gỡ từng nút thắt tư duy.</p>
          </div>
          <span className="home-shortcut-arrow">
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/student/timetable" className="home-shortcut">
          <span className="home-tool-icon home-tool-calendar">
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <div>
            <h2>Sắp xếp buổi học</h2>
            <p>Xem thời khóa biểu và nhắc nhở học tập thông minh.</p>
          </div>
          <span className="home-shortcut-arrow">
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/student/progress" className="home-shortcut">
          <span className="home-tool-icon home-tool-progress">
            <TrendingUp size={22} aria-hidden="true" />
          </span>
          <div>
            <h2>Nhìn lại hành trình</h2>
            <p>Theo dõi điểm số, chuỗi streak và bảng xếp hạng.</p>
          </div>
          <span className="home-shortcut-arrow">
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
      </nav>

      <ResourceState
        resource={progress}
        retry={refresh}
        label="hoạt động học tập"
      />

      {data && (
        <div className="home-bottom-grid">
          <div className="home-study-column">
            {/* Today's Overview Stats */}
            <section className="home-today" aria-labelledby="home-today-title">
              <div className="home-section-heading">
                <div className="home-heading-with-icon">
                  <span className="home-mini-icon blue">
                    <Clock3 size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-today-title">Hôm nay của bạn</h2>
                    <span className="home-subtitle">Hoạt động đã ghi nhận trong ngày</span>
                  </div>
                </div>
                <span className="home-date-badge">
                  {today
                    ? new Date(`${today.date}T12:00:00`).toLocaleDateString(
                        "vi-VN",
                        { weekday: "short", day: "numeric", month: "numeric" },
                      )
                    : ""}
                </span>
              </div>
              <div className="home-today-stats">
                <div className="home-stat-box">
                  <span className="home-stat-icon-wrapper">
                    <BookOpen size={18} aria-hidden="true" />
                  </span>
                  <div className="home-stat-numbers">
                    <strong>{number(today?.quizCount ?? 0)}</strong>
                    <span className="home-stat-unit">lượt</span>
                  </div>
                  <span>lượt quiz đã nộp</span>
                </div>
                <div className="home-stat-box">
                  <span className="home-stat-icon-wrapper">
                    <Clock3 size={18} aria-hidden="true" />
                  </span>
                  <div className="home-stat-numbers">
                    <strong>{number(today?.studyMinutes ?? 0)}</strong>
                    <span className="home-stat-unit">phút</span>
                  </div>
                  <span>tập trung làm bài</span>
                </div>
                <div className="home-stat-box highlight-xp">
                  <span className="home-stat-icon-wrapper">
                    <Sparkles size={18} aria-hidden="true" />
                  </span>
                  <div className="home-stat-numbers">
                    <strong>+{number(today?.xpEarned ?? 0)}</strong>
                    <span className="home-stat-unit">XP</span>
                  </div>
                  <span>tích lũy hôm nay</span>
                </div>
              </div>
            </section>

            {/* NEW: Interactive Weekly Study Rhythm Mini-Chart on Home */}
            <section className="home-chart-card" aria-labelledby="home-rhythm-title">
              <div className="home-section-heading">
                <div className="home-heading-with-icon">
                  <span className="home-mini-icon purple">
                    <ChartNoAxesCombined size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-rhythm-title">Nhịp học 7 ngày qua</h2>
                    <span className="home-subtitle">Đều đặn mỗi ngày để duy trì phong độ</span>
                  </div>
                </div>
                <div className="home-chart-toggle-group" role="group" aria-label="Chọn chỉ số biểu đồ">
                  <button
                    type="button"
                    className={`home-chart-toggle-btn ${chartMetric === "xpEarned" ? "is-active" : ""}`}
                    onClick={() => setChartMetric("xpEarned")}
                  >
                    XP nhận
                  </button>
                  <button
                    type="button"
                    className={`home-chart-toggle-btn ${chartMetric === "studyMinutes" ? "is-active" : ""}`}
                    onClick={() => setChartMetric("studyMinutes")}
                  >
                    Phút học
                  </button>
                </div>
              </div>

              <div className="home-mini-chart-summary">
                <div className="home-mini-summary-item">
                  <span>Tuần này:</span>
                  <strong>
                    {chartMetric === "xpEarned" ? `+${number(weekTotalXp)} XP` : `${number(weekTotalMinutes)} phút`}
                  </strong>
                </div>
                <div className="home-mini-summary-item">
                  <span>Đã nộp:</span>
                  <strong>{number(weekTotalQuizzes)} lượt quiz</strong>
                </div>
                <Link to="/student/progress" className="home-chart-more-link">
                  <span>Chi tiết</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>

              <div className="home-line-chart-wrap">
                <div className="home-line-chart-y-labels" aria-hidden="true">
                  <span>{number(maxMetricVal)}</span>
                  <span>{number(Math.round(maxMetricVal / 2))}</span>
                  <span>0</span>
                </div>
                <svg className="home-line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Biểu đồ ${chartMetric === "xpEarned" ? "XP nhận được" : "phút học"} trong 7 ngày`}>
                  <defs>
                    <linearGradient id="home-chart-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="20" x2="100" y2="20" className="home-chart-grid-line" />
                  <line x1="0" y1="56" x2="100" y2="56" className="home-chart-grid-line" />
                  <line x1="0" y1="92" x2="100" y2="92" className="home-chart-grid-line" />
                  <polygon points={chartArea} className="home-chart-area" />
                  <polyline points={chartLine} className="home-chart-line" />
                  {chartPoints.map(({ x, y }, idx) => (
                    <circle key={days[idx].date} cx={x} cy={y} r="2.3" className="home-chart-point">
                      <title>{dayLabel(days[idx].date)}: {number(days[idx][chartMetric])} {chartMetric === "xpEarned" ? "XP" : "phút"} · {days[idx].quizCount} quiz</title>
                    </circle>
                  ))}
                </svg>
                <div className="home-line-chart-labels">
                  {days.map((day, idx) => <span key={day.date} className={idx === days.length - 1 ? "is-today" : ""}>{idx === days.length - 1 ? "Hôm nay" : dayLabel(day.date)}</span>)}
                </div>
              </div>
            </section>

            {/* Recent Quizzes List */}
            <section
              className="home-recent"
              aria-labelledby="home-recent-title"
            >
              <div className="home-section-heading">
                <div className="home-heading-with-icon">
                  <span className="home-mini-icon green">
                    <BookOpen size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-recent-title">Bài luyện gần nhất</h2>
                    <span className="home-subtitle">Mở lại để xem đáp án hoặc cải thiện điểm số</span>
                  </div>
                </div>
                <Link to="/student/practice" className="home-view-all-link">
                  <span>Tất cả đề</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>

              {recent.length ? (
                <ul className="home-recent-quiz-list">
                  {recent.map((quiz) => {
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
                      <li key={quiz.attemptId} className="home-recent-item">
                        <div className="home-recent-left">
                          <span className="home-recent-icon">
                            <BookOpen size={18} aria-hidden="true" />
                          </span>
                          <div className="home-recent-info">
                            <strong>{quiz.title}</strong>
                            <div className="home-recent-meta">
                              <span className="home-subject-badge">
                                {quiz.subject || "Luyện tập chung"}
                              </span>
                              {quiz.submittedAt && (
                                <span className="home-time-text">
                                  {new Date(quiz.submittedAt).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                              {quiz.xpEarned > 0 && (
                                <span className="home-recent-xp">
                                  +{number(quiz.xpEarned)} XP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="home-recent-actions">
                          <span className={`home-recent-score-pill ${scoreClass}`}>
                            {score === null ? "—" : `${score.toFixed(1)}/10`}
                          </span>
                          <Link
                            to={`/student/quiz-results/${quiz.attemptId}`}
                            className="home-recent-review-btn"
                            title="Xem chi tiết kết quả"
                          >
                            <span>Xem lại</span>
                            <ArrowUpRight size={15} aria-hidden="true" />
                          </Link>
                          {quiz.quizId && (
                            <Link
                              to={`/student/quiz-attempt/${quiz.quizId}`}
                              className="home-recent-retry-btn"
                              title="Làm lại đề này"
                            >
                              <RotateCcw size={14} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="home-first-quiz">
                  <span className="home-recent-icon large">
                    <BookOpen size={24} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>Trang đầu tiên đang chờ bạn</h3>
                    <p>Hoàn thành bài luyện đầu tiên để ghi nhận điểm số và nhịp học của bạn tại đây.</p>
                    <Link to="/student/practice" className="home-empty-cta-btn">
                      <span>Chọn môn để bắt đầu</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="home-personal">
            {/* Streak Motivation Card */}
            <section className="home-streak-note">
              <div className="home-streak-header">
                <span className="home-streak-symbol">
                  <Flame size={24} aria-hidden="true" />
                </span>
                <div>
                  <span className="home-small-label">GIỮ NHỊP HỌC TẬP</span>
                  <h2>
                    {data.summary.currentStreak > 0
                      ? `${number(data.summary.currentStreak)} ngày giữ nhịp học!`
                      : "Bắt đầu nhịp học mới"}
                  </h2>
                </div>
              </div>
              <p>
                {today?.quizCount
                  ? "Tuyệt vời! Bạn đã hoàn thành mục tiêu học tập hôm nay. Duy trì đều đặn để tích lũy kiến thức sâu hơn."
                  : "Chỉ cần 1 bài quiz hôm nay để bảo vệ chuỗi học và tích lũy thêm XP!"}
              </p>

              {/* Recommended Focus Subject Card */}
              {focus && (
                <div className="home-focus-subject">
                  <div className="home-focus-label">
                    <Target size={13} aria-hidden="true" />
                    <span>Gợi ý môn cần củng cố</span>
                  </div>
                  <strong>
                    Luyện thêm môn {focus.subject || "đã học"}
                  </strong>
                  <p>
                    Điểm trung bình hiện tại: {focus.averageScore!.toFixed(1)}/10 qua{" "}
                    {number(focus.attemptCount)} lượt làm.
                  </p>
                  <Link
                    to={focus.subject ? `/student/practice/${encodeURIComponent(focus.subject)}` : "/student/practice"}
                    className="home-focus-action-btn"
                  >
                    <span>Luyện môn này ngay</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>

            {/* Quick Progress Summary Card */}
            <Link to="/student/progress" className="home-progress-link">
              <div className="home-progress-link-header">
                <span className="home-small-label">THÀNH TÍCH ĐÃ TÍCH LŨY</span>
                <span className="home-level-pill">
                  <Zap size={11} aria-hidden="true" />
                  Cấp {number(data.summary.currentLevel)}
                </span>
              </div>
              <div className="home-progress-main-stat">
                <strong>
                  {number(data.summary.totalXp)}
                  <small> XP</small>
                </strong>
                <span className="home-progress-next-hint">
                  +{number(data.summary.xpToNextLevel)} XP lên Cấp {data.summary.currentLevel + 1}
                </span>
              </div>

              {/* Progress Mini Track */}
              <div className="home-mini-progress-track">
                <div
                  className="home-mini-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(5, (data.summary.xpInCurrentLevel / data.summary.xpPerLevel) * 100))}%`,
                  }}
                />
              </div>

              <div className="home-progress-link-footer">
                <span>Xem chi tiết tiến độ & xếp hạng</span>
                <MoveUpRight size={16} aria-hidden="true" />
              </div>
            </Link>

            <section className="home-leaderboard" aria-labelledby="home-leaderboard-title">
              <div className="home-leaderboard-heading">
                <div className="home-heading-with-icon">
                  <span className="home-mini-icon gold"><Trophy size={17} aria-hidden="true" /></span>
                  <div>
                    <h2 id="home-leaderboard-title">Bảng xếp hạng</h2>
                    <span className="home-subtitle">Thi đua cùng bạn bè</span>
                  </div>
                </div>
                <Link to="/student/progress" aria-label="Xem bảng xếp hạng đầy đủ"><ArrowUpRight size={16} aria-hidden="true" /></Link>
              </div>
              {GLOBAL.loading ? (
                <div className="home-ranking-loading" role="status">Đang tải bảng xếp hạng…</div>
              ) : GLOBAL.error ? (
                <div className="home-ranking-loading">Chưa thể tải bảng xếp hạng.</div>
              ) : GLOBAL.data ? (
                <>
                  <div className="home-ranking-list">
                    {compactLeaderboard.map((entry) => <RankingRow key={entry.rank} entry={entry} />)}
                  </div>
                  <div className="home-ranking-me">
                    <span>Vị trí của bạn</span>
                    <RankingRow entry={GLOBAL.data.me} me />
                  </div>
                </>
              ) : null}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

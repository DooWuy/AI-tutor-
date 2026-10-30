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
import { styles } from "./DashboardPage.styles";

interface RankingRowProps {
  entry: LeaderboardEntry;
  me?: boolean;
}

const RankingRow = ({ entry, me = false }: RankingRowProps) => (
  <div className={styles.leaderboard.row(me)}>
    <span className={styles.leaderboard.place(entry.rank)}>
      {entry.rank === 1 ? (
        <Crown size={14} aria-hidden="true" />
      ) : entry.rank === 2 ? (
        <Medal size={14} aria-hidden="true" />
      ) : entry.rank === 3 ? (
        <Award size={14} aria-hidden="true" />
      ) : (
        `#${entry.rank}`
      )}
    </span>
    <span className={styles.leaderboard.avatar}>
      {entry.avatarUrl ? (
        <img src={entry.avatarUrl} alt="" loading="lazy" className={styles.leaderboard.avatarImg} />
      ) : (
        entry.displayName.trim().charAt(0).toUpperCase() || "?"
      )}
    </span>
    <span className={styles.leaderboard.nameCol}>
      <strong className={styles.leaderboard.displayName}>{entry.displayName}</strong>
      <small className={styles.leaderboard.levelText}>Cấp {number(entry.currentLevel)}</small>
    </span>
    <strong className={styles.leaderboard.xp}>
      {number(entry.totalXp)} <small className="text-[10px] text-on-surface-variant font-normal">XP</small>
    </strong>
  </div>
);

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

  return (
    <div className={styles.page}>
      <header className={styles.heading.wrapper}>
        <div>
          <p className={styles.heading.eyebrow}>
            <Sparkles size={14} aria-hidden="true" />
            GÓC HỌC TẬP THÔNG MINH
          </p>
          <h1 className={styles.heading.title}>
            Chào {name}
            <span className={styles.heading.wave}>.</span>
          </h1>
          <p className={styles.heading.subtitle}>Mỗi câu hỏi hôm nay là một bước tiến vững chắc cho ngày mai.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/student/progress" className={styles.heading.actionLink}>
            <span>Hành trình học tập</span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className={styles.hero.section} aria-labelledby="home-start-title">
        <div className={styles.hero.left}>
          <div className={styles.hero.tags}>
            <span className={styles.hero.label}>
              <span className={styles.hero.pulseDot} />
              MỖI NGÀY MỘT BƯỚC TIẾN
            </span>
            {data && data.summary.currentStreak > 0 && (
              <span className={styles.hero.streakBadge}>
                <Flame size={13} aria-hidden="true" />
                {data.summary.currentStreak} ngày liên tiếp
              </span>
            )}
          </div>
          <h2 id="home-start-title" className={styles.hero.title}>
            Một bài luyện nhỏ.
            <br />
            Một bước tiến mới.
          </h2>
          <p className={styles.hero.desc}>
            Chọn môn bạn muốn chinh phục, thử sức với bộ câu hỏi ngắn và củng cố kiến thức ngay sau mỗi câu trả lời.
          </p>
          <div className={styles.hero.ctaGroup}>
            <Link to="/student/practice" className={styles.hero.primaryBtn}>
              <span>Bắt đầu luyện tập ngay</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/student/chat" className={styles.hero.secondaryBtn}>
              <MessageCircle size={16} aria-hidden="true" />
              <span>Hỏi gia sư AI</span>
            </Link>
          </div>
          <span className={styles.hero.foot}>
            <Check size={14} aria-hidden="true" className="text-emerald-400 shrink-0" />
            Theo nhịp độ của riêng bạn. Học chủ động, không áp lực.
          </span>
        </div>
        <div className={styles.hero.artWrapper} aria-hidden="true">
          <div className={styles.hero.bookCard}>
            <BookOpen size={48} strokeWidth={1.5} className="text-blue-100" />
            <span className={styles.hero.bookText}>HỌC • HIỂU • TIẾN BỘ</span>
            <span className={styles.hero.artNote}>Khởi đầu từ sự tò mò.</span>
          </div>
        </div>
      </section>

      {/* Quick Action Prompts for UX Efficiency */}
      <div className={styles.quickPrompts.wrapper} aria-label="Gợi ý truy cập nhanh">
        <span className={styles.quickPrompts.label}>
          <Target size={14} aria-hidden="true" className="text-primary" /> Lối tắt học nhanh:
        </span>
        <div className={styles.quickPrompts.chips}>
          <Link to="/student/practice" className={styles.quickPrompts.chip}>
            <BookOpen size={14} aria-hidden="true" className="text-primary" />
            <span>Luyện đề thi thử</span>
          </Link>
          <Link to="/student/chat" className={styles.quickPrompts.chip}>
            <MessageCircle size={14} aria-hidden="true" className="text-primary" />
            <span>Giải thích bài khó với AI</span>
          </Link>
          <Link to="/student/timetable" className={styles.quickPrompts.chip}>
            <CalendarDays size={14} aria-hidden="true" className="text-primary" />
            <span>Lịch học tuần này</span>
          </Link>
          <Link to="/student/progress" className={styles.quickPrompts.chip}>
            <TrendingUp size={14} aria-hidden="true" className="text-primary" />
            <span>Xem xếp hạng thi đua</span>
          </Link>
        </div>
      </div>

      <nav className={styles.shortcuts.grid} aria-label="Công cụ học tập">
        <Link to="/student/chat" className={styles.shortcuts.card}>
          <span className={styles.shortcuts.iconWrapper("bg-blue-500/10", "text-primary")}>
            <MessageCircle size={22} aria-hidden="true" />
          </span>
          <div className={styles.shortcuts.content}>
            <h2 className={styles.shortcuts.title}>Có câu hỏi khó?</h2>
            <p className={styles.shortcuts.text}>Cùng gia sư AI giải đáp và gỡ từng nút thắt tư duy.</p>
          </div>
          <span className={styles.shortcuts.arrow}>
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/student/timetable" className={styles.shortcuts.card}>
          <span className={styles.shortcuts.iconWrapper("bg-purple-500/10", "text-purple-600 dark:text-purple-400")}>
            <CalendarDays size={22} aria-hidden="true" />
          </span>
          <div className={styles.shortcuts.content}>
            <h2 className={styles.shortcuts.title}>Sắp xếp buổi học</h2>
            <p className={styles.shortcuts.text}>Xem thời khóa biểu và nhắc nhở học tập thông minh.</p>
          </div>
          <span className={styles.shortcuts.arrow}>
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
        <Link to="/student/progress" className={styles.shortcuts.card}>
          <span className={styles.shortcuts.iconWrapper("bg-emerald-500/10", "text-emerald-600 dark:text-emerald-400")}>
            <TrendingUp size={22} aria-hidden="true" />
          </span>
          <div className={styles.shortcuts.content}>
            <h2 className={styles.shortcuts.title}>Nhìn lại hành trình</h2>
            <p className={styles.shortcuts.text}>Theo dõi điểm số, chuỗi streak và bảng xếp hạng.</p>
          </div>
          <span className={styles.shortcuts.arrow}>
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
        <div className={styles.grid.layout}>
          <div className={styles.grid.studyCol}>
            {/* Today's Overview Stats */}
            <section className={styles.today.card} aria-labelledby="home-today-title">
              <div className={styles.today.header}>
                <div className={styles.today.headingGroup}>
                  <span className={styles.today.iconWrapper}>
                    <Clock3 size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-today-title" className={styles.today.title}>Hôm nay của bạn</h2>
                    <span className={styles.today.subtitle}>Hoạt động đã ghi nhận trong ngày</span>
                  </div>
                </div>
                <span className={styles.today.dateBadge}>
                  {today
                    ? new Date(`${today.date}T12:00:00`).toLocaleDateString(
                        "vi-VN",
                        { weekday: "short", day: "numeric", month: "numeric" },
                      )
                    : ""}
                </span>
              </div>
              <div className={styles.today.statsGrid}>
                <div className={styles.today.statBox}>
                  <BookOpen size={18} aria-hidden="true" className={styles.today.statIcon} />
                  <div className={styles.today.statNumbers}>
                    <strong className={styles.today.statValue}>{number(today?.quizCount ?? 0)}</strong>
                    <span className={styles.today.statUnit}>lượt</span>
                  </div>
                  <span className={styles.today.statLabel}>lượt quiz đã nộp</span>
                </div>
                <div className={styles.today.statBox}>
                  <Clock3 size={18} aria-hidden="true" className={styles.today.statIcon} />
                  <div className={styles.today.statNumbers}>
                    <strong className={styles.today.statValue}>{number(today?.studyMinutes ?? 0)}</strong>
                    <span className={styles.today.statUnit}>phút</span>
                  </div>
                  <span className={styles.today.statLabel}>tập trung làm bài</span>
                </div>
                <div className={styles.today.statBoxHighlight}>
                  <Sparkles size={18} aria-hidden="true" className={styles.today.statIconHighlight} />
                  <div className={styles.today.statNumbers}>
                    <strong className={`${styles.today.statValue} text-amber-600 dark:text-amber-400`}>
                      +{number(today?.xpEarned ?? 0)}
                    </strong>
                    <span className={styles.today.statUnit}>XP</span>
                  </div>
                  <span className={styles.today.statLabel}>tích lũy hôm nay</span>
                </div>
              </div>
            </section>

            {/* Interactive Weekly Study Rhythm Mini-Chart */}
            <section className={styles.chartCard.card} aria-labelledby="home-rhythm-title">
              <div className={styles.chartCard.header}>
                <div className={styles.chartCard.headingGroup}>
                  <span className={styles.chartCard.iconWrapper}>
                    <ChartNoAxesCombined size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-rhythm-title" className={styles.chartCard.title}>Nhịp học 7 ngày qua</h2>
                    <span className={styles.chartCard.subtitle}>Đều đặn mỗi ngày để duy trì phong độ</span>
                  </div>
                </div>
                <div className={styles.chartCard.toggleGroup} role="group" aria-label="Chọn chỉ số biểu đồ">
                  <button
                    type="button"
                    className={chartMetric === "xpEarned" ? styles.chartCard.toggleBtnActive : styles.chartCard.toggleBtnInactive}
                    onClick={() => setChartMetric("xpEarned")}
                  >
                    XP nhận
                  </button>
                  <button
                    type="button"
                    className={chartMetric === "studyMinutes" ? styles.chartCard.toggleBtnActive : styles.chartCard.toggleBtnInactive}
                    onClick={() => setChartMetric("studyMinutes")}
                  >
                    Phút học
                  </button>
                </div>
              </div>

              <div className={styles.chartCard.summaryRow}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className={styles.chartCard.summaryItem}>
                    <span>Tuần này:</span>
                    <strong className={styles.chartCard.summaryBold}>
                      {chartMetric === "xpEarned" ? `+${number(weekTotalXp)} XP` : `${number(weekTotalMinutes)} phút`}
                    </strong>
                  </div>
                  <div className={styles.chartCard.summaryItem}>
                    <span>Đã nộp:</span>
                    <strong className={styles.chartCard.summaryBold}>{number(weekTotalQuizzes)} lượt quiz</strong>
                  </div>
                </div>
                <Link to="/student/progress" className={styles.chartCard.moreLink}>
                  <span>Chi tiết</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </div>

              <div className={styles.chartCard.chartWrapper}>
                <div className={styles.chartCard.yLabels} aria-hidden="true">
                  <span>{number(maxMetricVal)}</span>
                  <span>{number(Math.round(maxMetricVal / 2))}</span>
                  <span>0</span>
                </div>
                <div className="min-w-0">
                  <svg className={styles.chartCard.svg} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Biểu đồ ${chartMetric === "xpEarned" ? "XP nhận được" : "phút học"} trong 7 ngày`}>
                    <defs>
                      <linearGradient id="home-chart-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="20" x2="100" y2="20" stroke="var(--color-outline-variant)" strokeWidth="0.45" strokeDasharray="1.5 1.5" className="opacity-65" />
                    <line x1="0" y1="56" x2="100" y2="56" stroke="var(--color-outline-variant)" strokeWidth="0.45" strokeDasharray="1.5 1.5" className="opacity-65" />
                    <line x1="0" y1="92" x2="100" y2="92" stroke="var(--color-outline-variant)" strokeWidth="0.45" strokeDasharray="1.5 1.5" className="opacity-65" />
                    <polygon points={chartArea} fill="url(#home-chart-fill)" />
                    <polyline points={chartLine} fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    {chartPoints.map(({ x, y }, idx) => (
                      <circle key={days[idx].date} cx={x} cy={y} r="2.3" fill="var(--color-surface-container-lowest)" stroke="var(--color-primary)" strokeWidth="1.8" vectorEffect="non-scaling-stroke">
                        <title>{dayLabel(days[idx].date)}: {number(days[idx][chartMetric])} {chartMetric === "xpEarned" ? "XP" : "phút"} · {days[idx].quizCount} quiz</title>
                      </circle>
                    ))}
                  </svg>
                  <div className={styles.chartCard.xLabels}>
                    {days.map((day, idx) => (
                      <span key={day.date} className={idx === days.length - 1 ? styles.chartCard.xLabelToday : ""}>
                        {idx === days.length - 1 ? "Hôm nay" : dayLabel(day.date)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Quizzes List */}
            <section className={styles.recent.card} aria-labelledby="home-recent-title">
              <div className={styles.recent.header}>
                <div className={styles.recent.headingGroup}>
                  <span className={styles.recent.iconWrapper}>
                    <BookOpen size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-recent-title" className={styles.recent.title}>Bài luyện gần nhất</h2>
                    <span className={styles.recent.subtitle}>Mở lại để xem đáp án hoặc cải thiện điểm số</span>
                  </div>
                </div>
                <Link to="/student/practice" className={styles.recent.viewAllLink}>
                  <span>Tất cả đề</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>

              {recent.length ? (
                <ul className={styles.recent.list}>
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
                      <li key={quiz.attemptId} className={styles.recent.item}>
                        <div className={styles.recent.left}>
                          <span className={styles.recent.itemIcon}>
                            <BookOpen size={18} aria-hidden="true" />
                          </span>
                          <div className={styles.recent.info}>
                            <strong className={styles.recent.itemTitle}>{quiz.title}</strong>
                            <div className={styles.recent.meta}>
                              <span className={styles.recent.subjectBadge}>
                                {quiz.subject || "Luyện tập chung"}
                              </span>
                              {quiz.submittedAt && (
                                <span className={styles.recent.timeText}>
                                  {new Date(quiz.submittedAt).toLocaleDateString("vi-VN")}
                                </span>
                              )}
                              {quiz.xpEarned > 0 && (
                                <span className={styles.recent.xpBadge}>
                                  +{number(quiz.xpEarned)} XP
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.recent.actions}>
                          <span className={styles.recent.scorePill(scoreClass)}>
                            {score === null ? "—" : `${score.toFixed(1)}/10`}
                          </span>
                          <Link
                            to={`/student/quiz-results/${quiz.attemptId}`}
                            className={styles.recent.reviewBtn}
                            title="Xem chi tiết kết quả"
                          >
                            <span>Xem lại</span>
                            <ArrowUpRight size={15} aria-hidden="true" />
                          </Link>
                          {quiz.quizId && (
                            <Link
                              to={`/student/quiz-attempt/${quiz.quizId}`}
                              className={styles.recent.retryBtn}
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
                <div className={styles.recent.emptyState}>
                  <span className={styles.recent.emptyIcon}>
                    <BookOpen size={24} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className={styles.recent.emptyTitle}>Trang đầu tiên đang chờ bạn</h3>
                    <p className={styles.recent.emptyDesc}>Hoàn thành bài luyện đầu tiên để ghi nhận điểm số và nhịp học của bạn tại đây.</p>
                    <Link to="/student/practice" className={styles.recent.emptyBtn}>
                      <span>Chọn môn để bắt đầu</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className={styles.grid.personalCol}>
            {/* Streak Motivation Card */}
            <section className={styles.streak.card}>
              <div className={styles.streak.header}>
                <span className={styles.streak.iconWrapper}>
                  <Flame size={24} aria-hidden="true" />
                </span>
                <div>
                  <span className={styles.streak.tag}>GIỮ NHỊP HỌC TẬP</span>
                  <h2 className={styles.streak.title}>
                    {data.summary.currentStreak > 0
                      ? `${number(data.summary.currentStreak)} ngày giữ nhịp học!`
                      : "Bắt đầu nhịp học mới"}
                  </h2>
                </div>
              </div>
              <p className={styles.streak.desc}>
                {today?.quizCount
                  ? "Tuyệt vời! Bạn đã hoàn thành mục tiêu học tập hôm nay. Duy trì đều đặn để tích lũy kiến thức sâu hơn."
                  : "Chỉ cần 1 bài quiz hôm nay để bảo vệ chuỗi học và tích lũy thêm XP!"}
              </p>

              {/* Recommended Focus Subject Card */}
              {focus && (
                <div className={styles.streak.focusBox}>
                  <div className={styles.streak.focusHeader}>
                    <Target size={13} aria-hidden="true" />
                    <span>Gợi ý môn cần củng cố</span>
                  </div>
                  <strong className={styles.streak.focusSubject}>
                    Luyện thêm môn {focus.subject || "đã học"}
                  </strong>
                  <p className={styles.streak.focusStats}>
                    Điểm trung bình hiện tại: {focus.averageScore!.toFixed(1)}/10 qua{" "}
                    {number(focus.attemptCount)} lượt làm.
                  </p>
                  <Link
                    to={focus.subject ? `/student/practice/${encodeURIComponent(focus.subject)}` : "/student/practice"}
                    className={styles.streak.focusBtn}
                  >
                    <span>Luyện môn này ngay</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>

            {/* Quick Progress Summary Card */}
            <Link to="/student/progress" className={styles.progressLink.card}>
              <div className={styles.progressLink.header}>
                <span className={styles.progressLink.tag}>THÀNH TÍCH ĐÃ TÍCH LŨY</span>
                <span className={styles.progressLink.levelPill}>
                  <Zap size={11} aria-hidden="true" />
                  Cấp {number(data.summary.currentLevel)}
                </span>
              </div>
              <div className={styles.progressLink.mainStat}>
                <strong className={styles.progressLink.totalXp}>
                  {number(data.summary.totalXp)}
                  <small className="text-xs font-semibold text-on-surface-variant"> XP</small>
                </strong>
                <span className={styles.progressLink.nextHint}>
                  +{number(data.summary.xpToNextLevel)} XP lên Cấp {data.summary.currentLevel + 1}
                </span>
              </div>

              {/* Progress Mini Track */}
              <div className={styles.progressLink.track}>
                <div
                  className={styles.progressLink.fill}
                  style={{
                    width: `${Math.min(100, Math.max(5, (data.summary.xpInCurrentLevel / data.summary.xpPerLevel) * 100))}%`,
                  }}
                />
              </div>

              <div className={styles.progressLink.footer}>
                <span>Xem chi tiết tiến độ & xếp hạng</span>
                <MoveUpRight size={16} aria-hidden="true" />
              </div>
            </Link>

            <section className={styles.leaderboard.card} aria-labelledby="home-leaderboard-title">
              <div className={styles.leaderboard.header}>
                <div className={styles.leaderboard.headingGroup}>
                  <span className={styles.leaderboard.iconWrapper}>
                    <Trophy size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 id="home-leaderboard-title" className={styles.leaderboard.title}>Bảng xếp hạng</h2>
                    <span className={styles.leaderboard.subtitle}>Thi đua cùng bạn bè</span>
                  </div>
                </div>
                <Link to="/student/progress" aria-label="Xem bảng xếp hạng đầy đủ" className={styles.leaderboard.viewAllLink}>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
              {GLOBAL.loading ? (
                <div className={styles.leaderboard.loading} role="status">Đang tải bảng xếp hạng…</div>
              ) : GLOBAL.error ? (
                <div className={styles.leaderboard.loading}>Chưa thể tải bảng xếp hạng.</div>
              ) : GLOBAL.data ? (
                <>
                  <div className={styles.leaderboard.list}>
                    {compactLeaderboard.map((entry) => <RankingRow key={entry.rank} entry={entry} />)}
                  </div>
                  <div className={styles.leaderboard.meDivider}>
                    <span className={styles.leaderboard.meLabel}>Vị trí của bạn</span>
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
export default DashboardPage;

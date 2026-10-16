import { useState } from "react";
import { BarChart3, Clock, Sparkles, TrendingUp } from "lucide-react";
import { useStudentLearning } from "../../../../context/StudentLearningContext";
import {
  ResourceState,
  dayLabel,
  number,
} from "../../Progress/ProgressComponents";
import "../../Progress/Progress.css";

/** Dates and values come only from the server academic-timezone window. */
export const StudentStudyAnalyticsChart = () => {
  const { progress, refresh } = useStudentLearning();
  const [metric, setMetric] = useState<"xpEarned" | "studyMinutes">("xpEarned");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const days = progress.data?.dailyActivity || [];
  const max = Math.max(1, ...days.map((day) => day[metric]));
  const total = days.reduce((sum, day) => sum + day[metric], 0);
  const quizCount = days.reduce((sum, day) => sum + day.quizCount, 0);
  const avg = days.length ? Math.round(total / days.length) : 0;
  const unit = metric === "xpEarned" ? "XP" : "phút";

  // Find peak day
  const peakDay = days.length
    ? [...days].sort((a, b) => b[metric] - a[metric])[0]
    : null;

  return (
    <section className="learning-card learning-activity">
      <div className="learning-chart-header">
        <div className="learning-section-title">
          <span className="learning-icon blue">
            <BarChart3 size={21} aria-hidden="true" />
          </span>
          <div>
            <h2>Nhịp học của bạn</h2>
            <p>
              7 ngày gần nhất ·{" "}
              {days.length
                ? `${dayLabel(days[0].date)} — ${dayLabel(days[days.length - 1].date)}`
                : "Theo ngày học"}
            </p>
          </div>
        </div>
        <div
          className="learning-segments"
          role="group"
          aria-label="Chỉ số biểu đồ"
        >
          <button
            type="button"
            aria-pressed={metric === "xpEarned"}
            onClick={() => setMetric("xpEarned")}
          >
            XP nhận được
          </button>
          <button
            type="button"
            aria-pressed={metric === "studyMinutes"}
            onClick={() => setMetric("studyMinutes")}
          >
            Phút làm quiz
          </button>
        </div>
      </div>

      <ResourceState
        resource={progress}
        retry={refresh}
        label="biểu đồ hoạt động"
      />

      {progress.data && (
        <>
          {/* Key Insight Pills */}
          <div className="learning-chart-insights">
            <div className="learning-chart-insight-card">
              <span className="learning-insight-label">
                <Sparkles size={13} aria-hidden="true" /> Tổng 7 ngày
              </span>
              <strong>
                {number(total)} <small>{unit}</small>
              </strong>
              <span>{number(quizCount)} lượt quiz</span>
            </div>

            <div className="learning-chart-insight-card">
              <span className="learning-insight-label">
                <Clock size={13} aria-hidden="true" /> Trung bình ngày
              </span>
              <strong>
                {number(avg)} <small>{unit}/ngày</small>
              </strong>
              <span>Duy trì đều đặn</span>
            </div>

            {peakDay && peakDay[metric] > 0 && (
              <div className="learning-chart-insight-card highlight">
                <span className="learning-insight-label">
                  <TrendingUp size={13} aria-hidden="true" /> Ngày tích cực nhất
                </span>
                <strong>
                  {dayLabel(peakDay.date)}
                </strong>
                <span>+{number(peakDay[metric])} {unit}</span>
              </div>
            )}
          </div>

          <div
            className="learning-bar-chart"
            aria-label={`Biểu đồ ${unit} theo ngày`}
          >
            <div className="learning-chart-grid" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            {days.map((day, index) => {
              const val = day[metric];
              const heightPct = Math.max(8, Math.round((val / max) * 100));
              const isToday = index === days.length - 1;
              const isHovered = hoveredIdx === index;

              return (
                <div
                  className={`learning-bar-column ${isToday ? "is-today" : ""} ${isHovered ? "is-active-bar" : ""}`}
                  key={day.date}
                  onMouseEnter={() => setHoveredIdx(index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${dayLabel(day.date)}: ${number(val)} ${unit}, ${day.quizCount} lượt quiz`}
                >
                  {/* Floating popover on hover */}
                  <div className="learning-bar-popover">
                    <span className="popover-date">{dayLabel(day.date)}</span>
                    <strong>{number(val)} {unit}</strong>
                    <small>{day.quizCount} lượt quiz</small>
                  </div>

                  <strong>{number(val)}</strong>
                  <div className="learning-bar-track">
                    <div
                      className="learning-bar"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span>{dayLabel(day.date)}</span>
                  <small>{isToday ? "Hôm nay" : " "}</small>
                </div>
              );
            })}
          </div>

          {days.every((day) => day.quizCount === 0 && day.xpEarned === 0) && (
            <p className="learning-chart-empty">
              Chưa có hoạt động trong 7 ngày này. Một bài quiz hôm nay là khởi
              đầu rất tốt để thắp sáng biểu đồ!
            </p>
          )}

          <details className="learning-chart-table">
            <summary>Xem số liệu từng ngày</summary>
            <table>
              <caption className="sr-only">Hoạt động học tập 7 ngày</caption>
              <thead>
                <tr>
                  <th scope="col">Ngày</th>
                  <th scope="col">Lượt quiz</th>
                  <th scope="col">Phút</th>
                  <th scope="col">XP</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">{dayLabel(day.date)}</th>
                    <td>{number(day.quizCount)}</td>
                    <td>{number(day.studyMinutes)}</td>
                    <td>{number(day.xpEarned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <p className="learning-muted learning-chart-caption">
            Thời gian chỉ tính phút làm quiz. XP là số nhận theo ngày, không
            phải XP tích lũy.
          </p>
        </>
      )}
    </section>
  );
};

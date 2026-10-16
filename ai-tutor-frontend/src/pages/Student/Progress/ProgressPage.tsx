import { Link } from "react-router-dom";
import { ArrowUpRight, RefreshCw, ChartNoAxesCombined } from "lucide-react";
import { useStudentLearning } from "../../../context/StudentLearningContext";
import {
  SummaryCards,
  LevelAndStreak,
  SubjectStatsCard,
  RecentQuizzes,
  LeaderboardCard,
  ResourceState,
} from "./ProgressComponents";
import { StudentStudyAnalyticsChart } from "../Profile/components/StudentStudyAnalyticsChart";
export function ProgressPage() {
  const { progress, refresh } = useStudentLearning();
  return (
    <div className="learning-page">
      <header className="learning-page-header">
        <div>
          <p className="learning-eyebrow">
            <ChartNoAxesCombined size={15} aria-hidden="true" />
            BỨC TRANH HỌC TẬP CỦA BẠN
          </p>
          <h1>
            Tiến bộ mỗi ngày<span className="learning-heading-dot">.</span>
          </h1>
          <p>
            Theo dõi kết quả, nhận ra bước tiến và tìm hướng luyện tập tiếp
            theo.
          </p>
        </div>
        <div className="learning-header-actions">
          <button
            className="learning-button"
            disabled={progress.loading}
            onClick={refresh}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Làm mới
          </button>
          <Link className="learning-button primary" to="/student/practice">
            Luyện tập ngay <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <ResourceState
        resource={progress}
        retry={refresh}
        label="tiến độ học tập"
      />
      {progress.data && (
        <>
          <SummaryCards summary={progress.data.summary} />
          <LevelAndStreak data={progress.data} />
        </>
      )}
      <div className="learning-main-grid">
        <div className="learning-main-column">
          <StudentStudyAnalyticsChart />
          {progress.data && (
            <>
              <SubjectStatsCard data={progress.data} />
              <RecentQuizzes data={progress.data} />
            </>
          )}
        </div>
        <aside>
          <LeaderboardCard />
          <div className="learning-note">
            <ChartNoAxesCombined size={19} aria-hidden="true" />
            <p>
              Thứ hạng là động lực. Điều đáng tự hào nhất vẫn là sự tiến bộ của
              chính bạn.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

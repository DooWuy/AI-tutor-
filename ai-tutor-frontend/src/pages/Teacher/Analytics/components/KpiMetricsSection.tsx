import type { KpiMetrics } from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface KpiMetricsSectionProps {
  kpis: KpiMetrics | null;
  onViewAtRisk: () => void;
}

export function KpiMetricsSection({ kpis, onViewAtRisk }: KpiMetricsSectionProps) {
  // Format score to 1 decimal place strictly (e.g. "8.0"), no floating point distortion
  const displayScore =
    kpis?.averageQuizScore !== null && kpis?.averageQuizScore !== undefined
      ? Number(kpis.averageQuizScore).toFixed(1)
      : '--';

  const displayHours =
    kpis?.averageStudyHoursPerWeek !== null && kpis?.averageStudyHoursPerWeek !== undefined
      ? Number(kpis.averageStudyHoursPerWeek).toFixed(1)
      : '0.0';

  const atRiskCount = kpis?.atRiskStudentCount ?? 0;
  const studentCount = kpis?.studentCount ?? 0;
  const attemptCount = kpis?.quizAttemptCount ?? 0;

  return (
    <section className={styles.kpiGrid}>
      {/* KPI 1: Chuyên cần tự học */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiTop}>
          <div className={styles.kpiIconSecondary}>
            <span className="material-symbols-outlined text-[24px]">schedule</span>
          </div>
          <span className={styles.kpiBadgeSecondary}>Tự học hàng tuần</span>
        </div>
        <div className={styles.kpiBody}>
          <p className={styles.kpiLabel}>Chuyên cần tự học trung bình</p>
          <div className="flex items-baseline">
            <span className={styles.kpiValue}>{displayHours}</span>
            <span className={styles.kpiUnit}>giờ / tuần</span>
          </div>
        </div>
        <div className={styles.kpiFooter}>
          <span>Sĩ số lớp: <strong>{studentCount}</strong> học sinh</span>
          <span className="text-secondary font-semibold">Theo dõi AI Tutor</span>
        </div>
      </div>

      {/* KPI 2: Điểm trắc nghiệm trung bình (AC-01) */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiTop}>
          <div className={styles.kpiIconPrimary}>
            <span className="material-symbols-outlined text-[24px]">grade</span>
          </div>
          <span className={styles.kpiBadgePrimary}>Đánh giá thực lực</span>
        </div>
        <div className={styles.kpiBody}>
          <p className={styles.kpiLabel}>Điểm trắc nghiệm trung bình</p>
          <div className="flex items-baseline">
            <span className={styles.kpiValue}>{displayScore}</span>
            <span className={styles.kpiUnit}>/ 10</span>
          </div>
        </div>
        <div className={styles.kpiFooter}>
          <span>Tổng số lượt thi: <strong>{attemptCount}</strong> bài</span>
          <span className="text-primary font-semibold">Thang điểm 10</span>
        </div>
      </div>

      {/* KPI 3: Học sinh nguy cơ học tập (AC-03 trigger) */}
      <div className={styles.kpiCard}>
        <div className={styles.kpiTop}>
          <div className={styles.kpiIconWarning}>
            <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
          </div>
          <span className={styles.kpiBadgeWarning}>Cảnh báo sớm</span>
        </div>
        <div className={styles.kpiBody}>
          <p className={styles.kpiLabel}>Học sinh có nguy cơ mất gốc</p>
          <div className="flex items-baseline">
            <span className={`${styles.kpiValue} text-error`}>{atRiskCount}</span>
            <span className={styles.kpiUnit}>học sinh</span>
          </div>
        </div>
        <div className={styles.kpiFooter}>
          <span>Cần can thiệp sư phạm</span>
          <button
            type="button"
            onClick={onViewAtRisk}
            className={styles.kpiLinkBtn}
          >
            <span>Xem danh sách</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </section>
  );
}

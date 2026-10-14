import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../../../services/analyticsApi';
import type {
  ClassOption,
  SubjectOption,
  ReportPeriod,
  DashboardSummaryResponse,
  KnowledgeGapsResponse,
  AtRiskStudent,
  AlertSettingsUpdateResponse,
} from './types/analytics';
import { AnalyticsFilterBar } from './components/AnalyticsFilterBar';
import { KpiMetricsSection } from './components/KpiMetricsSection';
import { ScoreTrendLineChart } from './components/ScoreTrendLineChart';
import { StudyTimeBarChart } from './components/StudyTimeBarChart';
import { KnowledgeGapsSection } from './components/KnowledgeGapsSection';
import { ExportReportMenu } from './components/ExportReportMenu';
import { AtRiskStudentsModal } from './components/AtRiskStudentsModal';
import { SendParentAlertModal } from './components/SendParentAlertModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { styles } from './AnalyticsPage.styles';
import { useToast } from '../../../context/ToastContext';

export default function AnalyticsPage() {
  const { toast } = useToast();
  // Filter States
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('LAST_7_DAYS');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Dashboard Data States
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGapsResponse | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);

  // UI Flow States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal Control States
  const [isAtRiskModalOpen, setIsAtRiskModalOpen] = useState(false);
  const [isAlertSettingsModalOpen, setIsAlertSettingsModalOpen] = useState(false);
  const [isSendParentAlertModalOpen, setIsSendParentAlertModalOpen] = useState(false);
  const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<AtRiskStudent | null>(null);

  // 1. Initial Load: Fetch Filters
  useEffect(() => {
    let isCancelled = false;
    analyticsApi
      .getFilters()
      .then((res) => {
        if (isCancelled) return;
        const availableClasses = res.classes || [];
        setClasses(availableClasses);
        setSubjects(res.subjects || []);
        if (res.defaultClassId) {
          setSelectedClassId(res.defaultClassId);
        } else if (availableClasses.length > 0) {
          setSelectedClassId(availableClasses[0].id);
        } else {
          setIsLoading(false);
        }
        if (res.defaultPeriod) {
          setSelectedPeriod(res.defaultPeriod);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Không thể tải danh sách bộ lọc.');
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Fetch Dashboard Data whenever filters change
  const fetchDashboardData = useCallback(async () => {
    if (!selectedClassId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [sumRes, gapsRes, atRiskRes] = await Promise.all([
        analyticsApi.getSummary(selectedClassId, selectedSubject, selectedPeriod, customFrom, customTo),
        analyticsApi.getKnowledgeGaps(selectedClassId, selectedSubject, selectedPeriod, customFrom, customTo),
        analyticsApi.getAtRiskStudents(selectedClassId, selectedSubject, selectedPeriod, customFrom, customTo),
      ]);

      setSummary(sumRes);
      setKnowledgeGaps(gapsRes);
      setAtRiskStudents(atRiskRes.students || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể tải dữ liệu phân tích học tập.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassId, selectedSubject, selectedPeriod, customFrom, customTo]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Current selected class name
  const currentClassName = classes.find((c) => c.id === selectedClassId)?.name || '';

  // Trigger Send Alert for a student
  const handleOpenSendAlert = (student: AtRiskStudent) => {
    setSelectedStudentForAlert(student);
    setIsSendParentAlertModalOpen(true);
  };

  // Callback when settings updated (AC-06 instant sync)
  const handleAlertSettingsUpdated = (res: AlertSettingsUpdateResponse) => {
    if (res.atRisk?.students) {
      setAtRiskStudents(res.atRisk.students);
      // Update KPI count directly
      if (summary?.kpis) {
        setSummary({
          ...summary,
          kpis: {
            ...summary.kpis,
            atRiskStudentCount: res.atRisk.students.length,
          },
        });
      }
    }
    toast.success('Cấu hình cảnh báo học tập thành công! Danh sách học sinh nguy cơ đã được cập nhật.', { duration: 5000 });
  };

  return (
    <div className={styles.container}>
      {errorMessage && (
        <div className={styles.alertError}>
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:opacity-75 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Quick Controls */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <span className="material-symbols-outlined text-[15px]">analytics</span>
            <span>Giám sát & Can thiệp Sớm</span>
          </div>
          <h2 className={styles.headerTitle}>
            Bảng phân tích Học tập Lớp {currentClassName || '...'}
          </h2>
          <p className={styles.headerSubtitle}>
            Theo dõi chuyên cần tự học, đánh giá điểm số thực tế, bóc tách lỗ hổng kiến thức bằng AI và chủ động can thiệp hỗ trợ học sinh có nguy cơ mất gốc.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsAlertSettingsModalOpen(true)}
            className={styles.headerSettingsBtn}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Cài đặt cảnh báo</span>
          </button>

          <ExportReportMenu
            classId={selectedClassId}
            className={currentClassName}
            subject={selectedSubject}
            period={selectedPeriod}
            customFrom={customFrom}
            customTo={customTo}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar
        classes={classes}
        subjects={subjects}
        selectedClassId={selectedClassId}
        selectedSubject={selectedSubject}
        selectedPeriod={selectedPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onSelectClass={setSelectedClassId}
        onSelectSubject={setSelectedSubject}
        onSelectPeriod={setSelectedPeriod}
        onSelectCustomDates={(from, to) => {
          setCustomFrom(from);
          setCustomTo(to);
        }}
      />

      {/* Loading Skeleton */}
      {isLoading && !summary ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-outline font-medium">
            AI Analytics Engine đang tổng hợp báo cáo học tập...
          </p>
        </div>
      ) : classes.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-card rounded-2xl border border-outline/20 p-8 my-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl">
            🏫
          </div>
          <h3 className="text-base font-semibold text-textPrimary">Chưa có lớp học phụ trách</h3>
          <p className="text-sm text-outline max-w-md mx-auto">
            Tài khoản giáo viên của bạn hiện chưa được phân công lớp học nào. Vui lòng liên hệ Quản trị viên để được gán lớp phụ trách.
          </p>
        </div>
      ) : (
        <>
          {/* Khu vực 1: 3 Chỉ số KPI cốt lõi (AC-01) */}
          <KpiMetricsSection
            kpis={summary?.kpis || null}
            onViewAtRisk={() => setIsAtRiskModalOpen(true)}
          />

          {/* Khu vực 2: Biểu đồ xu hướng */}
          <section className={styles.chartsGrid}>
            <ScoreTrendLineChart data={summary?.scoreTrend || []} />
            <StudyTimeBarChart data={summary?.studyTimeByWeekday || []} />
          </section>

          {/* Khu vực 3: Phân tích Lỗ hổng Kiến thức của Lớp (AC-02) */}
          <KnowledgeGapsSection
            gaps={knowledgeGaps?.gaps || []}
            classSize={knowledgeGaps?.classSize}
            analyzedAt={knowledgeGaps?.analyzedAt}
          />
        </>
      )}

      {/* Modal 1: Danh sách học sinh có nguy cơ mất gốc (AC-03) */}
      <AtRiskStudentsModal
        isOpen={isAtRiskModalOpen}
        onClose={() => setIsAtRiskModalOpen(false)}
        students={atRiskStudents}
        className={currentClassName}
        onOpenSendAlert={handleOpenSendAlert}
      />

      {/* Modal 2: Soạn & Gửi tin nhắn phụ huynh tự động bằng AI (AC-04) */}
      <SendParentAlertModal
        isOpen={isSendParentAlertModalOpen}
        onClose={() => {
          setIsSendParentAlertModalOpen(false);
          setSelectedStudentForAlert(null);
        }}
        student={selectedStudentForAlert}
        classId={selectedClassId}
        subject={selectedSubject}
        period={selectedPeriod}
        onSendSuccess={(msg) => {
          toast.success(msg, { duration: 5000 });
        }}
      />

      {/* Modal 3: Cài đặt cấu hình cảnh báo nguy cơ học tập (AC-06) */}
      <AlertSettingsModal
        isOpen={isAlertSettingsModalOpen}
        onClose={() => setIsAlertSettingsModalOpen(false)}
        classId={selectedClassId}
        className={currentClassName}
        onUpdateSuccess={handleAlertSettingsUpdated}
      />
    </div>
  );
}

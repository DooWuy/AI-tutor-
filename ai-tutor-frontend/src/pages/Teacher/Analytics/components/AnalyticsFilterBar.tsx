import type {
  ClassOption,
  SubjectOption,
  ReportPeriod,
} from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface AnalyticsFilterBarProps {
  classes: ClassOption[];
  subjects: SubjectOption[];
  selectedClassId: string;
  selectedSubject: string;
  selectedPeriod: ReportPeriod;
  customFrom?: string;
  customTo?: string;
  onSelectClass: (classId: string) => void;
  onSelectSubject: (subject: string) => void;
  onSelectPeriod: (period: ReportPeriod) => void;
  onSelectCustomDates: (from: string, to: string) => void;
}

export function AnalyticsFilterBar({
  classes,
  subjects,
  selectedClassId,
  selectedSubject,
  selectedPeriod,
  customFrom,
  customTo,
  onSelectClass,
  onSelectSubject,
  onSelectPeriod,
  onSelectCustomDates,
}: AnalyticsFilterBarProps) {
  const periodOptions: { key: ReportPeriod; label: string }[] = [
    { key: 'LAST_7_DAYS', label: '7 ngày qua' },
    { key: 'LAST_30_DAYS', label: '30 ngày qua' },
    { key: 'SEMESTER_1', label: 'Học kỳ 1' },
    { key: 'CUSTOM', label: 'Tùy chọn' },
  ];

  return (
    <div className={styles.filterCard}>
      <div className={styles.filterGroup}>
        {/* Class Selector */}
        <div className={styles.filterItemWrapper}>
          <label htmlFor="filter-class" className={styles.filterLabel}>
            Lớp học phụ trách
          </label>
          <select
            id="filter-class"
            value={selectedClassId}
            onChange={(e) => onSelectClass(e.target.value)}
            className={styles.filterSelect}
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.isHomeroom ? '(Chủ nhiệm)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selector */}
        <div className={styles.filterItemWrapper}>
          <label htmlFor="filter-subject" className={styles.filterLabel}>
            Môn học
          </label>
          <select
            id="filter-subject"
            value={selectedSubject}
            onChange={(e) => onSelectSubject(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">Tất cả môn học</option>
            {subjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range if Period is CUSTOM */}
        {selectedPeriod === 'CUSTOM' && (
          <div className={styles.filterItemWrapper}>
            <label className={styles.filterLabel}>Khoảng ngày (Từ - Đến)</label>
            <div className={styles.customDateRow}>
              <input
                type="date"
                value={customFrom || ''}
                onChange={(e) => onSelectCustomDates(e.target.value, customTo || '')}
                className={styles.customDateInput}
              />
              <span className="text-xs text-outline font-bold">-</span>
              <input
                type="date"
                value={customTo || ''}
                onChange={(e) => onSelectCustomDates(customFrom || '', e.target.value)}
                className={styles.customDateInput}
              />
            </div>
          </div>
        )}
      </div>

      {/* Period Segmented Buttons */}
      <div className={styles.filterItemWrapper}>
        <span className={styles.filterLabel}>Khoảng thời gian báo cáo</span>
        <div className={styles.filterPeriodTabs}>
          {periodOptions.map((opt) => {
            const active = selectedPeriod === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelectPeriod(opt.key)}
                className={active ? styles.filterPeriodBtnActive : styles.filterPeriodBtnInactive}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

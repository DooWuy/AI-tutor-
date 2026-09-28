import { useState, useMemo } from 'react';
import type { AtRiskStudent } from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface AtRiskStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: AtRiskStudent[];
  className?: string;
  onOpenSendAlert: (student: AtRiskStudent) => void;
}

export function AtRiskStudentsModal({
  isOpen,
  onClose,
  students,
  className,
  onOpenSendAlert,
}: AtRiskStudentsModalProps) {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'RED' | 'ORANGE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchLevel = filterLevel === 'ALL' || s.level === filterLevel;
      const matchSearch =
        !searchTerm.trim() ||
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [students, filterLevel, searchTerm]);

  const redCount = useMemo(() => students.filter((s) => s.level === 'RED').length, [students]);
  const orangeCount = useMemo(() => students.filter((s) => s.level === 'ORANGE').length, [students]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                Danh sách Học sinh có Nguy cơ Mất gốc {className ? `- Lớp ${className}` : ''}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Tự động đánh giá bằng AI dựa trên điểm thi, chuỗi ngày không tự học và lỗ hổng kiến thức
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
            title="Đóng modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 bg-surface border-b border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Level Tabs */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterLevel('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterLevel === 'ALL'
                  ? 'bg-surface-container-lowest text-primary shadow-xs border border-outline-variant'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('RED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterLevel === 'RED'
                  ? 'bg-error text-on-error shadow-xs'
                  : 'text-error hover:bg-error-container/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              Nguy cơ cao ({redCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterLevel('ORANGE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterLevel === 'ORANGE'
                  ? 'bg-tertiary text-on-tertiary shadow-xs'
                  : 'text-tertiary hover:bg-tertiary-container/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              Nguy cơ TB ({orangeCount})
            </button>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-60 relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc mã HS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-container-lowest rounded-lg border border-outline text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className={styles.modalBody}>
          {filteredStudents.length === 0 ? (
            <div className={styles.emptyStateBox}>
              <div className={styles.emptyStateIcon}>
                <span className="material-symbols-outlined">done_all</span>
              </div>
              <h4 className={styles.emptyStateTitle}>Không có học sinh nào trong danh sách cảnh báo này</h4>
              <p className={styles.emptyStateDesc}>
                Các học sinh trong lớp đều duy trì điểm số và thói quen tự học ổn định.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead className={styles.tableThead}>
                  <tr>
                    <th className={styles.tableTh}>Học sinh</th>
                    <th className={styles.tableTh}>Mức độ cảnh báo</th>
                    <th className={styles.tableTh}>Điểm TB trắc nghiệm</th>
                    <th className={styles.tableTh}>Thời gian tự học</th>
                    <th className={styles.tableTh}>Lỗ hổng kiến thức</th>
                    <th className={`${styles.tableTh} text-right`}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const isRed = s.level === 'RED';
                    const scoreText = s.averageScore !== null ? Number(s.averageScore).toFixed(1) : '--';
                    const scoreIsLow = s.averageScore !== null && Number(s.averageScore) < 5.0;

                    return (
                      <tr key={s.studentId} className={styles.tableRow}>
                        {/* Học sinh */}
                        <td className={styles.tableTd}>
                          <div className="font-bold text-on-surface">{s.fullName}</div>
                          <div className="text-[11px] text-outline font-medium">Mã: {s.studentCode}</div>
                        </td>

                        {/* Mức độ */}
                        <td className={styles.tableTd}>
                          {isRed ? (
                            <span className={styles.badgeRed}>
                              <span className="material-symbols-outlined text-[13px]">emergency</span>
                              Nguy cơ cao (Đỏ)
                            </span>
                          ) : (
                            <span className={styles.badgeOrange}>
                              <span className="material-symbols-outlined text-[13px]">warning</span>
                              Nguy cơ TB (Cam)
                            </span>
                          )}
                        </td>

                        {/* Điểm TB */}
                        <td className={styles.tableTd}>
                          <span
                            className={`font-bold text-sm ${
                              scoreIsLow ? 'text-error font-extrabold' : 'text-on-surface'
                            }`}
                          >
                            {scoreText}
                          </span>
                          <span className="text-[11px] text-outline"> / 10</span>
                        </td>

                        {/* Chuỗi ngày tự học */}
                        <td className={styles.tableTd}>
                          {s.inactiveDays !== null ? (
                            <div className="text-on-surface font-medium">
                              Không mở app <strong className="text-error">{s.inactiveDays} ngày</strong> qua
                            </div>
                          ) : (
                            <div className="text-outline italic">Chưa từng mở ứng dụng</div>
                          )}
                        </td>

                        {/* Lỗ hổng kiến thức */}
                        <td className={styles.tableTd}>
                          <div className="max-w-xs">
                            <span className="font-semibold text-error text-[11px]">
                              Hổng {s.gapTopicCount} chủ đề
                            </span>
                            <div className="mt-1">
                              {s.gapTopics.slice(0, 2).map((topic, i) => (
                                <span key={i} className={styles.reasonTag}>
                                  {topic}
                                </span>
                              ))}
                              {s.gapTopics.length > 2 && (
                                <span className="text-[10px] text-outline font-semibold">
                                  +{s.gapTopics.length - 2} chủ đề
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className={`${styles.tableTd} text-right`}>
                          <button
                            type="button"
                            onClick={() => onOpenSendAlert(s)}
                            className={styles.btnSuccess}
                            title="Soạn tin nhắn gửi phụ huynh"
                          >
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            <span>Gửi cảnh báo</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Đóng danh sách
          </button>
        </div>
      </div>
    </div>
  );
}

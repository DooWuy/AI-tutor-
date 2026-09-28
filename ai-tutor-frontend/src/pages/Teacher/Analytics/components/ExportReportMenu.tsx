import { useState, useRef, useEffect } from 'react';
import { analyticsApi } from '../../../../services/analyticsApi';
import type { ReportPeriod } from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface ExportReportMenuProps {
  classId: string;
  className?: string;
  subject: string;
  period: ReportPeriod;
  customFrom?: string;
  customTo?: string;
}

export function ExportReportMenu({
  classId,
  className,
  subject,
  period,
  customFrom,
  customTo,
}: ExportReportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'excel' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportPdf = async () => {
    if (!classId) return;
    setIsExporting('pdf');
    setErrorMessage(null);
    setIsOpen(false);
    try {
      await analyticsApi.downloadPdfReport(
        classId,
        subject,
        period,
        customFrom,
        customTo,
        className
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi tải tệp PDF.');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!classId) return;
    setIsExporting('excel');
    setErrorMessage(null);
    setIsOpen(false);
    try {
      await analyticsApi.downloadExcelReport(
        classId,
        subject,
        period,
        customFrom,
        customTo,
        className
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi khi tải tệp Excel.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting !== null}
        className={styles.btnPrimary}
      >
        {isExporting ? (
          <>
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            <span>Đang tạo báo cáo...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Xuất báo cáo</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl py-1.5 z-30 animate-fadeIn">
          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-error text-[18px]">picture_as_pdf</span>
            <div>
              <div className="font-bold">Xuất báo cáo PDF trực quan</div>
              <div className="text-[10px] text-on-surface-variant font-normal">Kèm biểu đồ vector đẹp mắt</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full text-left px-4 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2.5 transition-colors cursor-pointer border-t border-outline-variant/60"
          >
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">table_view</span>
            <div>
              <div className="font-bold">Xuất dữ liệu thô Excel</div>
              <div className="text-[10px] text-on-surface-variant font-normal">Bảng điểm và danh sách chi tiết</div>
            </div>
          </button>
        </div>
      )}

      {/* Error alert toast if download fails */}
      {errorMessage && (
        <div className="absolute right-0 top-12 w-72 bg-error text-on-error text-xs p-2.5 rounded-lg shadow-lg z-30 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-white hover:opacity-80 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

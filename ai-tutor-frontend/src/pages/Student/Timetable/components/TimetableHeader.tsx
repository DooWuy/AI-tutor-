import React, { useRef } from 'react';
import { styles } from '../TimetablePage.styles';

interface TimetableHeaderProps {
  weekStart: string;
  weekEnd: string;
  isLoading: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  handleUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveSchedule: () => Promise<void>;
  handlePreviousWeek: () => void;
  handleNextWeek: () => void;
  weekOffset?: number;
}

export const TimetableHeader: React.FC<TimetableHeaderProps> = ({
  weekStart,
  weekEnd,
  isLoading,
  showSettings,
  setShowSettings,
  handleUploadImage,
  handleSaveSchedule,
  handlePreviousWeek,
  handleNextWeek,
  weekOffset = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'Tuần này';
    if (weekOffset === -1) return 'Tuần trước';
    if (weekOffset === 1) return 'Tuần sau';
    return weekOffset > 0 ? `Tuần tới (+${weekOffset})` : `Tuần trước (${weekOffset})`;
  };

  return (
    <div className={styles.breadcrumbWrapper}>
      <nav className={styles.breadcrumb}>
        <a className={styles.breadcrumbLink} href="#">Trang chủ</a>
        <span className={styles.breadcrumbIcon}>chevron_right</span>
        <span className={styles.breadcrumbActive}>Thời khóa biểu cá nhân</span>
      </nav>
      
      <div className={styles.headerSection}>
        <div>
          <h1 className={styles.title}>Thời khóa biểu Cá nhân</h1>
          <p className={styles.subtitle}>Theo dõi lịch học, chuẩn bị sách vở bài tập và tối ưu hóa thời gian cùng Trợ lý AI.</p>
        </div>
        
        {/* ACTION TOOLBAR */}
        <div className={styles.toolbar}>
          <input type="file" ref={fileInputRef} onChange={handleUploadImage} style={{ display: 'none' }} accept="image/*" />
          <button className={styles.aiBtn} onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isLoading ? 'hourglass_empty' : 'smart_toy'}
            </span>
            <span className="">{isLoading ? 'Đang quét...' : 'Quét & Nhập TKB bằng AI'}</span>
          </button>
          <button className={styles.configBtn} onClick={() => handleSaveSchedule()} disabled={isLoading}>
            <span className="material-symbols-outlined text-base text-primary">save</span>
            <span className="">Lưu TKB</span>
          </button>
          <button className={styles.configBtn} onClick={() => setShowSettings(!showSettings)}>
            <span className="material-symbols-outlined text-base text-primary">tune</span>
            <span className="">Cài đặt</span>
          </button>
          
          <div className={styles.weekSwitcher}>
            <button className={styles.weekBtn} onClick={handlePreviousWeek}>
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <div className={styles.weekText}>{getWeekLabel()}: {weekStart} - {weekEnd}</div>
            <button className={styles.weekBtn} onClick={handleNextWeek}>
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
          
          <button className={styles.exportBtn}>
            <span className="material-symbols-outlined text-base">print</span>
            <span className="hidden sm:inline">In / Đồng bộ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

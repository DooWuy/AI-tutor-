import React from 'react';
import { styles } from '../TimetablePage.styles';

interface TimetableSettingsPanelProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const TimetableSettingsPanel: React.FC<TimetableSettingsPanelProps> = ({
  showSettings,
  setShowSettings
}) => {
  if (!showSettings) return null;

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <div className={styles.settingsTitleGroup}>
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>TÙY CHỈNH SỐ TIẾT & KHUNG GIỜ RA CHƠI THEO TRƯỜNG HỌC</span>
        </div>
        <button className={styles.settingsCloseBtn} onClick={() => setShowSettings(false)}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className={styles.settingsGrid}>
        {/* Morning Session Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <div className={styles.settingsCardHeaderLeft}>
              <span className="material-symbols-outlined text-primary text-[18px]">wb_sunny</span>
              <span>Ca học Buổi Sáng</span>
            </div>
            <span className="bg-primary-fixed text-primary px-2 py-0.5 rounded-full text-[11px]">5 tiết học</span>
          </div>

          <div className={styles.settingsFieldGroup}>
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Số tiết sáng:</label>
              <select className={styles.settingsInput}>
                <option>5 tiết (Tiêu chuẩn)</option>
              </select>
            </div>
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Bắt đầu từ:</label>
              <input type="time" className={styles.settingsInput} defaultValue="07:15" />
            </div>
          </div>

          <div className={styles.settingsBreak}>
            <div className={styles.settingsBreakHeader}>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">coffee</span>
                <span>Giờ ra chơi sáng:</span>
              </div>
              <span className="text-[11px] font-normal text-on-surface-variant">Sau Tiết 2</span>
            </div>
            <div className={styles.settingsFieldGroup}>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Khung giờ ra chơi</label>
                <input type="text" className={styles.settingsInput} defaultValue="08:50 - 09:15 (25p)" />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Hoạt động giữa giờ</label>
                <input type="text" className={styles.settingsInput} defaultValue="Thể dục & Ăn nhẹ" />
              </div>
            </div>
          </div>
        </div>

        {/* Afternoon Session Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <div className={styles.settingsCardHeaderLeft}>
              <span className="material-symbols-outlined text-orange-500 text-[18px]">light_mode</span>
              <span>Ca học Buổi Chiều</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-on-surface-variant">
              Bật ca chiều
              <div className="w-8 h-4 bg-primary rounded-full relative flex items-center px-[2px] cursor-pointer">
                <div className="w-3 h-3 bg-white rounded-full shadow-sm transform translate-x-4"></div>
              </div>
            </div>
          </div>

          <div className={styles.settingsFieldGroup}>
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Số tiết chiều:</label>
              <select className={styles.settingsInput}>
                <option>3 tiết (Học thêm/Tăng cường)</option>
              </select>
            </div>
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Giờ vào ca chiều:</label>
              <input type="time" className={styles.settingsInput} defaultValue="13:30" />
            </div>
          </div>

          <div className={styles.settingsBreak}>
            <div className={styles.settingsBreakHeader}>
              <div className="flex items-center gap-1 text-orange-600">
                <span className="material-symbols-outlined text-[16px]">flag</span>
                <span>Giờ ra chơi chiều:</span>
              </div>
              <span className="text-[11px] font-normal text-on-surface-variant">Sau Tiết 2 chiều</span>
            </div>
            <div className={styles.settingsFieldGroup}>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Khung giờ ra chơi</label>
                <input type="text" className={styles.settingsInput} defaultValue="15:05 - 15:25 (20p)" />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Thời lượng mỗi tiết</label>
                <input type="text" className={styles.settingsInput} defaultValue="45 phút / tiết" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.settingsFooter}>
        <div className={styles.settingsFooterText}>
          <span className="material-symbols-outlined text-[14px] text-primary">info</span>
          Thời khóa biểu sẽ tự động căn lề khung thời gian theo cài đặt của bạn.
        </div>
        <div className="flex items-center gap-4">
          <span className="text-outline cursor-pointer hover:text-on-surface transition">Đặt lại mặc định</span>
          <button className={styles.settingsSaveBtn} onClick={() => setShowSettings(false)}>
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};

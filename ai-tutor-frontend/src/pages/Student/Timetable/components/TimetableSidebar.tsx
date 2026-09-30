import React, { useRef, useState, useMemo } from 'react';
import { styles } from '../TimetablePage.styles';
import { updateMyStudentProfile } from '../../../../services/studentProfileApi';
import type { ScheduleSlotDto } from '../../../../types/schedule';

interface TimetableSidebarProps {
  tomorrowDayName: string;
  isLoading: boolean;
  handleUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  slots: ScheduleSlotDto[];
  currentPreferences: any;
  setCurrentPreferences: (prefs: any) => void;
}

export const TimetableSidebar: React.FC<TimetableSidebarProps> = ({ 
  tomorrowDayName, 
  isLoading, 
  handleUploadImage, 
  slots,
  currentPreferences,
  setCurrentPreferences
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Use state derived from currentPreferences
  const isReminderEnabled = currentPreferences?.studyReminderEnabled !== false;

  const toggleReminder = async () => {
    try {
      setIsUpdating(true);
      const newState = !isReminderEnabled;
      const newPrefs = { ...currentPreferences, studyReminderEnabled: newState };
      await updateMyStudentProfile({ studyPreferences: newPrefs });
      setCurrentPreferences(newPrefs);
    } catch (err) {
      alert('Không thể lưu cấu hình nhắc nhở vào cơ sở dữ liệu!');
    } finally {
      setIsUpdating(false);
    }
  };

  const nextSlot = useMemo(() => {
    if (!slots || slots.length === 0) return null;

    const now = new Date();
    const realDayOfWeek = now.getDay() === 0 ? 8 : now.getDay() + 1; // 2-8
    const currentTime = now.toTimeString().substring(0, 5);

    const sortedSlots = [...slots].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    let next = sortedSlots.find(
      (s) =>
        s.dayOfWeek > realDayOfWeek ||
        (s.dayOfWeek === realDayOfWeek && (s.startTime || '') > currentTime)
    );

    if (!next) next = sortedSlots[0];
    return next;
  }, [slots]);

  const getDayNameLabel = (day: number) => {
    const today = new Date().getDay() === 0 ? 8 : new Date().getDay() + 1;
    if (day === today) return 'hôm nay';
    if (day === today + 1 || (today === 8 && day === 2)) return 'ngày mai';
    return day === 8 ? 'Chủ nhật' : `Thứ ${day}`;
  };

  const tomorrowSlots = useMemo(() => {
    if (!slots) return [];
    const now = new Date();
    const tomorrowDay = (now.getDay() + 1) % 7;
    const tomorrowRealDay = tomorrowDay === 0 ? 8 : tomorrowDay + 1; // 2-8
    
    return [...slots]
      .filter(s => s.dayOfWeek === tomorrowRealDay)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [slots]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };


  return (
    <div className={styles.sidebarWrapper}>
      {/* Card 1: Checklist Ngày Mai */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarCardHeader}>
          <div className="flex items-center gap-2">
            <h3 className={styles.sidebarCardTitle}>Cần chuẩn bị cho ngày mai ({tomorrowDayName})</h3>
          </div>
          <span className={styles.sidebarBadge}>{tomorrowSlots.length} môn học</span>
        </div>
        <p className={styles.sidebarDesc}>Checklist sách giáo khoa, vở ghi và đồ dùng được AI tự động lập theo TKB:</p>
        
        <div className="space-y-2 mt-3">
          {tomorrowSlots.length > 0 ? (
            tomorrowSlots.map((slot, idx) => {
              const id = String(slot.id || idx);
              const isChecked = !!checkedItems[id];
              
              return (
                <div 
                  key={id} 
                  className={isChecked ? styles.checklistItemChecked : styles.checklistItem}
                  onClick={() => toggleCheck(id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={isChecked ? styles.checkboxChecked : styles.checkbox}>
                    {isChecked && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                  </div>
                  <div>
                    <p className={isChecked ? styles.checklistTitleChecked : styles.checklistTitle}>
                      SGK, vở ghi môn {slot.subjectName} {slot.teacherName ? `(${slot.teacherName})` : ''}
                    </p>
                    <p className={styles.checklistSub}>
                      Tiết bắt đầu: {slot.startTime?.substring(0, 5)} {slot.room ? `tại ${slot.room}` : ''}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center">
              <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">sentiment_satisfied</span>
              <p className="text-gray-500 text-sm">Ngày mai bạn được nghỉ ngơi! Không có tiết học nào.</p>
            </div>
          )}
        </div>
        
        <button className={styles.addReminderBtn}>
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          Thêm mục nhắc nhở mới
        </button>
      </div>
      
      {/* Card 2: Nhắc nhở học tập Toggle */}
      <div className={styles.sidebarCard}>
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
          <h3 className={styles.sidebarCardTitle}>Nhắc nhở học tập</h3>
        </div>
        
        <div className={styles.reminderToggleWrapper}>
          <div className={styles.reminderToggleLeft}>
            <p className={styles.reminderToggleTitle}>Nhắc bài trước 15 phút</p>
            <p className={styles.reminderToggleSub}>Gửi qua App AI Tutor & Zalo</p>
          </div>
          <button 
            className={`w-10 h-5 rounded-full relative flex items-center px-0.5 cursor-pointer transition-colors ${isReminderEnabled ? 'bg-primary' : 'bg-outline'}`}
            onClick={toggleReminder}
            disabled={isUpdating}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isReminderEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
        
        <div className={styles.reminderNextBox}>
          <div className={styles.reminderNextTitle}>
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {nextSlot 
              ? `Lần nhắc tiếp theo: ${nextSlot.startTime ? nextSlot.startTime.substring(0, 5) : ''} ${getDayNameLabel(nextSlot.dayOfWeek)}` 
              : 'Chưa có lịch học'}
          </div>
          <p className={styles.reminderNextDesc}>
            {nextSlot 
              ? `"Chuẩn bị vào môn ${nextSlot.subjectName} ${nextSlot.teacherName ? `- ${nextSlot.teacherName}` : ''} ${nextSlot.room ? `tại ${nextSlot.room}` : ''}"`
              : 'Vui lòng cập nhật thời khóa biểu để nhận nhắc nhở.'}
          </p>
        </div>
      </div>
      
      {/* Card 3: Upload TKB */}
      <div className={styles.uploadCard}>
        <div className={styles.uploadIconWrapper}>
          <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
        </div>
        <div className="space-y-1">
          <h3 className={styles.uploadTitle}>Có ảnh chụp TKB mới?</h3>
          <p className={styles.uploadDesc}>Tải ảnh chụp giấy hoặc ảnh chụp màn hình Zalo, AI tự tạo bảng tuần chỉ sau 3 giây.</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUploadImage} style={{ display: 'none' }} accept="image/*" />
        <button 
          className="w-full py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          onClick={() => fileInputRef.current?.click()} 
          disabled={isLoading}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isLoading ? 'hourglass_empty' : 'upload'}
          </span>
          {isLoading ? 'Đang phân tích ảnh...' : 'Tải ảnh lên ngay'}
        </button>
      </div>

    </div>
  );
};

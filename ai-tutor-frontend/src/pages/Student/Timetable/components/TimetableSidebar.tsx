import React, { useState, useMemo, useEffect } from 'react';
import { styles } from '../TimetablePage.styles';
import { updateMyStudentProfile } from '../../../../services/studentProfileApi';
import { useAlert } from '../../../../context/AlertContext';
import type { ScheduleSlotDto } from '../../../../types/schedule';
import { isAcademicSlot, formatSubjectName } from '../../../../utils/timetableUtils';

export interface CustomReminderItem {
  id: string;
  text: string;
  createdAt: string;
}

interface TimetableSidebarProps {
  tomorrowDayName: string;
  isLoading?: boolean;
  handleUploadImage?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  slots: ScheduleSlotDto[];
  currentPreferences: any;
  setCurrentPreferences: (prefs: any) => void;
  showAlert?: (config: any) => void;
}

export const TimetableSidebar: React.FC<TimetableSidebarProps> = ({ 
  tomorrowDayName, 
  slots,
  currentPreferences,
  setCurrentPreferences,
}) => {
  const { showError, showSuccess } = useAlert();
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [customReminders, setCustomReminders] = useState<CustomReminderItem[]>([]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderText, setNewReminderText] = useState('');
  
  // Use state derived from currentPreferences
  const isReminderEnabled = currentPreferences?.studyReminderEnabled !== false;
  const simplifyNames = currentPreferences?.simplifySubjectNames !== false;

  // Load custom reminders & checked state from currentPreferences
  useEffect(() => {
    if (Array.isArray(currentPreferences?.timetable_custom_reminders)) {
      setCustomReminders(currentPreferences.timetable_custom_reminders);
    }
    if (currentPreferences?.timetable_checked_items) {
      setCheckedItems(currentPreferences.timetable_checked_items as Record<string, boolean>);
    }
  }, [currentPreferences]);

  const toggleCheck = async (id: string) => {
    const nextChecked = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(nextChecked);
    try {
      const newPrefs = { ...currentPreferences, timetable_checked_items: nextChecked };
      await updateMyStudentProfile({ studyPreferences: newPrefs });
      setCurrentPreferences(newPrefs);
      window.dispatchEvent(new CustomEvent('student-profile-updated'));
    } catch (e) {
      console.error('Failed to sync checked items:', e);
    }
  };

  const handleAddCustomReminder = async () => {
    if (!newReminderText.trim()) return;
    const newItem: CustomReminderItem = {
      id: `custom_${Date.now()}`,
      text: newReminderText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customReminders, newItem];
    setCustomReminders(updated);
    setNewReminderText('');
    setIsAddingReminder(false);

    try {
      const newPrefs = {
        ...currentPreferences,
        timetable_custom_reminders: updated,
      };
      await updateMyStudentProfile({ studyPreferences: newPrefs });
      setCurrentPreferences(newPrefs);
      window.dispatchEvent(new CustomEvent('student-profile-updated'));
      showSuccess({
        title: 'Đã thêm nhắc nhở!',
        description: `Đã thêm: "${newItem.text}" vào danh sách chuẩn bị.`,
        confirmText: 'Đã hiểu',
      });
    } catch (err) {
      console.error('Failed to save custom reminder:', err);
    }
  };

  const handleDeleteCustomReminder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customReminders.filter(r => r.id !== id);
    setCustomReminders(updated);
    const nextChecked = { ...checkedItems };
    delete nextChecked[id];
    setCheckedItems(nextChecked);

    try {
      const newPrefs = {
        ...currentPreferences,
        timetable_custom_reminders: updated,
        timetable_checked_items: nextChecked,
      };
      await updateMyStudentProfile({ studyPreferences: newPrefs });
      setCurrentPreferences(newPrefs);
      window.dispatchEvent(new CustomEvent('student-profile-updated'));
    } catch (err) {
      console.error('Failed to delete custom reminder:', err);
    }
  };

  const toggleReminder = async () => {
    try {
      setIsUpdating(true);
      const newState = !isReminderEnabled;
      const newPrefs = { ...currentPreferences, studyReminderEnabled: newState };
      await updateMyStudentProfile({ studyPreferences: newPrefs });
      setCurrentPreferences(newPrefs);
      window.dispatchEvent(new CustomEvent('student-profile-updated'));
      showSuccess({
        title: newState ? 'Đã bật nhắc nhở' : 'Đã tắt nhắc nhở',
        description: newState 
          ? 'Hệ thống sẽ gửi thông báo qua Notification Bell và Email trước mỗi tiết học 15 phút.'
          : 'Đã tắt nhắc nhở tiết học.',
        confirmText: 'Đã hiểu'
      });
    } catch (err) {
      showError({
        title: 'Lỗi cập nhật cấu hình',
        description: 'Không thể lưu cấu hình nhắc nhở vào cơ sở dữ liệu. Vui lòng thử lại sau.',
        confirmText: 'Đóng',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const nextSlot = useMemo(() => {
    const cleanSlots = (slots || []).filter(isAcademicSlot);
    if (cleanSlots.length === 0) return null;

    const now = new Date();
    const realDayOfWeek = now.getDay() === 0 ? 8 : now.getDay() + 1; // 2-8
    const currentTime = now.toTimeString().substring(0, 5);

    const sortedSlots = [...cleanSlots].sort((a, b) => {
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
      .filter(s => isAcademicSlot(s) && s.dayOfWeek === tomorrowRealDay)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [slots]);

  const totalTomorrowItems = tomorrowSlots.length + customReminders.length;

  return (
    <div className={styles.sidebarWrapper}>
      {/* Card 1: Checklist Ngày Mai */}
      <div className={styles.sidebarCard}>
        <div className={styles.sidebarCardHeader}>
          <h3 className={styles.sidebarCardTitle}>
            Cần chuẩn bị cho ngày mai ({tomorrowDayName})
          </h3>
          <span className={styles.sidebarBadge}>
            {totalTomorrowItems > 0 ? `${totalTomorrowItems} mục cần chuẩn bị` : 'Nghỉ học'}
          </span>
        </div>
        <p className={styles.sidebarDesc}>
          Checklist sách giáo khoa, vở ghi và đồ dùng được AI tự động lập theo TKB:
        </p>
        
        <div className="space-y-2 mt-3">
          {/* Mục nhắc nhở tự thêm của học sinh */}
          {customReminders.length > 0 && (
            <div className="space-y-1.5 pb-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-primary px-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">push_pin</span>
                  Nhắc nhở riêng của bạn ({customReminders.length})
                </span>
              </div>
              {customReminders.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <div 
                    key={item.id} 
                    className={`group flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isChecked 
                        ? 'border-outline-variant/30 bg-surface-container-lowest opacity-70' 
                        : 'border-primary/25 bg-primary/5 hover:bg-primary/10'
                    }`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={isChecked ? styles.checkboxChecked : styles.checkbox}>
                        {isChecked && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold break-words ${isChecked ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                          {item.text}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-primary px-1.5 py-0.2 rounded bg-primary/10">
                          Ghi chú riêng
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustomReminder(item.id, e)}
                      title="Xóa mục nhắc nhở này"
                      className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Danh sách chuẩn bị theo môn học */}
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
                      SGK, vở ghi môn {formatSubjectName(slot.subjectName, simplifyNames)} {slot.teacherName ? `(${slot.teacherName})` : ''}
                    </p>
                    <p className={styles.checklistSub}>
                      Tiết bắt đầu: {slot.startTime?.substring(0, 5)} {slot.room ? `tại ${slot.room}` : ''}
                    </p>
                  </div>
                </div>
              );
            })
          ) : customReminders.length === 0 ? (
            <div className="py-4 text-center">
              <span className="material-symbols-outlined text-outline/40 text-4xl mb-2">sentiment_satisfied</span>
              <p className="text-on-surface-variant text-sm font-medium">Ngày mai bạn được nghỉ ngơi! Không có tiết học nào.</p>
            </div>
          ) : null}
        </div>
        
        {/* Form thêm nhắc nhở mới inline */}
        {isAddingReminder ? (
          <div className="mt-3 p-3 rounded-xl border border-primary/30 bg-surface-container-low/80 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">add_task</span>
                Thêm mục cần chuẩn bị
              </span>
              <button 
                type="button"
                onClick={() => { setIsAddingReminder(false); setNewReminderText(''); }}
                className="text-on-surface-variant hover:text-on-surface p-0.5 rounded transition"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <input 
              type="text"
              autoFocus
              className="w-full px-3 py-2 text-xs bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-on-surface placeholder:text-outline shadow-inner"
              placeholder="VD: Mang compa và thước kẻ, làm bài tập Toán trang 42..."
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomReminder();
                } else if (e.key === 'Escape') {
                  setIsAddingReminder(false);
                  setNewReminderText('');
                }
              }}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setIsAddingReminder(false); setNewReminderText(''); }}
                className="px-2.5 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface rounded-lg transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddCustomReminder}
                disabled={!newReminderText.trim()}
                className="px-3 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-on-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-1 active:scale-95"
              >
                <span className="material-symbols-outlined text-[14px]">save</span>
                Lưu nhắc nhở
              </button>
            </div>
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => setIsAddingReminder(true)} 
            className={styles.addReminderBtn}
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Thêm mục nhắc nhở mới
          </button>
        )}
      </div>
      
      {/* Card 2: Nhắc nhở học tập Toggle */}
      <div className={styles.sidebarCard}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications_active
            </span>
            <h3 className={styles.sidebarCardTitle}>Nhắc nhở học tập</h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isReminderEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
              : 'bg-outline-variant/30 text-on-surface-variant border-outline-variant'
          }`}>
            {isReminderEnabled ? 'Đang bật' : 'Đang tắt'}
          </span>
        </div>
        
        <div className={styles.reminderToggleWrapper}>
          <div className={styles.reminderToggleLeft}>
            <p className={styles.reminderToggleTitle}>Nhắc bài trước 15 phút</p>
            <p className="text-[11px] text-on-surface-variant">Chuông thông báo & Email tài khoản</p>
          </div>
          <button 
            type="button"
            aria-label="Bật tắt nhắc nhở học tập"
            className={`w-10 h-5 rounded-full relative flex items-center px-0.5 cursor-pointer transition-colors ${isReminderEnabled ? 'bg-primary' : 'bg-outline'}`}
            onClick={toggleReminder}
            disabled={isUpdating}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isReminderEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Các kênh thông báo */}
        <div className="space-y-2 pt-0.5">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
            isReminderEnabled 
              ? 'bg-amber-500/5 border-amber-500/20 text-on-surface' 
              : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant opacity-60'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                notifications
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs leading-tight">Notification Bell</p>
              <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Chuông thông báo hệ thống</p>
            </div>
            {isReminderEnabled && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                Tự động
              </span>
            )}
          </div>

          <div className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
            isReminderEnabled 
              ? 'bg-blue-500/5 border-blue-500/20 text-on-surface' 
              : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant opacity-60'
          }`}>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                mail
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs leading-tight">Email tài khoản</p>
              <p className="text-[11px] text-on-surface-variant leading-tight mt-0.5">Gửi thư tới email đăng ký</p>
            </div>
            {isReminderEnabled && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full shrink-0">
                Tự động
              </span>
            )}
          </div>
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
              ? `"Chuẩn bị vào môn ${formatSubjectName(nextSlot.subjectName, simplifyNames)} ${nextSlot.teacherName ? `- ${nextSlot.teacherName}` : ''} ${nextSlot.room ? `tại ${nextSlot.room}` : ''}"`
              : 'Vui lòng cập nhật thời khóa biểu để nhận nhắc nhở.'}
          </p>
        </div>
      </div>

    </div>
  );
};

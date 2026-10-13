import React, { useState, useEffect, useMemo } from 'react';
import { styles } from '../TimetablePage.styles';
import { useAlert } from '../../../../context/AlertContext';
import { updateMyStudentProfile, getMyStudentProfile } from '../../../../services/studentProfileApi';
import type { ScheduleSlotDto } from '../../../../types/schedule';
import {
  type SchoolLevel,
  type TimetableConfig,
  LEVEL_PRESETS,
  generatePeriodsFromConfig,
  detectSchoolLevel,
  timeToMinutes,
  minutesToShortTimeStr,
  getSlotIndex,
  isAcademicSlot
} from '../../../../utils/timetableUtils';

interface TimetableSettingsPanelProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  defaultPeriods: { startTime: string; endTime: string }[];
  setDefaultPeriods: (periods: { startTime: string; endTime: string }[]) => void;
  currentPreferences: any;
  setCurrentPreferences: (prefs: any) => void;
  slots?: ScheduleSlotDto[];
  setSlots?: (slots: ScheduleSlotDto[]) => void;
  onSaveSchedule?: (newSlots?: ScheduleSlotDto[]) => Promise<void>;
}

export const TimetableSettingsPanel: React.FC<TimetableSettingsPanelProps> = ({
  showSettings,
  setShowSettings,
  defaultPeriods,
  setDefaultPeriods,
  currentPreferences,
  setCurrentPreferences,
  slots,
  setSlots,
  onSaveSchedule
}) => {
  const { showSuccess, showError } = useAlert();
  const [isSaving, setIsSaving] = useState(false);
  const [detectedLevel, setDetectedLevel] = useState<SchoolLevel>('PRIMARY');
  const [studentClassName, setStudentClassName] = useState<string>('');

  // Lấy cấu hình đã lưu trong profile hoặc dùng preset mặc định
  const initialConfig = useMemo<TimetableConfig>(() => {
    if (currentPreferences?.timetable_config) {
      return currentPreferences.timetable_config as TimetableConfig;
    }
    const level = (currentPreferences?.timetable_school_level as SchoolLevel) || 'PRIMARY';
    return { ...LEVEL_PRESETS[level] };
  }, [currentPreferences]);

  const [config, setConfig] = useState<TimetableConfig>(initialConfig);
  const [simplifySubjectNames, setSimplifySubjectNames] = useState<boolean>(
    currentPreferences?.simplifySubjectNames !== false
  );

  // Đồng bộ cấu hình khi preferences thay đổi
  useEffect(() => {
    if (currentPreferences?.timetable_config) {
      setConfig(currentPreferences.timetable_config as TimetableConfig);
    }
    if (currentPreferences?.simplifySubjectNames !== undefined) {
      setSimplifySubjectNames(currentPreferences.simplifySubjectNames !== false);
    }
  }, [currentPreferences]);

  // Nhận diện cấp học từ Profile của học sinh
  useEffect(() => {
    getMyStudentProfile()
      .then(profile => {
        if (profile) {
          if (profile.className) setStudentClassName(profile.className);
          const autoLevel = detectSchoolLevel(profile.gradeLevel, profile.className || profile.schoolName);
          setDetectedLevel(autoLevel);
          // Nếu học sinh chưa từng lưu cấu hình, tự động gán theo cấp học nhận diện
          if (!currentPreferences?.timetable_config && !currentPreferences?.timetable_school_level) {
            setConfig({ ...LEVEL_PRESETS[autoLevel] });
          }
        }
      })
      .catch(() => {});
  }, [currentPreferences]);

  if (!showSettings) return null;

  // Xử lý chuyển đổi Cấp học
  const handleSelectLevel = (level: SchoolLevel) => {
    const preset = LEVEL_PRESETS[level];
    setConfig({
      ...preset,
      schoolLevel: level,
    });
  };

  // Tính toán khung giờ thực tế của giờ ra chơi sáng
  const morningBreakTime = (() => {
    const startMin = timeToMinutes(config.morningStartTime || '07:00');
    let breakStartMin = startMin;
    for (let i = 1; i <= config.morningBreakAfterPeriod; i++) {
      breakStartMin += config.morningPeriodDuration;
      if (i < config.morningBreakAfterPeriod) {
        breakStartMin += (config.morningShortBreak || 0);
      }
    }
    const breakEndMin = breakStartMin + config.morningBreakDuration;
    return `${minutesToShortTimeStr(breakStartMin)} - ${minutesToShortTimeStr(breakEndMin)} (${config.morningBreakDuration}p)`;
  })();

  // Tính toán khung giờ thực tế của giờ ra chơi chiều
  const afternoonBreakTime = (() => {
    if (!config.afternoonEnabled) return 'Tắt ca chiều';
    const startMin = timeToMinutes(config.afternoonStartTime || '13:30');
    let breakStartMin = startMin;
    for (let i = 1; i <= config.afternoonBreakAfterPeriod; i++) {
      breakStartMin += (config.afternoonPeriodDuration || config.morningPeriodDuration);
      if (i < config.afternoonBreakAfterPeriod) {
        breakStartMin += (config.afternoonShortBreak || 0);
      }
    }
    const breakEndMin = breakStartMin + config.afternoonBreakDuration;
    return `${minutesToShortTimeStr(breakStartMin)} - ${minutesToShortTimeStr(breakEndMin)} (${config.afternoonBreakDuration}p)`;
  })();

  // Tính toán trước danh sách các tiết học để preview
  const previewPeriods = generatePeriodsFromConfig(config);

  // Lưu cài đặt vào Backend Database và áp dụng lên bảng TKB
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const newPeriods = generatePeriodsFromConfig(config);
      const updatedPrefs = {
        ...currentPreferences,
        timetable_school_level: config.schoolLevel,
        timetable_config: config,
        timetable_default_periods: newPeriods,
        simplifySubjectNames: simplifySubjectNames,
      };

      await updateMyStudentProfile({
        studyPreferences: updatedPrefs,
      });

      setCurrentPreferences(updatedPrefs);
      setDefaultPeriods(newPeriods);
      window.dispatchEvent(new CustomEvent('student-profile-updated'));

      // Tự động đồng bộ lại giờ bắt đầu & kết thúc của các môn học hiện có theo khung giờ mới
      if (slots && slots.length > 0 && onSaveSchedule) {
        const remappedSlots = slots.map(slot => {
          if (!isAcademicSlot(slot)) return slot;
          const idx = getSlotIndex(slot, defaultPeriods);
          const newPeriod = newPeriods[idx];
          if (newPeriod) {
            return {
              ...slot,
              startTime: newPeriod.startTime,
              endTime: newPeriod.endTime,
            };
          }
          return slot;
        });
        if (setSlots) setSlots(remappedSlots);
        await onSaveSchedule(remappedSlots);
      }

      showSuccess({
        title: 'Lưu cấu hình thành công!',
        description: `Đã cập nhật khung giờ học và đồng bộ thời khóa biểu thành công.`,
        confirmText: 'Đồng ý',
      });
      setShowSettings(false);
    } catch (err: any) {
      showError({
        title: 'Lỗi lưu cấu hình',
        description: err.message || 'Không thể lưu cài đặt vào máy chủ. Vui lòng thử lại sau.',
        confirmText: 'Đóng',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Đặt lại mặc định
  const handleResetDefault = () => {
    const defaultLevel = detectedLevel || 'PRIMARY';
    setConfig({ ...LEVEL_PRESETS[defaultLevel] });
    setSimplifySubjectNames(true);
  };

  return (
    <div className="p-5 bg-surface-container-low border-b border-outline-variant space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wide">
              Cấu hình Khung giờ & Số tiết theo 3 Cấp học
            </h3>
            <p className="text-xs text-on-surface-variant">
              Linh hoạt điều chỉnh chuẩn khung giờ phù hợp cho học sinh Tiểu học, Trung học cơ sở và Phổ thông.
            </p>
          </div>
        </div>
        <button
          className="text-on-surface-variant/60 hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition"
          onClick={() => setShowSettings(false)}
          title="Đóng cấu hình"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* 3 Cấp độ học tập (School Level Selector Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">school</span>
            Chọn chuẩn cấp học trường của bạn:
          </label>
          {studentClassName ? (
            <span className="text-[11px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-medium">
              Gợi ý theo lớp của bạn: {studentClassName}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Tiểu học */}
          <div
            onClick={() => handleSelectLevel('PRIMARY')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative select-none ${
              config.schoolLevel === 'PRIMARY'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/70 hover:border-primary/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎒</span>
                <span className="font-bold text-sm text-on-surface">Tiểu học (Cấp 1)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                35 - 40p / tiết
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Mỗi tiết 40 phút, giờ ra chơi 30 phút ăn nhẹ & thể dục, ca chiều nhẹ nhàng 2-3 tiết.
            </p>
            {detectedLevel === 'PRIMARY' && (
              <div className="mt-2 text-[10px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span> Phù hợp lớp của bạn
              </div>
            )}
          </div>

          {/* Card 2: THCS */}
          <div
            onClick={() => handleSelectLevel('SECONDARY')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative select-none ${
              config.schoolLevel === 'SECONDARY'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/70 hover:border-primary/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏫</span>
                <span className="font-bold text-sm text-on-surface">THCS (Cấp 2)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300">
                45p / tiết
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Mỗi tiết 45 phút, nghỉ giữa tiết 5 phút, ra chơi thể dục giữa giờ 20 phút sau tiết 2.
            </p>
            {detectedLevel === 'SECONDARY' && (
              <div className="mt-2 text-[10px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span> Phù hợp lớp của bạn
              </div>
            )}
          </div>

          {/* Card 3: THPT */}
          <div
            onClick={() => handleSelectLevel('HIGH')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative select-none ${
              config.schoolLevel === 'HIGH'
                ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm'
                : 'bg-surface-container-lowest border-outline-variant/70 hover:border-primary/50 hover:bg-surface-container-low'
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎓</span>
                <span className="font-bold text-sm text-on-surface">THPT (Cấp 3)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300">
                45p / tiết
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              5 tiết sáng từ 07:00, học chuyên sâu, ca chiều học thêm / phụ đạo linh hoạt.
            </p>
            {detectedLevel === 'HIGH' && (
              <div className="mt-2 text-[10px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">check_circle</span> Phù hợp lớp của bạn
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chi tiết cài đặt Buổi Sáng & Buổi Chiều */}
      <div className={styles.settingsGrid}>
        {/* Morning Session Settings */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <div className={styles.settingsCardHeaderLeft}>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">wb_sunny</span>
              <span>Ca học Buổi Sáng</span>
            </div>
            <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              {config.morningPeriodsCount} tiết học
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Số tiết sáng:</label>
              <select
                className={styles.settingsInput}
                value={config.morningPeriodsCount}
                onChange={e => setConfig({ ...config, morningPeriodsCount: parseInt(e.target.value, 10) })}
              >
                <option value={4}>4 tiết (Tiêu chuẩn tiểu học)</option>
                <option value={5}>5 tiết (Chuẩn THCS/THPT)</option>
              </select>
            </div>

            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Bắt đầu từ:</label>
              <input
                type="time"
                className={styles.settingsInput}
                value={config.morningStartTime}
                onChange={e => setConfig({ ...config, morningStartTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Thời lượng mỗi tiết:</label>
              <select
                className={styles.settingsInput}
                value={config.morningPeriodDuration}
                onChange={e => setConfig({ ...config, morningPeriodDuration: parseInt(e.target.value, 10) })}
              >
                <option value={35}>35 phút / tiết (Tiểu học cơ bản)</option>
                <option value={40}>40 phút / tiết (Tiểu học chuẩn)</option>
                <option value={45}>45 phút / tiết (Chuẩn Cấp 2, 3)</option>
                <option value={50}>50 phút / tiết</option>
              </select>
            </div>

            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Nghỉ giữa các tiết ngắn:</label>
              <select
                className={styles.settingsInput}
                value={config.morningShortBreak}
                onChange={e => setConfig({ ...config, morningShortBreak: parseInt(e.target.value, 10) })}
              >
                <option value={0}>0 phút (Liền tiết)</option>
                <option value={5}>5 phút (Tiêu chuẩn)</option>
              </select>
            </div>
          </div>

          {/* Khung giờ ra chơi sáng */}
          <div className={styles.settingsBreak}>
            <div className={styles.settingsBreakHeader}>
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <span className="material-symbols-outlined text-[16px]">coffee</span>
                <span>Giờ ra chơi sáng:</span>
              </div>
              <span className="text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">
                {morningBreakTime}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Vị trí ra chơi:</label>
                <select
                  className={styles.settingsInput}
                  value={config.morningBreakAfterPeriod}
                  onChange={e => setConfig({ ...config, morningBreakAfterPeriod: parseInt(e.target.value, 10) })}
                >
                  <option value={2}>Sau Tiết 2</option>
                  <option value={3}>Sau Tiết 3</option>
                </select>
              </div>

              <div className={styles.settingsField}>
                <label className={styles.settingsLabel}>Thời lượng ra chơi:</label>
                <select
                  className={styles.settingsInput}
                  value={config.morningBreakDuration}
                  onChange={e => setConfig({ ...config, morningBreakDuration: parseInt(e.target.value, 10) })}
                >
                  <option value={15}>15 phút</option>
                  <option value={20}>20 phút (Tiêu chuẩn)</option>
                  <option value={25}>25 phút</option>
                  <option value={30}>30 phút (Tiểu học ăn nhẹ)</option>
                </select>
              </div>
            </div>

            <div className={styles.settingsField}>
              <label className={styles.settingsLabel}>Tên hoạt động giữa giờ:</label>
              <input
                type="text"
                className={styles.settingsInput}
                value={config.morningActivityName}
                onChange={e => setConfig({ ...config, morningActivityName: e.target.value })}
                placeholder="VD: Thể dục giữa giờ, Ăn nhẹ..."
              />
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
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <span>{config.afternoonEnabled ? 'Bật ca chiều' : 'Tắt ca chiều'}</span>
              <button
                type="button"
                onClick={() => setConfig({ ...config, afternoonEnabled: !config.afternoonEnabled })}
                className={`w-9 h-5 rounded-full relative flex items-center px-0.5 transition-colors cursor-pointer ${
                  config.afternoonEnabled ? 'bg-primary' : 'bg-outline-variant'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                    config.afternoonEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {config.afternoonEnabled ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Số tiết chiều:</label>
                  <select
                    className={styles.settingsInput}
                    value={config.afternoonPeriodsCount}
                    onChange={e => setConfig({ ...config, afternoonPeriodsCount: parseInt(e.target.value, 10) })}
                  >
                    <option value={2}>2 tiết (Bán trú nhẹ)</option>
                    <option value={3}>3 tiết (Chuẩn tăng cường)</option>
                    <option value={4}>4 tiết (Chính khóa 2 buổi)</option>
                  </select>
                </div>

                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Giờ vào ca chiều:</label>
                  <input
                    type="time"
                    className={styles.settingsInput}
                    value={config.afternoonStartTime}
                    onChange={e => setConfig({ ...config, afternoonStartTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Thời lượng mỗi tiết chiều:</label>
                  <select
                    className={styles.settingsInput}
                    value={config.afternoonPeriodDuration || config.morningPeriodDuration}
                    onChange={e => setConfig({ ...config, afternoonPeriodDuration: parseInt(e.target.value, 10) })}
                  >
                    <option value={35}>35 phút / tiết</option>
                    <option value={40}>40 phút / tiết</option>
                    <option value={45}>45 phút / tiết</option>
                  </select>
                </div>

                <div className={styles.settingsField}>
                  <label className={styles.settingsLabel}>Nghỉ giữa tiết chiều:</label>
                  <select
                    className={styles.settingsInput}
                    value={config.afternoonShortBreak}
                    onChange={e => setConfig({ ...config, afternoonShortBreak: parseInt(e.target.value, 10) })}
                  >
                    <option value={0}>0 phút (Liền tiết)</option>
                    <option value={5}>5 phút (Tiêu chuẩn)</option>
                  </select>
                </div>
              </div>

              {/* Khung giờ ra chơi chiều */}
              <div className={styles.settingsBreak}>
                <div className={styles.settingsBreakHeader}>
                  <div className="flex items-center gap-1.5 text-orange-600 font-bold">
                    <span className="material-symbols-outlined text-[16px]">emoji_food_beverage</span>
                    <span>Giờ ra chơi chiều:</span>
                  </div>
                  <span className="text-[11px] font-semibold text-orange-600 px-2 py-0.5 rounded bg-orange-500/10">
                    {afternoonBreakTime}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1.5">
                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Vị trí ra chơi:</label>
                    <select
                      className={styles.settingsInput}
                      value={config.afternoonBreakAfterPeriod}
                      onChange={e => setConfig({ ...config, afternoonBreakAfterPeriod: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>Sau Tiết 1 chiều</option>
                      <option value={2}>Sau Tiết 2 chiều</option>
                    </select>
                  </div>

                  <div className={styles.settingsField}>
                    <label className={styles.settingsLabel}>Thời lượng ra chơi chiều:</label>
                    <select
                      className={styles.settingsInput}
                      value={config.afternoonBreakDuration}
                      onChange={e => setConfig({ ...config, afternoonBreakDuration: parseInt(e.target.value, 10) })}
                    >
                      <option value={15}>15 phút</option>
                      <option value={20}>20 phút (Tiêu chuẩn)</option>
                      <option value={25}>25 phút</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-on-surface-variant/60">
              <span className="material-symbols-outlined text-3xl mb-1">nightlight</span>
              <p className="text-xs">Ca học buổi chiều đang tắt. Bạn có thể bật lại bất cứ lúc nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* Tùy chọn hiển thị tên môn học */}
      <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Rút gọn & Làm đẹp tên môn học</div>
            <div className="text-[11px] text-on-surface-variant">
              Tự động lược bỏ các chữ phụ như "T.cường", "Tăng cường", "TC" (chỉ ghi gọn "Toán", "Tiếng Việt") giúp thời khóa biểu gọn gàng, đẹp mắt.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSimplifySubjectNames(prev => !prev)}
          className={`w-11 h-6 rounded-full relative flex items-center px-0.5 cursor-pointer transition-colors shrink-0 ${simplifySubjectNames ? 'bg-primary' : 'bg-outline-variant'}`}
          title="Bật/Tắt tự động rút gọn tên môn học"
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${simplifySubjectNames ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </button>
      </div>

      {/* Xem trước khung giờ trực quan (Schedule Timeline Preview) */}
      <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
            Xem trước khung giờ các tiết học sẽ áp dụng ({previewPeriods.length} tiết):
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Tự động cập nhật theo cài đặt
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {previewPeriods.map((p, idx) => {
            const isMorning = idx < (config.morningPeriodsCount || 5);
            const periodLabel = isMorning ? `Tiết ${idx + 1}` : `Tiết ${idx - (config.morningPeriodsCount || 5) + 1} Chiều`;
            const start = p.startTime.substring(0, 5);
            const end = p.endTime.substring(0, 5);

            return (
              <div
                key={idx}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                  isMorning
                    ? 'bg-primary/5 border-primary/20 text-on-surface'
                    : 'bg-orange-500/5 border-orange-500/20 text-on-surface'
                }`}
              >
                <span className={`font-bold ${isMorning ? 'text-primary' : 'text-orange-600'}`}>
                  {periodLabel}:
                </span>
                <span className="tabular-nums text-on-surface-variant font-semibold">
                  {start} - {end}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className={styles.settingsFooter}>
        <div className={styles.settingsFooterText}>
          <span className="material-symbols-outlined text-[15px] text-primary">info</span>
          Lưới thời khóa biểu và các tính toán thời gian sẽ tự động căn chuẩn theo cấu hình này.
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-xs font-semibold text-on-surface-variant hover:text-primary transition cursor-pointer px-2 py-1"
          >
            Đặt lại mặc định
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="px-3.5 py-2 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-xs font-semibold rounded-xl text-on-surface transition active:scale-95"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Lưu & Áp dụng ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

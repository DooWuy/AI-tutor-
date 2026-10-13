import React, { useRef, useState, useMemo } from 'react';
import { styles } from './TimetablePage.styles';
import { extractScheduleFromImage } from '../../../services/scheduleApi';
import { getDayDate, getFullDayDate, getTomorrowDayName, getNormalizedDay } from '../../../utils/dateUtils';
import { useTimetable } from './hooks/useTimetable';
import { TimetableHeader } from './components/TimetableHeader';
import { TimetableSidebar } from './components/TimetableSidebar';
import { TimetableSettingsPanel } from './components/TimetableSettingsPanel';
import { TimetableSlotModal } from './components/TimetableSlotModal';
import { SubjectColorModal } from './components/SubjectColorModal';
import { useAlert } from '../../../context/AlertContext';
import { useTheme } from '../../../context/ThemeContext';
import { isAcademicSlot, getSlotIndex, formatSubjectName } from '../../../utils/timetableUtils';
import { getSubjectColor, getSubjectIcon, generateSubjectStyles } from '../../../utils/subjectColorUtils';

export const TimetablePage: React.FC = () => {
  const { showAlert, showSuccess, showError } = useAlert();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const {
    slots,
    setSlots,
    isLoading,
    setIsLoading,
    defaultPeriods,
    setDefaultPeriods,
    currentPreferences,
    setCurrentPreferences,
    selectedSlot,
    setSelectedSlot,
    isEditModalOpen,
    setIsEditModalOpen,
    showSettings,
    setShowSettings,
    handleSaveSchedule,
    handleDeleteSlot,
    handleSaveSlot,
    handleAddSlot,
    handleSlotClick,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleSaveSubjectColors
  } = useTimetable();

  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const subjectColors = (currentPreferences?.timetable_subject_colors || {}) as Record<string, string>;

  const simplifyNames = (currentPreferences as any)?.simplifySubjectNames !== false;

  // Strictly extract unique active subjects from the actual timetable slots (cleaned & neat)
  const currentTimetableSubjects = useMemo(() => {
    const set = new Set<string>();
    slots.forEach(s => {
      if (isAcademicSlot(s) && s.subjectName) {
        const trimmed = formatSubjectName(s.subjectName, simplifyNames);
        if (trimmed) set.add(trimmed);
      }
    });
    return Array.from(set);
  }, [slots, simplifyNames]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [weekOffset, setWeekOffset] = useState(0);
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);

  const currentYear = baseDate.getFullYear();
  const weekStart = getFullDayDate(0, baseDate);
  const weekEnd = getFullDayDate(6, baseDate);
  const tomorrowDayName = getTomorrowDayName(baseDate);
  const normalizedDay = weekOffset === 0 ? getNormalizedDay() : -1; // -1 to avoid highlighting "today" column when not in current week

  const handlePreviousWeek = () => setWeekOffset(prev => prev - 1);
  const handleNextWeek = () => setWeekOffset(prev => prev + 1);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const extracted = await extractScheduleFromImage(file);
      const cleanSlots = (extracted?.slots || []).filter(isAcademicSlot).map(s => ({
        ...s,
        subjectName: formatSubjectName(s.subjectName, true)
      }));
      setSlots(cleanSlots);
      showSuccess({
        title: 'Quét thời khóa biểu thành công!',
        description: 'Đã quét TKB bằng AI thành công! Nhấn "Lưu TKB" để lưu lại.',
        confirmText: 'Tuyệt vời',
      });
    } catch (err: any) {
      showError({
        title: 'Lỗi quét hình ảnh',
        description: err.message || 'Không thể trích xuất thời khóa biểu từ ảnh. Vui lòng kiểm tra lại chất lượng hình ảnh.',
        confirmText: 'Đóng',
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const timetableConfig = (currentPreferences?.timetable_config || {}) as any;
  const morningCount = timetableConfig.morningPeriodsCount || 5;
  const morningStart = defaultPeriods[0]?.startTime ? defaultPeriods[0].startTime.substring(0, 5) : '07:00';
  const morningEnd = defaultPeriods[morningCount - 1]?.endTime
    ? defaultPeriods[morningCount - 1].endTime.substring(0, 5)
    : (defaultPeriods[4]?.endTime?.substring(0, 5) || '11:15');

  const morningBreakAfter = timetableConfig.morningBreakAfterPeriod || 2;
  const morningBreakStart = defaultPeriods[morningBreakAfter - 1]?.endTime
    ? defaultPeriods[morningBreakAfter - 1].endTime.substring(0, 5)
    : '08:20';
  const morningBreakEnd = defaultPeriods[morningBreakAfter]?.startTime
    ? defaultPeriods[morningBreakAfter].startTime.substring(0, 5)
    : '08:50';
  const morningBreakName = timetableConfig.morningActivityName || 'Giờ ra chơi Buổi Sáng';
  const morningBreakDur = timetableConfig.morningBreakDuration || 25;

  const lunchStart = morningEnd;
  const lunchEnd = defaultPeriods[morningCount]?.startTime 
    ? defaultPeriods[morningCount].startTime.substring(0, 5) 
    : '13:30';

  const afternoonEnabled = timetableConfig.afternoonEnabled !== false;
  const afternoonCount = timetableConfig.afternoonPeriodsCount || 3;
  const afternoonStart = defaultPeriods[morningCount]?.startTime 
    ? defaultPeriods[morningCount].startTime.substring(0, 5) 
    : '13:30';
  const afternoonEnd = defaultPeriods[morningCount + afternoonCount - 1]?.endTime
    ? defaultPeriods[morningCount + afternoonCount - 1].endTime.substring(0, 5)
    : (defaultPeriods[defaultPeriods.length - 1]?.endTime?.substring(0, 5) || '16:10');

  const afternoonBreakAfter = timetableConfig.afternoonBreakAfterPeriod || 2;
  const afternoonBreakStart = defaultPeriods[morningCount + afternoonBreakAfter - 1]?.endTime
    ? defaultPeriods[morningCount + afternoonBreakAfter - 1].endTime.substring(0, 5)
    : '15:05';
  const afternoonBreakEnd = defaultPeriods[morningCount + afternoonBreakAfter]?.startTime
    ? defaultPeriods[morningCount + afternoonBreakAfter].startTime.substring(0, 5)
    : '15:25';
  const afternoonBreakDur = timetableConfig.afternoonBreakDuration || 20;

  const morningFirstBatch = useMemo(
    () => Array.from({ length: Math.min(morningBreakAfter, morningCount) }, (_, i) => i),
    [morningBreakAfter, morningCount]
  );
  const morningSecondBatch = useMemo(
    () => Array.from({ length: Math.max(0, morningCount - morningBreakAfter) }, (_, i) => morningBreakAfter + i),
    [morningBreakAfter, morningCount]
  );

  const afternoonFirstBatch = useMemo(
    () => Array.from({ length: Math.min(afternoonBreakAfter, afternoonCount) }, (_, i) => morningCount + i),
    [afternoonBreakAfter, afternoonCount, morningCount]
  );
  const afternoonSecondBatch = useMemo(
    () => Array.from({ length: Math.max(0, afternoonCount - afternoonBreakAfter) }, (_, i) => morningCount + afternoonBreakAfter + i),
    [afternoonBreakAfter, afternoonCount, morningCount]
  );

  const getPeriodTime = (idx: number) => {
    const period = defaultPeriods[idx];
    if (!period) return '';
    const start = period.startTime ? period.startTime.substring(0, 5) : '';
    const end = period.endTime ? period.endTime.substring(0, 5) : '';
    return start && end ? `${start} - ${end}` : start;
  };

  const getSubjectCard = (day: number, index: number) => {
    const cellSlots = slots.filter(s => isAcademicSlot(s) && s.dayOfWeek === day && getSlotIndex(s, defaultPeriods) === index);
    if (cellSlots.length === 0) return (
      <td
        key={`${day}-${index}`}
        className={styles.emptyCell}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, index)}
        onClick={() => handleAddSlot(day, index)}
      >
        {/* Dấu cộng nhỏ ở góc trên bên phải, tinh tế và không che chữ */}
        <div
          className="absolute top-1 right-1 w-4.5 h-4.5 rounded flex items-center justify-center text-outline/30 group-hover:text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-150"
          title="Thêm tiết học"
        >
          <span className="material-symbols-outlined text-[13px] font-bold">add</span>
        </div>

        {/* Chữ Trống căn chính giữa ô */}
        <div className="flex items-center justify-center h-full">
          <span className="text-[11px] font-normal text-outline/40 group-hover:text-primary/70 transition-colors">
            Trống
          </span>
        </div>
      </td>
    );

    return (
      <td
        className={styles.cellBase}
        key={`${day}-${index}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, index)}
      >
        <div className="flex flex-col gap-1.5 h-full">
          {cellSlots.map(slot => {
            const subjectName = formatSubjectName(slot.subjectName || '', simplifyNames);
            const color = getSubjectColor(subjectName, subjectColors);
            const { cardStyle, badgeStyle } = generateSubjectStyles(color, isDarkMode);
            const icon = getSubjectIcon(subjectName);

            return (
              <div
                key={slot.id || `${slot.subjectName}-${slot.startTime}-${slot.dayOfWeek}`}
                className="group relative rounded-xl p-2 cursor-grab active:cursor-grabbing select-none hover:shadow-md hover:scale-[1.01] hover:brightness-105 transition-all duration-200"
                style={cardStyle}
                draggable
                onDragStart={(e) => handleDragStart(e, day, index, slot.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSlotClick(slot)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-surface-container-highest/80 hover:bg-error hover:text-white transition-all text-error flex items-center justify-center shadow-xs z-10"
                  title="Xóa tiết học"
                >
                  <span className="material-symbols-outlined text-[13px]">close</span>
                </button>

                <div className="flex items-center gap-1.5 mb-1">
                  <span 
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-2xs"
                    style={badgeStyle}
                  >
                    <span className="material-symbols-outlined text-[11px] opacity-80">{icon}</span>
                    <span className="truncate">{subjectName}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium truncate">
                  {slot.room ? (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-surface-container-high font-semibold text-on-surface shrink-0">
                      {slot.room}
                    </span>
                  ) : null}
                  <span className="truncate">
                    {slot.teacherName || (slot.startTime ? slot.startTime.substring(0, 5) : '')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </td>
    );
  };

  return (
    <div className={styles.container}>
      <TimetableHeader
        weekStart={weekStart}
        weekEnd={weekEnd}
        isLoading={isLoading}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        handleUploadImage={handleUploadImage}
        handleSaveSchedule={handleSaveSchedule}
        handlePreviousWeek={handlePreviousWeek}
        handleNextWeek={handleNextWeek}
        weekOffset={weekOffset}
        onOpenColorModal={() => setIsColorModalOpen(true)}
      />

      {/* MAIN TIMETABLE LAYOUT (GRID & SIDEBAR) */}
      <div className={styles.gridContainer}>
        {/* ================== LEFT TIMETABLE GRID ================== */}
        <div className={styles.tableWrapper}>
          {/* Grid Header */}
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderTitleGroup}>
              <span className="material-symbols-outlined text-primary">calendar_view_week</span>
              <h2 className={styles.tableHeaderTitle}>Lưới thời khóa biểu học kỳ 1 (Năm học {currentYear} - {currentYear + 1})</h2>
            </div>
            <div className={styles.tableHeaderActions}>
              <button
                onClick={() => handleSaveSchedule()}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary hover:bg-primary/90 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Lưu TKB</span>
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold shadow-xs transition active:scale-95">
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>Cấu hình khung giờ & số tiết</span>
              </button>
              <button
                onClick={() => setIsColorModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant hover:border-primary/50 text-primary rounded-xl text-xs font-semibold shadow-xs transition active:scale-95"
                title="Tùy chỉnh bảng mã màu môn học">
                <span className="material-symbols-outlined text-sm text-primary">palette</span>
                <span>Bảng mã màu</span>
              </button>
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant p-1 rounded-xl">
                <button className="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded-lg shadow-sm">Xem cả tuần</button>
                <button className="px-3 py-1 text-on-surface-variant hover:text-primary text-xs font-medium rounded-lg">Chỉ hôm nay</button>
              </div>
            </div>
          </div>

          {/* Expanded Settings Panel (Tùy chỉnh số tiết & khung giờ theo 3 cấp học) */}
          <TimetableSettingsPanel 
            showSettings={showSettings} 
            setShowSettings={setShowSettings}
            defaultPeriods={defaultPeriods}
            setDefaultPeriods={setDefaultPeriods}
            currentPreferences={currentPreferences}
            setCurrentPreferences={setCurrentPreferences}
            slots={slots}
            setSlots={setSlots}
            onSaveSchedule={handleSaveSchedule}
          />

          {/* Table Content */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className={styles.table}>
              <thead className="sticky top-0 z-20 shadow-2xs">
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  <th className={styles.thTime}>Tiết / Giờ</th>
                  {[
                    { day: 0, name: 'Thứ Hai' },
                    { day: 1, name: 'Thứ Ba' },
                    { day: 2, name: 'Thứ Tư' },
                    { day: 3, name: 'Thứ Năm' },
                    { day: 4, name: 'Thứ Sáu' },
                    { day: 5, name: 'Thứ Bảy' },
                    { day: 6, name: 'Chủ Nhật' },
                  ].map(({ day, name }) => {
                    const isToday = normalizedDay === day;
                    return (
                      <th
                        key={day}
                        className={isToday ? styles.thToday : styles.thBase}
                        style={{ width: '12.71%' }}
                      >
                        {isToday && (
                          <div className="flex justify-center mb-0.5">
                            <span className={styles.thTodayBadge}>Hôm nay</span>
                          </div>
                        )}
                        <div className="font-bold text-xs truncate">{name}</div>
                        <span className={isToday ? styles.thTodayDate : styles.thNormalDate}>
                          {getDayDate(day, baseDate)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {/* Session Sáng */}
                <tr className={styles.sessionHeaderRow}>
                  <td colSpan={8} className="py-2 px-3 sm:px-4 bg-primary/10 border-y border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-primary">
                        <span className="material-symbols-outlined text-base">wb_sunny</span>
                        <span className="tracking-wide uppercase">BUỔI SÁNG ({morningStart} - {morningEnd}) • {morningCount} TIẾT CHÍNH KHÓA</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium text-primary/80 shrink-0">
                        {timetableConfig.levelName || 'Khung giờ tiêu chuẩn'}
                      </span>
                    </div>
                  </td>
                </tr>

                {morningFirstBatch.map(index => (
                  <tr className={styles.timeRow} key={`morning-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index + 1}</div>
                      <div className={styles.timeCellTime}>{getPeriodTime(index)}</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Giờ ra chơi sáng */}
                {morningSecondBatch.length > 0 && (
                  <tr className={styles.breakRow}>
                    <td colSpan={8} className="py-1.5 px-3 sm:px-4 bg-primary/5 border-y border-primary/20">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-primary/15 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-xs">coffee</span>
                          </div>
                          <span className="font-bold text-primary text-xs">{morningBreakName} ({morningBreakStart} - {morningBreakEnd})</span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-medium text-primary/70 shrink-0">{morningBreakDur} phút giải lao</span>
                      </div>
                    </td>
                  </tr>
                )}

                {morningSecondBatch.map(index => (
                  <tr className={styles.timeRow} key={`morning-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index + 1}</div>
                      <div className={styles.timeCellTime}>{getPeriodTime(index)}</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Nghỉ Trưa */}
                <tr className={styles.lunchRow}>
                  <td colSpan={8} className="py-2 px-3 sm:px-4 bg-surface-container-high/50 border-y border-outline-variant">
                    <div className="flex items-center justify-center text-xs font-bold text-on-surface-variant gap-2">
                      <div className="w-5 h-5 rounded bg-surface-container-highest flex items-center justify-center text-amber-500">
                        <span className="material-symbols-outlined text-[14px]">restaurant</span>
                      </div>
                      <span className="tracking-wide">NGHỈ TRƯA & ĂN BÁN TRÚ ({lunchStart} - {lunchEnd})</span>
                      <span className="text-[11px] font-normal text-on-surface-variant/70">• Giải lao trưa</span>
                    </div>
                  </td>
                </tr>

                {/* Session Chiều */}
                {afternoonEnabled ? (
                  <>
                    <tr className={styles.sessionHeaderRow}>
                      <td colSpan={8} className="py-2 px-3 sm:px-4 bg-amber-500/10 border-y border-amber-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-xs text-amber-600 dark:text-amber-400">
                            <span className="material-symbols-outlined text-base">light_mode</span>
                            <span className="tracking-wide uppercase">BUỔI CHIỀU ({afternoonStart} - {afternoonEnd}) • {afternoonCount} TIẾT HỌC</span>
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-medium text-amber-600/80 dark:text-amber-400/80 shrink-0">
                            {afternoonCount} tiết tự chọn / phụ đạo
                          </span>
                        </div>
                      </td>
                    </tr>

                    {afternoonFirstBatch.map(index => (
                      <tr className={styles.timeRow} key={`afternoon-${index}`}>
                        <td className={styles.timeCell}>
                          <div className={styles.timeCellTitle}>Tiết {index - morningCount + 1} Chiều</div>
                          <div className={styles.timeCellTime}>{getPeriodTime(index)}</div>
                        </td>
                        {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                      </tr>
                    ))}

                    {/* Giờ ra chơi chiều */}
                    {afternoonSecondBatch.length > 0 && (
                      <tr className="bg-amber-500/5 border-y border-amber-500/20">
                        <td colSpan={8} className="py-1.5 px-3 sm:px-4">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <span className="material-symbols-outlined text-xs">emoji_food_beverage</span>
                              </div>
                              <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">Giờ ra chơi Buổi Chiều ({afternoonBreakStart} - {afternoonBreakEnd})</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70 shrink-0">{afternoonBreakDur} phút giải lao</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {afternoonSecondBatch.map(index => (
                      <tr className={styles.timeRow} key={`afternoon-${index}`}>
                        <td className={styles.timeCell}>
                          <div className={styles.timeCellTitle}>Tiết {index - morningCount + 1} Chiều</div>
                          <div className={styles.timeCellTime}>{getPeriodTime(index)}</div>
                        </td>
                        {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr className={styles.sessionHeaderRow}>
                    <td colSpan={8} className="py-2.5 px-4 bg-surface-container/30 border-y border-outline-variant/40 text-center">
                      <span className="text-xs text-on-surface-variant/60 font-medium">
                        Ca học buổi chiều đang tắt theo cài đặt. Bạn có thể bật lại trong Cài đặt TKB.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Legend */}
          <div className="p-3 bg-surface-container-low/60 border-t border-outline-variant flex flex-wrap items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">palette</span>
                Chú thích môn học:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentTimetableSubjects.length > 0 ? (
                  currentTimetableSubjects.map(subject => {
                    const color = getSubjectColor(subject, subjectColors);
                    const { badgeStyle } = generateSubjectStyles(color, isDarkMode);
                    const icon = getSubjectIcon(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => setIsColorModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xs group"
                        style={badgeStyle}
                        title={`Môn ${subject} (${color}) - Bấm để tùy chỉnh màu`}
                      >
                        <span className="material-symbols-outlined text-[11px] opacity-80 group-hover:opacity-100">{icon}</span>
                        <span>{subject}</span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-on-surface-variant/60 italic">Chưa có môn học nào</span>
                )}
              </div>
            </div>
            <button 
              className="text-primary font-semibold flex items-center gap-1.5 hover:underline whitespace-nowrap ml-auto text-xs px-2.5 py-1 rounded-lg hover:bg-primary/10 transition active:scale-95 cursor-pointer"
              onClick={() => setIsColorModalOpen(true)}
              title="Mở bảng cài đặt mã màu thông minh cho môn học"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span> Tùy chỉnh mã màu
            </button>
          </div>
        </div>

        <TimetableSidebar
          tomorrowDayName={tomorrowDayName}
          isLoading={isLoading}
          handleUploadImage={handleUploadImage}
          slots={slots}
          currentPreferences={currentPreferences}
          setCurrentPreferences={setCurrentPreferences}
          showAlert={showAlert}
        />
      </div>

      {/* EDIT SLOT MODAL */}
      <TimetableSlotModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
        handleSaveSlot={handleSaveSlot}
        handleDeleteSlot={handleDeleteSlot}
        isLoading={isLoading}
      />

      {/* SUBJECT COLOR CUSTOMIZATION MODAL */}
      <SubjectColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        subjects={currentTimetableSubjects}
        currentColors={subjectColors}
        onSaveColors={handleSaveSubjectColors}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

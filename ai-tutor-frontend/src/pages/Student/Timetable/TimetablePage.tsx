import React, { useRef, useState } from 'react';
import { styles } from './TimetablePage.styles';
import { extractScheduleFromImage } from '../../../services/scheduleApi';
import { getDayDate, getFullDayDate, getTomorrowDayName, getNormalizedDay } from '../../../utils/dateUtils';
import { useTimetable } from './hooks/useTimetable';
import { TimetableHeader } from './components/TimetableHeader';
import { TimetableBanner } from './components/TimetableBanner';
import { TimetableSidebar } from './components/TimetableSidebar';
import { TimetableSettingsPanel } from './components/TimetableSettingsPanel';
import { TimetableSlotModal } from './components/TimetableSlotModal';
import type { ScheduleSlotDto } from '../../../types/schedule';

export const TimetablePage: React.FC = () => {
  const {
    slots,
    setSlots,
    isLoading,
    setIsLoading,
    defaultPeriods,
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
    handleDrop
  } = useTimetable();

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
      setSlots(extracted?.slots || []);
      alert('Đã quét TKB bằng AI thành công! Nhấn "Lưu TKB" để lưu lại.');
    } catch (err: any) {
      alert(err.message || 'Lỗi quét ảnh');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };



  const getSlotIndex = (slot: ScheduleSlotDto) => {
    const slotStart = slot.startTime || '00:00:00';
    const exactIdx = defaultPeriods.findIndex((p: any) => p.startTime === slotStart);
    if (exactIdx !== -1) return exactIdx;

    const rangeIdx = defaultPeriods.findIndex((p: any) => slotStart >= p.startTime && slotStart < p.endTime);
    if (rangeIdx !== -1) return rangeIdx;

    let closestIdx = 0;
    let minDiff = Infinity;
    defaultPeriods.forEach((p: any, i: number) => {
      const diff = Math.abs(new Date(`1970-01-01T${slotStart}`).getTime() - new Date(`1970-01-01T${p.startTime}`).getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    return closestIdx;
  };

  const getSubjectCard = (day: number, index: number) => {
    const slot = slots.find(s => s.dayOfWeek === day && getSlotIndex(s) === index);
    if (!slot) return (
      <td
        key={`${day}-${index}`}
        className={`${styles.emptyCell} cursor-pointer hover:bg-surface-variant/50 transition group relative`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, index)}
        onClick={() => handleAddSlot(day, index)}
      >
        <span className="text-[11px] italic text-on-surface-variant group-hover:hidden">Trống</span>
        <span className="hidden group-hover:flex material-symbols-outlined text-primary text-sm absolute inset-0 items-center justify-center">add</span>
      </td>
    );

    let cardClass = styles.cardSurface;
    let badgeClass = styles.badgeSurface;

    const name = (slot.subjectName || '').toLowerCase();
    if (name.includes('toán')) { cardClass = styles.cardPrimary; badgeClass = styles.badgePrimary; }
    else if (name.includes('văn')) { cardClass = styles.cardPurple; badgeClass = styles.badgePurple; }
    else if (name.includes('anh')) { cardClass = styles.cardEmerald; badgeClass = styles.badgeEmerald; }
    else if (name.includes('lý')) { cardClass = 'rounded-xl p-2.5 bg-teal-50 border border-teal-200 text-on-surface hover:shadow-sm transition'; badgeClass = 'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800'; }
    else if (name.includes('hóa')) { cardClass = 'rounded-xl p-2.5 bg-orange-50 border-2 border-tertiary text-on-surface hover:shadow-md transition'; badgeClass = 'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-tertiary text-on-tertiary'; }
    else if (name.includes('sử') || name.includes('địa')) { cardClass = styles.cardAmber; badgeClass = styles.badgeAmber; }

    return (
      <td
        className={styles.cellBase}
        key={`${day}-${index}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, day, index)}
      >
        <div
          className={`${cardClass} group relative`}
          draggable
          onDragStart={(e) => handleDragStart(e, day, index)}
          onDragEnd={handleDragEnd}
          style={{ cursor: 'grab' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded-full transition-opacity text-error flex items-center justify-center"
            title="Xóa tiết học"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>

          <div onClick={() => handleSlotClick(slot)}>
            <span className={badgeClass}>{slot.subjectName}</span>
            <p className={styles.subjectTitle}>{slot.subjectName}</p>
            <p className={styles.subjectDesc}>
              {slot.room ? `${slot.room} • ` : ''}
              {slot.teacherName || (slot.startTime ? slot.startTime.substring(0, 5) : '')}
            </p>
          </div>
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
      />

      <TimetableBanner tomorrowDayName={tomorrowDayName} />

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
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed/80 border border-primary/30 rounded-xl text-xs font-semibold shadow-xs transition active:scale-95">
                <span className="material-symbols-outlined text-sm">tune</span>
                <span className="">Cấu hình khung giờ & số tiết</span>
              </button>
              <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant p-1 rounded-xl">
                <button className="px-3 py-1 bg-primary text-on-primary text-xs font-semibold rounded-lg shadow-sm">Xem cả tuần</button>
                <button className="px-3 py-1 text-on-surface-variant hover:text-primary text-xs font-medium rounded-lg">Chỉ hôm nay</button>
              </div>
            </div>
          </div>

          {/* Expanded Settings Panel (Tùy chỉnh số tiết & khung giờ) */}
          <TimetableSettingsPanel 
            showSettings={showSettings} 
            setShowSettings={setShowSettings} 
          />


          {/* Table Content */}
          <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
            <table className={styles.table}>
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  <th className={styles.thTime}>Tiết / Khung giờ</th>
                  <th className={normalizedDay === 0 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 0 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 0 ? "mt-2" : ""}>Thứ Hai</div>
                    <span className={normalizedDay === 0 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(0, baseDate)}</span>
                  </th>
                  <th className={normalizedDay === 1 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 1 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 1 ? "mt-2" : ""}>Thứ Ba</div>
                    <span className={normalizedDay === 1 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(1, baseDate)}</span>
                  </th>
                  <th className={normalizedDay === 2 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 2 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 2 ? "mt-2" : ""}>Thứ Tư</div>
                    <span className={normalizedDay === 2 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(2, baseDate)}</span>
                  </th>
                  <th className={normalizedDay === 3 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 3 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 3 ? "mt-2" : ""}>Thứ Năm</div>
                    <span className={normalizedDay === 3 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(3, baseDate)}</span>
                  </th>
                  <th className={normalizedDay === 4 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 4 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 4 ? "mt-2" : ""}>Thứ Sáu</div>
                    <span className={normalizedDay === 4 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(4, baseDate)}</span>
                  </th>
                  <th className={normalizedDay === 5 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 5 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 5 ? "mt-2" : ""}>Thứ Bảy</div>
                    <span className={normalizedDay === 5 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(5, baseDate)}</span>
                  </th>
                  <th className={normalizedDay === 6 ? styles.thToday : styles.thBase}>
                    {normalizedDay === 6 && <div className={styles.thTodayBadge}>Hôm nay</div>}
                    <div className={normalizedDay === 6 ? "mt-2" : ""}>Chủ Nhật</div>
                    <span className={normalizedDay === 6 ? styles.thTodayDate : styles.thNormalDate}>{getDayDate(6, baseDate)}</span>
                  </th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {/* Session Sáng */}
                <tr className={styles.sessionHeaderRow}>
                  <td colSpan={8} className="py-2 px-4">
                    <div className={styles.sessionHeaderCell}>
                      <div className={styles.sessionHeaderLeft}>
                        <span className="material-symbols-outlined text-sm">wb_sunny</span>
                        <span>BUỔI SÁNG (07:15 - 11:40) • 5 TIẾT CHÍNH KHÓA</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {[0, 1].map(index => (
                  <tr className={styles.timeRow} key={`morning-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index + 1}</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Giờ ra chơi */}
                <tr className={styles.breakRow}>
                  <td colSpan={8} className={styles.breakRowContent}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">coffee</span>
                      <span className="font-bold text-primary">Giờ ra chơi Buổi Sáng (08:50 - 09:15)</span>
                    </div>
                  </td>
                </tr>

                {[2, 3, 4].map(index => (
                  <tr className={styles.timeRow} key={`morning-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index + 1}</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Nghỉ Trưa */}
                <tr className={styles.lunchRow}>
                  <td colSpan={8} className={styles.lunchRowContent}>
                    <span className="material-symbols-outlined text-[16px]">restaurant</span>
                    <span>NGHỈ TRƯA & ĂN BÁN TRÚ (11:40 - 13:30)</span>
                  </td>
                </tr>

                {/* Session Chiều */}
                <tr className={styles.sessionHeaderRow}>
                  <td colSpan={8} className="py-2 px-4">
                    <div className={styles.sessionHeaderCell}>
                      <div className={styles.sessionHeaderLeft}>
                        <span className="material-symbols-outlined text-sm text-orange-500">light_mode</span>
                        <span className="text-orange-600">BUỔI CHIỀU (13:30 - 16:30) • TIẾT HỌC THÊM</span>
                      </div>
                    </div>
                  </td>
                </tr>

                {[5, 6].map(index => (
                  <tr className={styles.timeRow} key={`afternoon-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index - 4} Chiều</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}

                {/* Giờ ra chơi chiều */}
                <tr className="bg-orange-50/50 border-y-2 border-orange-200">
                  <td colSpan={8} className={styles.breakRowContent}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-500 text-base">emoji_food_beverage</span>
                      <span className="font-bold text-orange-700">Giờ ra chơi Buổi Chiều (15:05 - 15:25)</span>
                    </div>
                  </td>
                </tr>

                {[7].map(index => (
                  <tr className={styles.timeRow} key={`afternoon-${index}`}>
                    <td className={styles.timeCell}>
                      <div className={styles.timeCellTitle}>Tiết {index - 4} Chiều</div>
                    </td>
                    {[2, 3, 4, 5, 6, 7, 8].map(day => getSubjectCard(day, index))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Legend */}
          <div className="p-3 bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-on-surface">Chú thích môn học:</span>
              <div className="flex items-center gap-3 flex-wrap">
                {(() => {
                  const uniqueSubjects = Array.from(new Set(slots.map(s => s.subjectName).filter(Boolean))) as string[];
                  
                  const getSubjectColorClass = (name: string) => {
                    const lower = name.toLowerCase();
                    if (lower.includes('toán')) return 'bg-blue-500';
                    if (lower.includes('văn')) return 'bg-purple-500';
                    if (lower.includes('anh')) return 'bg-emerald-500';
                    if (lower.includes('lý')) return 'bg-teal-500';
                    if (lower.includes('hóa')) return 'bg-orange-500';
                    if (lower.includes('sử') || lower.includes('địa')) return 'bg-amber-500';
                    if (lower.includes('sinh')) return 'bg-green-500';
                    if (lower.includes('công dân') || lower.includes('gdcd')) return 'bg-pink-500';
                    return 'bg-gray-400';
                  };

                  return uniqueSubjects.length > 0 ? (
                    uniqueSubjects.map(subject => (
                      <span key={subject} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${getSubjectColorClass(subject)}`}></div> 
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">Chưa có môn học nào</span>
                  );
                })()}
              </div>
            </div>
            <button 
              className="text-primary font-semibold flex items-center gap-1 hover:underline whitespace-nowrap ml-auto"
              onClick={() => alert('Tính năng tùy chỉnh màu sắc cho từng môn học đang được phát triển. AI Tutor sẽ sớm ra mắt tính năng này!')}
            >
              <span className="material-symbols-outlined text-[14px]">tune</span> Tùy chỉnh mã màu
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
    </div>
  );
};

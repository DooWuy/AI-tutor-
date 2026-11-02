import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ScheduleSlotDto } from '../../types/schedule';
import { getActiveSchedule } from '../../services/scheduleApi';
import { isAcademicSlot, formatSubjectName } from '../../utils/timetableUtils';

interface UpcomingClassBannerProps {
  slots?: ScheduleSlotDto[];
  className?: string;
}

export const UpcomingClassBanner: React.FC<UpcomingClassBannerProps> = ({
  slots: propSlots,
  className = '',
}) => {
  const [fetchedSlots, setFetchedSlots] = useState<ScheduleSlotDto[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Fetch slots if not provided via props (e.g. on Dashboard)
  useEffect(() => {
    if (propSlots !== undefined) return;
    let mounted = true;
    getActiveSchedule()
      .then((res) => {
        if (mounted && res && Array.isArray(res.slots)) {
          setFetchedSlots(res.slots);
        }
      })
      .catch(() => {
        if (mounted) setFetchedSlots([]);
      });
    return () => {
      mounted = false;
    };
  }, [propSlots]);

  // Real-time ticker: update every 5 seconds for smooth countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const allSlots = propSlots !== undefined ? propSlots : fetchedSlots || [];

  const classStatus = useMemo(() => {
    if (!allSlots || allSlots.length === 0) return null;

    const realDayOfWeek = now.getDay() === 0 ? 8 : now.getDay() + 1; // 2-8
    const todaySlots = allSlots
      .filter((s) => isAcademicSlot(s) && s.dayOfWeek === realDayOfWeek && s.startTime)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    if (todaySlots.length === 0) return null;

    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    // 1. Check for imminent upcoming class (starts in <= 15 minutes, startSec >= nowSec)
    for (const slot of todaySlots) {
      const parts = (slot.startTime || '00:00').split(':').map(Number);
      const startSec = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
      const diffSec = startSec - nowSec;

      if (diffSec >= 0 && diffSec <= 15 * 60) {
        const minutes = Math.floor(diffSec / 60);
        const seconds = diffSec % 60;
        return {
          type: 'IMMINENT' as const,
          slot,
          minutes,
          seconds,
          startFormatted: slot.startTime.substring(0, 5),
        };
      }
    }

    // 2. Check for currently ongoing class (startSec <= nowSec < endSec)
    for (const slot of todaySlots) {
      if (!slot.endTime) continue;
      const startParts = (slot.startTime || '00:00').split(':').map(Number);
      const startSec = (startParts[0] || 0) * 3600 + (startParts[1] || 0) * 60;
      const endParts = slot.endTime.split(':').map(Number);
      const endSec = (endParts[0] || 0) * 3600 + (endParts[1] || 0) * 60;

      if (nowSec >= startSec && nowSec < endSec) {
        const remainingMinutes = Math.floor((endSec - nowSec) / 60);
        return {
          type: 'ONGOING' as const,
          slot,
          remainingMinutes,
          startFormatted: slot.startTime.substring(0, 5),
          endFormatted: slot.endTime.substring(0, 5),
        };
      }
    }

    return null;
  }, [allSlots, now]);

  if (!classStatus) return null;

  if (classStatus.type === 'IMMINENT') {
    const { slot, minutes, seconds, startFormatted } = classStatus;
    const countdownText =
      minutes === 0 ? `${seconds} giây nữa` : `${minutes} phút ${seconds > 0 ? `${seconds}s` : ''}`;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`relative overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-surface-container to-amber-500/10 p-4 text-on-surface shadow-md ring-2 ring-amber-500/20 animate-pulse-subtle ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce-subtle">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                alarm
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Tiết học sắp diễn ra (còn {countdownText})
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  Bắt đầu lúc <strong className="text-on-surface font-bold">{startFormatted}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-on-surface mt-1 flex items-center gap-2 flex-wrap">
                <span>{formatSubjectName(slot.subjectName)}</span>
                {slot.room && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/60">
                    Phòng: {slot.room}
                  </span>
                )}
                {slot.teacherName && (
                  <span className="text-xs text-on-surface-variant font-normal">
                    • GV: {slot.teacherName}
                  </span>
                )}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Hãy chuẩn bị sách vở và vào lớp đúng giờ nhé!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <Link
              to="/student/timetable"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              <span>Xem thời khóa biểu</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ONGOING
  const { slot, remainingMinutes, startFormatted, endFormatted } = classStatus;
  return (
    <div
      role="region"
      aria-label="Tiết học đang diễn ra"
      className={`relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-surface-container to-emerald-500/5 p-4 text-on-surface shadow-xs ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang trong tiết học
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {startFormatted} - {endFormatted} (còn ~{remainingMinutes} phút)
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface mt-1 flex items-center gap-2 flex-wrap">
              <span>{formatSubjectName(slot.subjectName)}</span>
              {slot.room && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-outline-variant/60">
                  Phòng: {slot.room}
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <Link
            to="/student/timetable"
            className="px-3.5 py-2 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface text-xs font-semibold rounded-xl border border-outline-variant transition active:scale-95"
          >
            Xem TKB
          </Link>
        </div>
      </div>
    </div>
  );
};


import type { ScheduleSlotDto } from '../types/schedule';

/**
 * Chuẩn hóa và làm gọn tên môn học:
 * Tự động loại bỏ các tiền tố phụ như "T.cường", "T. cường", "Tăng cường", "TC", "Phụ đạo", "Bồi dưỡng"...
 * để hiển thị gọn gàng, đẹp mắt:
 * VD: "T.cường Tiếng Việt" -> "Tiếng Việt", "T.cường Toán" -> "Toán", "Tăng cường Toán" -> "Toán".
 */
export const formatSubjectName = (name?: string | null, simplify = true): string => {
  if (!name) return '';
  const trimmed = name.trim();
  if (!simplify) return trimmed;

  // Lược bỏ các tiền tố / hậu tố như "T.cường", "T. cường", "Tăng cường", "TC", "Phụ đạo", "Bồi dưỡng"...
  // VD: "T.cường Tiếng Việt" -> "Tiếng Việt", "T.cường Toán" -> "Toán", "Toán (T.cường)" -> "Toán"
  const cleaned = trimmed
    .replace(/^(?:môn\s+)?(?:\(?\s*(?:T\.?\s*cường|Tăng\s*cường|TC\.?|T\.C\.?|Phụ\s*đạo|Bồi\s*dưỡng)\s*\)?)\s*[\-_:]*\s*/i, '')
    .replace(/\s*[\-_:]*\s*(?:\(?\s*(?:T\.?\s*cường|Tăng\s*cường|TC\.?|T\.C\.?|Phụ\s*đạo|Bồi\s*dưỡng)\s*\)?)$/i, '')
    .trim();

  if (cleaned.length > 0) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return trimmed;
};

/**
 * Kiểm tra xem một slot có phải là môn học chính khóa không.
 * Bỏ qua các hoạt động sinh hoạt phụ như "Truy bài đầu giờ", "15 phút đầu giờ"
 * để tránh làm dồn hoặc che khuất môn học trong bảng TKB và checklist.
 */
export const isAcademicSlot = (slot?: ScheduleSlotDto | null): boolean => {
  if (!slot || !slot.subjectName) return false;
  const name = slot.subjectName.trim().toLowerCase();
  if (name.includes('truy bài')) return false;
  if (name.includes('15 phút đầu giờ') || name.includes('sinh hoạt đầu giờ')) return false;
  return true;
};

/**
 * Chuyển đổi chuỗi thời gian (HH:mm:ss hoặc HH:mm) thành số phút từ đầu ngày.
 */
export const timeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

/**
 * Ánh xạ thời gian bắt đầu của tiết học vào chỉ số hàng (0 - 7):
 * - Buổi Sáng:
 *   + Tiết 1 (index 0): Trước 07:35 (VD: 07:00, 07:15)
 *   + Tiết 2 (index 1): 07:35 - trước 08:35 (VD: Tiểu học 07:40, THCS/THPT 07:50, 08:00)
 *   + Tiết 3 (index 2): 08:35 - trước 09:25 (VD: 08:50, 09:00)
 *   + Tiết 4 (index 3): 09:25 - trước 10:15 (VD: Tiểu học 09:30, THCS/THPT 09:40)
 *   + Tiết 5 (index 4): 10:15 - trước 12:30 (VD: 10:15, 10:30)
 * - Buổi Chiều:
 *   + Tiết 1 Chiều (index 5): 12:30 - trước 14:20 (VD: 13:30, 14:00)
 *   + Tiết 2 Chiều (index 6): 14:20 - trước 15:15 (VD: 14:20, 14:40)
 *   + Tiết 3 Chiều (index 7): Từ 15:15 trở đi (VD: 15:15, 15:25, 15:30)
 */
export const getPeriodIndexFromTime = (timeStr?: string): number => {
  const totalMinutes = timeToMinutes(timeStr);

  // Buổi Sáng
  if (totalMinutes < 7 * 60 + 35) return 0; // Tiết 1
  if (totalMinutes < 8 * 60 + 35) return 1; // Tiết 2
  if (totalMinutes < 9 * 60 + 25) return 2; // Tiết 3
  if (totalMinutes < 10 * 60 + 15) return 3; // Tiết 4
  if (totalMinutes < 12 * 60 + 30) return 4; // Tiết 5

  // Buổi Chiều
  if (totalMinutes < 14 * 60 + 20) return 5; // Tiết 1 Chiều
  if (totalMinutes < 15 * 60 + 15) return 6; // Tiết 2 Chiều
  return 7; // Tiết 3 Chiều
};

/**
 * Lấy chỉ số hàng (0 - 7) cho một slot thời khóa biểu.
 * Tự động ưu tiên so khớp khoảng cách thời gian gần nhất với khung giờ chuẩn đã cấu hình của học sinh.
 */
export const getSlotIndex = (
  slot: ScheduleSlotDto,
  periods?: { startTime: string; endTime: string }[]
): number => {
  if (periods && periods.length > 0 && slot.startTime) {
    const slotMin = timeToMinutes(slot.startTime);
    let bestIdx = -1;
    let minDiff = Infinity;

    for (let i = 0; i < periods.length; i++) {
      const pStart = timeToMinutes(periods[i].startTime);
      const diff = Math.abs(slotMin - pStart);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = i;
      }
    }
    // Nếu khoảng cách chênh lệch không quá 60 phút, map chính xác vào tiết đó
    if (bestIdx !== -1 && minDiff <= 60) {
      return bestIdx;
    }
  }
  return getPeriodIndexFromTime(slot.startTime);
};

export type SchoolLevel = 'PRIMARY' | 'SECONDARY' | 'HIGH';

export interface TimetableConfig {
  schoolLevel: SchoolLevel;
  levelName: string;
  // Sáng
  morningPeriodsCount: number; // 4 hoặc 5
  morningStartTime: string; // HH:mm
  morningPeriodDuration: number; // phút (35, 40, 45, 50)
  morningBreakAfterPeriod: number; // 2 hoặc 3
  morningBreakDuration: number; // phút (15, 20, 25, 30)
  morningShortBreak: number; // phút (0 hoặc 5)
  morningActivityName: string;

  // Chiều
  afternoonEnabled: boolean;
  afternoonPeriodsCount: number; // 2, 3, 4
  afternoonStartTime: string; // HH:mm
  afternoonPeriodDuration: number; // phút
  afternoonBreakAfterPeriod: number;
  afternoonBreakDuration: number;
  afternoonShortBreak: number;
}

export const LEVEL_PRESETS: Record<SchoolLevel, TimetableConfig> = {
  PRIMARY: {
    schoolLevel: 'PRIMARY',
    levelName: 'Tiểu học (Cấp 1)',
    morningPeriodsCount: 5,
    morningStartTime: '07:00',
    morningPeriodDuration: 40,
    morningBreakAfterPeriod: 2,
    morningBreakDuration: 30,
    morningShortBreak: 0,
    morningActivityName: 'Thể dục & Ăn nhẹ',
    afternoonEnabled: true,
    afternoonPeriodsCount: 3,
    afternoonStartTime: '14:00',
    afternoonPeriodDuration: 40,
    afternoonBreakAfterPeriod: 2,
    afternoonBreakDuration: 15,
    afternoonShortBreak: 0,
  },
  SECONDARY: {
    schoolLevel: 'SECONDARY',
    levelName: 'THCS (Cấp 2)',
    morningPeriodsCount: 5,
    morningStartTime: '07:15',
    morningPeriodDuration: 45,
    morningBreakAfterPeriod: 2,
    morningBreakDuration: 20,
    morningShortBreak: 5,
    morningActivityName: 'Thể dục giữa giờ',
    afternoonEnabled: true,
    afternoonPeriodsCount: 3,
    afternoonStartTime: '13:30',
    afternoonPeriodDuration: 45,
    afternoonBreakAfterPeriod: 2,
    afternoonBreakDuration: 20,
    afternoonShortBreak: 5,
  },
  HIGH: {
    schoolLevel: 'HIGH',
    levelName: 'THPT (Cấp 3)',
    morningPeriodsCount: 5,
    morningStartTime: '07:00',
    morningPeriodDuration: 45,
    morningBreakAfterPeriod: 2,
    morningBreakDuration: 20,
    morningShortBreak: 5,
    morningActivityName: 'Thể dục & Giải lao',
    afternoonEnabled: true,
    afternoonPeriodsCount: 3,
    afternoonStartTime: '13:30',
    afternoonPeriodDuration: 45,
    afternoonBreakAfterPeriod: 2,
    afternoonBreakDuration: 20,
    afternoonShortBreak: 5,
  },
};

/**
 * Nhận diện cấp học từ lớp hoặc tên trường của học sinh
 */
export const detectSchoolLevel = (gradeLevel?: string | null, className?: string | null): SchoolLevel => {
  const combined = `${gradeLevel || ''} ${className || ''}`.toLowerCase();
  
  const match = combined.match(/(?:lớp\s*|khối\s*|^|\b)([1-9]|1[0-2])\b/);
  if (match) {
    const gradeNum = parseInt(match[1], 10);
    if (gradeNum >= 1 && gradeNum <= 5) return 'PRIMARY';
    if (gradeNum >= 6 && gradeNum <= 9) return 'SECONDARY';
    if (gradeNum >= 10 && gradeNum <= 12) return 'HIGH';
  }

  if (combined.includes('tiểu học') || combined.includes('cấp 1')) return 'PRIMARY';
  if (combined.includes('thcs') || combined.includes('cấp 2')) return 'SECONDARY';
  if (combined.includes('thpt') || combined.includes('cấp 3') || combined.includes('phổ thông')) return 'HIGH';

  return 'PRIMARY';
};

/**
 * Chuyển số phút từ đầu ngày thành chuỗi HH:mm:ss
 */
export const minutesToTimeStr = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
};

/**
 * Chuyển số phút từ đầu ngày thành chuỗi HH:mm
 */
export const minutesToShortTimeStr = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Tự động tạo danh sách defaultPeriods ({ startTime, endTime }) từ cấu hình TKB
 */
export const generatePeriodsFromConfig = (config: TimetableConfig): { startTime: string; endTime: string }[] => {
  const result: { startTime: string; endTime: string }[] = [];

  // 1. Buổi Sáng
  let currentMin = timeToMinutes(config.morningStartTime || '07:00');
  for (let i = 1; i <= (config.morningPeriodsCount || 5); i++) {
    const startStr = minutesToTimeStr(currentMin);
    currentMin += (config.morningPeriodDuration || 45);
    const endStr = minutesToTimeStr(currentMin);
    result.push({ startTime: startStr, endTime: endStr });

    if (i === config.morningBreakAfterPeriod && i < config.morningPeriodsCount) {
      currentMin += (config.morningBreakDuration || 20);
    } else if (i < config.morningPeriodsCount) {
      currentMin += (config.morningShortBreak || 0);
    }
  }

  // 2. Buổi Chiều (nếu bật ca chiều)
  if (config.afternoonEnabled) {
    let aftMin = timeToMinutes(config.afternoonStartTime || '13:30');
    for (let i = 1; i <= (config.afternoonPeriodsCount || 3); i++) {
      const startStr = minutesToTimeStr(aftMin);
      aftMin += (config.afternoonPeriodDuration || config.morningPeriodDuration || 45);
      const endStr = minutesToTimeStr(aftMin);
      result.push({ startTime: startStr, endTime: endStr });

      if (i === config.afternoonBreakAfterPeriod && i < config.afternoonPeriodsCount) {
        aftMin += (config.afternoonBreakDuration || 20);
      } else if (i < config.afternoonPeriodsCount) {
        aftMin += (config.afternoonShortBreak || 0);
      }
    }
  }

  return result;
};

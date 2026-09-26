export interface ScheduleSlotDto {
  id?: string;
  dayOfWeek: number; // 2-8
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string; // HH:mm:ss or HH:mm
  subjectName: string;
  teacherName?: string;
  room?: string;
  scheduleType?: string;
}

export interface ScheduleCreateRequest {
  name?: string;
  slots: ScheduleSlotDto[];
}

export interface ScheduleResponse {
  id: string;
  name: string;
  isActive: boolean;
  slots: ScheduleSlotDto[];
}

export interface OcrExtractionResponse {
  status: string;
  data: ScheduleSlotDto[];
}

import { useState, useEffect, useCallback } from 'react';
import type { ScheduleSlotDto } from '../../../../types/schedule';
import { getActiveSchedule, createSchedule, deleteScheduleSlot, updateScheduleSlot, addScheduleSlot } from '../../../../services/scheduleApi';
import { getMyStudentProfile } from '../../../../services/studentProfileApi';

export const DEFAULT_PERIODS_FALLBACK = [
  { startTime: '07:00:00', endTime: '07:45:00' },
  { startTime: '07:50:00', endTime: '08:35:00' },
  { startTime: '08:50:00', endTime: '09:35:00' },
  { startTime: '09:40:00', endTime: '10:25:00' },
  { startTime: '10:30:00', endTime: '11:15:00' },
  { startTime: '13:30:00', endTime: '14:15:00' },
  { startTime: '14:20:00', endTime: '15:05:00' },
  { startTime: '15:25:00', endTime: '16:10:00' },
];

export const useTimetable = () => {
  const [slots, setSlots] = useState<ScheduleSlotDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [defaultPeriods, setDefaultPeriods] = useState(DEFAULT_PERIODS_FALLBACK);
  const [currentPreferences, setCurrentPreferences] = useState<Record<string, unknown>>({});
  
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlotDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, scheduleRes] = await Promise.all([
        getMyStudentProfile().catch(() => null),
        getActiveSchedule().catch(() => ({ slots: [] }))
      ]);

      if (profileRes && profileRes.studyPreferences) {
        setCurrentPreferences(profileRes.studyPreferences);
        if (profileRes.studyPreferences.timetable_default_periods) {
          setDefaultPeriods(profileRes.studyPreferences.timetable_default_periods as any);
        }
      }
      
      setSlots(scheduleRes.slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveSchedule = useCallback(async () => {
    try {
      const res = await getActiveSchedule();
      setSlots(res.slots || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSchedule = async (newSlots: ScheduleSlotDto[] = slots) => {
    try {
      setIsLoading(true);
      await createSchedule({ name: 'Thời khóa biểu AI', slots: newSlots });
      alert('Đã lưu TKB thành công!');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId?: string) => {
    if (!slotId) return;
    if (!window.confirm('Bạn có chắc muốn xóa tiết học này? Việc này đồng thời sẽ hủy các nhắc nhở liên quan.')) return;
    
    try {
      setIsLoading(true);
      await deleteScheduleSlot(slotId);
      alert('Đã xóa tiết học thành công.');
      setIsEditModalOpen(false);
      await loadActiveSchedule();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa tiết học');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    try {
      setIsLoading(true);
      if (selectedSlot.id) {
        await updateScheduleSlot(selectedSlot.id, selectedSlot);
        alert('Đã cập nhật tiết học thành công.');
      } else {
        await addScheduleSlot(selectedSlot);
        alert('Đã thêm tiết học thành công.');
      }
      setIsEditModalOpen(false);
      await loadActiveSchedule();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu tiết học');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSlot = (day: number, index: number) => {
    setSelectedSlot({
      dayOfWeek: day,
      startTime: defaultPeriods[index]?.startTime || '00:00:00',
      endTime: defaultPeriods[index]?.endTime || '00:00:00',
      subjectName: '',
    });
    setIsEditModalOpen(true);
  };

  const handleSlotClick = (slot: ScheduleSlotDto) => {
    if (!slot.id) return;
    setSelectedSlot(slot);
    setIsEditModalOpen(true);
  };

  // Drag and drop logic
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sourceDay: number, sourceIndex: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ sourceDay, sourceIndex }));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetDay: number, targetIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    const { sourceDay, sourceIndex } = JSON.parse(data);
    if (sourceDay === targetDay && sourceIndex === targetIndex) return;

    setSlots(prevSlots => {
      const newSlots = [...prevSlots];
      
      const sourceDaySlots = newSlots.filter(s => s.dayOfWeek === sourceDay).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      const targetDaySlots = newSlots.filter(s => s.dayOfWeek === targetDay).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      
      const sourceSlot = sourceDaySlots[sourceIndex];
      const targetSlot = targetDaySlots[targetIndex];

      if (!sourceSlot) return prevSlots;

      if (targetSlot) {
        // Swap slots
        const tempDay = sourceSlot.dayOfWeek;
        const tempStart = sourceSlot.startTime;
        const tempEnd = sourceSlot.endTime;

        sourceSlot.dayOfWeek = targetSlot.dayOfWeek;
        sourceSlot.startTime = targetSlot.startTime;
        sourceSlot.endTime = targetSlot.endTime;

        targetSlot.dayOfWeek = tempDay;
        targetSlot.startTime = tempStart;
        targetSlot.endTime = tempEnd;
      } else {
        // Move to an empty slot
        sourceSlot.dayOfWeek = targetDay;
        sourceSlot.startTime = defaultPeriods[targetIndex]?.startTime || '00:00:00';
        sourceSlot.endTime = defaultPeriods[targetIndex]?.endTime || '00:00:00';
      }
      return newSlots;
    });
  };

  return {
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
    handleDrop
  };
};

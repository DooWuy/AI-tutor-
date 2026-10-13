import { useState, useEffect, useCallback } from 'react';
import type { ScheduleSlotDto } from '../../../../types/schedule';
import { getActiveSchedule, createSchedule, deleteScheduleSlot, updateScheduleSlot, addScheduleSlot } from '../../../../services/scheduleApi';
import { getMyStudentProfile, updateMyStudentProfile } from '../../../../services/studentProfileApi';
import { useAlert } from '../../../../context/AlertContext';
import type { AlertModalConfig } from '../components/AlertModal';
import { isAcademicSlot, getSlotIndex, formatSubjectName, generatePeriodsFromConfig } from '../../../../utils/timetableUtils';
import { SUBJECT_COLORS_STORAGE_KEY } from '../../../../utils/subjectColorUtils';

export const DEFAULT_PERIODS_FALLBACK = [
  { startTime: '07:00:00', endTime: '07:45:00' },
  { startTime: '07:50:00', endTime: '08:35:00' },
  { startTime: '08:50:00', endTime: '09:35:00' },
  { startTime: '09:40:00', endTime: '10:25:00' },
  { startTime: '10:30:00', endTime: '11:15:00' },
  { startTime: '14:00:00', endTime: '14:45:00' },
  { startTime: '14:50:00', endTime: '15:35:00' },
  { startTime: '15:50:00', endTime: '16:35:00' },
];

export const useTimetable = (customShowAlert?: (config: Omit<AlertModalConfig, 'isOpen'>) => void) => {
  const { showAlert: contextShowAlert } = useAlert();
  const showAlert = customShowAlert || contextShowAlert;
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
        let prefs = { ...profileRes.studyPreferences };
        if (!prefs.timetable_subject_colors && typeof window !== 'undefined') {
          const cached = localStorage.getItem(SUBJECT_COLORS_STORAGE_KEY);
          if (cached) {
            try {
              prefs.timetable_subject_colors = JSON.parse(cached);
            } catch (e) {
              console.error(e);
            }
          }
        } else if (prefs.timetable_subject_colors && typeof window !== 'undefined') {
          try {
            localStorage.setItem(SUBJECT_COLORS_STORAGE_KEY, JSON.stringify(prefs.timetable_subject_colors));
          } catch (e) {
            console.error(e);
          }
        }
        setCurrentPreferences(prefs);
        if (profileRes.studyPreferences.timetable_config) {
          try {
            const generated = generatePeriodsFromConfig(profileRes.studyPreferences.timetable_config as any);
            setDefaultPeriods(generated);
          } catch (e) {
            if (profileRes.studyPreferences.timetable_default_periods) {
              setDefaultPeriods(profileRes.studyPreferences.timetable_default_periods as any);
            }
          }
        } else if (profileRes.studyPreferences.timetable_default_periods) {
          setDefaultPeriods(profileRes.studyPreferences.timetable_default_periods as any);
        }
      }

      const rawSlots = scheduleRes.slots || [];
      setSlots(rawSlots.filter(isAcademicSlot).map(s => ({
        ...s,
        subjectName: formatSubjectName(s.subjectName, true)
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveSchedule = useCallback(async () => {
    try {
      const res = await getActiveSchedule();
      const rawSlots = res.slots || [];
      setSlots(rawSlots.filter(isAcademicSlot).map(s => ({
        ...s,
        subjectName: formatSubjectName(s.subjectName, true)
      })));
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
      const cleanSlots = newSlots
        .filter(isAcademicSlot)
        .map(s => ({
          ...s,
          subjectName: formatSubjectName(s.subjectName, true)
        }));
      await createSchedule({ name: 'Thời khóa biểu AI', slots: cleanSlots });
      await loadActiveSchedule();
      showAlert({
        type: 'success',
        category: 'SUCCESS ALERT',
        title: 'Lưu thay đổi thành công!',
        description: 'Tất cả dữ liệu thời khóa biểu của bạn đã được đồng bộ an toàn lên Cloud Server.',
        confirmText: 'Tuyệt vời',
      });
    } catch (err: any) {
      showAlert({
        type: 'error',
        category: 'SYSTEM ERROR',
        title: 'Lỗi khi lưu thời khóa biểu',
        description: err.message || 'Không thể lưu thời khóa biểu. Vui lòng kiểm tra lại đường truyền internet.',
        confirmText: 'Đóng',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId?: string) => {
    if (!slotId) return;

    const doDelete = async () => {
      try {
        setIsLoading(true);
        await deleteScheduleSlot(slotId);
        showAlert({
          type: 'success',
          category: 'SUCCESS ALERT',
          title: 'Xóa tiết học thành công!',
          description: 'Tiết học và các nhắc nhở liên quan đã được xóa khỏi hệ thống.',
          confirmText: 'Tuyệt vời',
        });
        setIsEditModalOpen(false);
        await loadActiveSchedule();
      } catch (err: any) {
        showAlert({
          type: 'error',
          category: 'SYSTEM ERROR',
          title: 'Lỗi khi xóa tiết học',
          description: err.message || 'Không thể xóa tiết học. Vui lòng thử lại sau.',
          confirmText: 'Đóng',
        });
      } finally {
        setIsLoading(false);
      }
    };

    showAlert({
      type: 'warning',
      category: 'CONFIRM PROMPT',
      title: 'Xác nhận xóa tiết học?',
      description: 'Hệ thống nhận thấy bạn đang yêu cầu xóa tiết học này. Việc này đồng thời sẽ hủy các nhắc nhở bài học liên quan.',
      confirmText: 'Xóa luôn',
      cancelText: 'Làm tiếp',
      onConfirm: doDelete,
    });
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      setIsLoading(true);
      const slotToSave: ScheduleSlotDto = {
        ...selectedSlot,
        subjectName: formatSubjectName(selectedSlot.subjectName, true)
      };
      if (slotToSave.id) {
        await updateScheduleSlot(slotToSave.id, slotToSave);
        showAlert({
          type: 'success',
          category: 'SUCCESS ALERT',
          title: 'Cập nhật tiết học thành công!',
          description: 'Thông tin tiết học đã được cập nhật an toàn vào thời khóa biểu.',
          confirmText: 'Tuyệt vời',
        });
      } else {
        await addScheduleSlot(slotToSave);
        showAlert({
          type: 'success',
          category: 'SUCCESS ALERT',
          title: 'Thêm tiết học thành công!',
          description: 'Tiết học mới đã được bổ sung thành công vào thời khóa biểu.',
          confirmText: 'Tuyệt vời',
        });
      }
      setIsEditModalOpen(false);
      await loadActiveSchedule();
    } catch (err: any) {
      showAlert({
        type: 'error',
        category: 'SYSTEM ERROR',
        title: 'Lỗi khi lưu tiết học',
        description: err.message || 'Không thể lưu tiết học. Vui lòng kiểm tra lại dữ liệu.',
        confirmText: 'Đóng',
      });
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
    setSelectedSlot({
      ...slot,
      subjectName: formatSubjectName(slot.subjectName, true)
    });
    setIsEditModalOpen(true);
  };

  // Drag and drop logic
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sourceDay: number, sourceIndex: number, slotId?: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ sourceDay, sourceIndex, slotId }));
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

    const { sourceDay, sourceIndex, slotId } = JSON.parse(data);
    if (sourceDay === targetDay && sourceIndex === targetIndex) return;

    setSlots(prevSlots => {
      const newSlots = [...prevSlots];

      const sourceSlot = slotId
        ? newSlots.find(s => s.id === slotId)
        : newSlots.find(s => s.dayOfWeek === sourceDay);

      if (!sourceSlot) return prevSlots;

      // Find target slot at the target period if any
      const targetSlot = newSlots.find(s => {
        return s.dayOfWeek === targetDay && getSlotIndex(s, defaultPeriods) === targetIndex;
      });

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

  const handleSaveSubjectColors = async (newColors: Record<string, string>) => {
    try {
      setIsLoading(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(SUBJECT_COLORS_STORAGE_KEY, JSON.stringify(newColors));
      }
      const updatedPrefs = {
        ...currentPreferences,
        timetable_subject_colors: newColors,
      };
      await updateMyStudentProfile({ studyPreferences: updatedPrefs });
      setCurrentPreferences(updatedPrefs);
      showAlert({
        type: 'success',
        category: 'SUCCESS ALERT',
        title: 'Cập nhật bảng mã màu thành công!',
        description: 'Màu sắc môn học đã được lưu và đồng bộ an toàn lên hệ thống.',
        confirmText: 'Tuyệt vời',
      });
    } catch (err: any) {
      showAlert({
        type: 'error',
        category: 'SYSTEM ERROR',
        title: 'Lỗi khi lưu bảng mã màu',
        description: err.message || 'Không thể lưu cấu hình màu sắc lên máy chủ. Đã lưu tạm thời trên trình duyệt của bạn.',
        confirmText: 'Đóng',
      });
    } finally {
      setIsLoading(false);
    }
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
    handleDrop,
    handleSaveSubjectColors
  };
};

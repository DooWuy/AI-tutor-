import React from 'react';
import type { ScheduleSlotDto } from '../../../../types/schedule';

interface TimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: ScheduleSlotDto | null;
  setSelectedSlot: (slot: ScheduleSlotDto) => void;
  handleSaveSlot: (e: React.FormEvent) => Promise<void>;
  handleDeleteSlot: (slotId?: string) => Promise<void>;
  isLoading: boolean;
}

export const TimetableSlotModal: React.FC<TimetableSlotModalProps> = ({
  isOpen,
  onClose,
  selectedSlot,
  setSelectedSlot,
  handleSaveSlot,
  handleDeleteSlot,
  isLoading
}) => {
  if (!isOpen || !selectedSlot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl w-[450px] max-w-full overflow-hidden shadow-2xl flex flex-col transform transition-all">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-primary-fixed">
          <h2 className="text-lg font-bold text-on-primary-fixed flex items-center gap-2">
            <span className="material-symbols-outlined">
              {selectedSlot.id ? 'edit_square' : 'add_box'}
            </span>
            {selectedSlot.id ? 'Chi tiết tiết học' : 'Thêm tiết học mới'}
          </h2>
          <button onClick={onClose} className="text-on-primary-fixed/80 hover:text-on-primary-fixed">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSaveSlot} className="flex flex-col">
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Môn học</label>
              <input 
                type="text" 
                value={selectedSlot.subjectName || ''}
                onChange={(e) => setSelectedSlot({...selectedSlot, subjectName: e.target.value})}
                className="w-full px-3 py-2 border border-outline rounded-xl bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Thời gian bắt đầu</label>
                <input 
                  type="time" 
                  value={selectedSlot.startTime ? selectedSlot.startTime.substring(0, 5) : ''}
                  onChange={(e) => setSelectedSlot({...selectedSlot, startTime: e.target.value + ":00"})}
                  className="w-full px-3 py-2 border border-outline rounded-xl bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Thời gian kết thúc</label>
                <input 
                  type="time" 
                  value={selectedSlot.endTime ? selectedSlot.endTime.substring(0, 5) : ''}
                  onChange={(e) => setSelectedSlot({...selectedSlot, endTime: e.target.value + ":00"})}
                  className="w-full px-3 py-2 border border-outline rounded-xl bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Thứ</label>
                <select 
                  value={selectedSlot.dayOfWeek}
                  onChange={(e) => setSelectedSlot({...selectedSlot, dayOfWeek: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-outline rounded-xl bg-surface focus:border-primary outline-none transition"
                >
                  <option value={2}>Thứ Hai</option>
                  <option value={3}>Thứ Ba</option>
                  <option value={4}>Thứ Tư</option>
                  <option value={5}>Thứ Năm</option>
                  <option value={6}>Thứ Sáu</option>
                  <option value={7}>Thứ Bảy</option>
                  <option value={8}>Chủ Nhật</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">Phòng học (Tùy chọn)</label>
                <input 
                  type="text" 
                  value={selectedSlot.room || ''}
                  onChange={(e) => setSelectedSlot({...selectedSlot, room: e.target.value})}
                  className="w-full px-3 py-2 border border-outline rounded-xl bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Giáo viên (Tùy chọn)</label>
              <input 
                type="text" 
                value={selectedSlot.teacherName || ''}
                onChange={(e) => setSelectedSlot({...selectedSlot, teacherName: e.target.value})}
                className="w-full px-3 py-2 border border-outline rounded-xl bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
            {selectedSlot.id ? (
              <button 
                type="button"
                onClick={() => handleDeleteSlot(selectedSlot.id)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-semibold text-error hover:bg-error/10 rounded-lg flex items-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Xóa lịch
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-variant rounded-lg transition"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-sm font-semibold text-on-primary bg-primary rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                {isLoading ? 'Đang lưu...' : (selectedSlot.id ? 'Lưu cập nhật' : 'Thêm mới')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

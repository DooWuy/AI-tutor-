import React, { useState, useEffect } from 'react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: string) => void;
}

const COMMON_SUBJECTS = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn', 'Lịch sử', 'Địa lý'];

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [subject, setSubject] = useState('Toán học');

  useEffect(() => {
    if (isOpen) {
      setSubject('Toán học');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onSubmit(subject.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-session-title"
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant/60 animate-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0 ring-1 ring-primary/20">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                add_comment
              </span>
            </div>
            <div>
              <h2 id="create-session-title" className="text-base font-bold text-on-surface">
                Tạo Phiên Hỏi Đáp Mới
              </h2>
              <p className="text-[11px] text-outline">
                Chọn môn học hoặc chủ đề để bắt đầu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-xs font-semibold text-on-surface">
              Môn học hoặc chủ đề
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={64}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="VD: Toán học, Vật lý, Ngữ văn..."
              autoFocus
            />

            {/* Quick preset chips */}
            <div className="pt-1.5">
              <span className="text-[11px] font-medium text-secondary block mb-1.5">Gợi ý nhanh:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      subject === sub
                        ? 'bg-primary text-on-primary border-primary shadow-2xs'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border-outline-variant/50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container border border-outline-variant/60 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!subject.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>Bắt đầu ngay</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

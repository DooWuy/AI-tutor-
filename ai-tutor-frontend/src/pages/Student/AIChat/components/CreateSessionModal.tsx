import React, { useState, useEffect } from 'react';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: string) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [subject, setSubject] = useState('Toán học');

  useEffect(() => {
    if (isOpen) {
      setSubject('Toán học');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim()) {
      onSubmit(subject.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">add_comment</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">Tạo Phiên Hỏi Đáp Mới</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-semibold text-on-surface">
              Môn học hoặc chủ đề
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="VD: Toán học, Vật lý, Văn học..."
              autoFocus
            />
          </div>
          
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!subject.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
            >
              Bắt đầu ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

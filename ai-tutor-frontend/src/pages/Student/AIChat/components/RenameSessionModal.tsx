import React, { useState, useEffect } from 'react';
import type { ChatSession } from '../../../../services/chatApi';
import { renameChatSession } from '../../../../services/chatApi';

interface RenameSessionModalProps {
  isOpen: boolean;
  session: ChatSession | null;
  onClose: () => void;
  onSuccess: (updatedSession: ChatSession) => void;
}

export const RenameSessionModal: React.FC<RenameSessionModalProps> = ({
  isOpen,
  session,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      setTitle(session.title || '');
      setErrorMessage(null);
      setIsLoading(false);
    }
  }, [isOpen, session]);

  if (!isOpen || !session) return null;

  const validate = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Tiêu đề không được để trống.';
    }
    if (trimmed.length > 255) {
      return 'Tiêu đề không được vượt quá 255 ký tự.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(title);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const updated = await renameChatSession(session.id, title.trim());
      onSuccess(updated);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi đổi tên. Vui lòng thử lại.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  const trimmedLength = title.trim().length;
  const isOverLimit = trimmedLength > 255;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-lg">edit</span>
            </div>
            <h2 className="text-base font-bold text-on-surface">Đổi tên cuộc trò chuyện</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="session-title" className="block text-xs font-semibold text-on-surface">
                Tiêu đề mới
              </label>
              <span
                className={`text-[11px] ${
                  isOverLimit ? 'text-error font-semibold' : 'text-outline'
                }`}
              >
                {title.length}/255
              </span>
            </div>

            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isLoading}
              maxLength={260}
              className={`w-full px-4 py-2.5 bg-surface-container-low border rounded-xl text-on-surface text-sm focus:outline-none transition-all ${
                errorMessage || isOverLimit
                  ? 'border-error focus:ring-1 focus:ring-error'
                  : 'border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary'
              }`}
              placeholder="Nhập tên phiên trò chuyện..."
              autoFocus
            />

            {errorMessage && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim() || isOverLimit}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isLoading && (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              )}
              <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

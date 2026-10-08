import React, { useState, useEffect, useRef } from 'react';
import type { ChatSession } from '../../../../services/chatApi';
import { deleteChatSession } from '../../../../services/chatApi';

interface DeleteSessionModalProps {
  isOpen: boolean;
  session: ChatSession | null;
  onClose: () => void;
  onSuccess: (deletedSessionId: string) => void;
}

export const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({
  isOpen,
  session,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsLoading(false);
      // Auto-focus the cancel button for safety
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !session) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await deleteChatSession(session.id);
      onSuccess(session.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-session-title"
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant/60 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-error-container/60 flex items-center justify-center text-error shrink-0 ring-1 ring-error/20">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                delete_forever
              </span>
            </div>
            <div className="min-w-0">
              <h2 id="delete-session-title" className="text-base font-bold text-on-surface truncate">
                Xóa cuộc trò chuyện
              </h2>
              <p className="text-[11px] text-outline truncate">
                Môn: {session.subject}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-outline hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Bạn có chắc chắn muốn xóa cuộc trò chuyện{' '}
            <strong className="text-on-surface font-semibold break-words">"{session.title || 'Trò chuyện mới'}"</strong>?
          </p>

          {/* Hard Delete Warning Notice */}
          <div className="p-3.5 rounded-xl bg-error-container/25 border border-error/25 text-xs text-on-surface-variant flex items-start gap-2.5">
            <span className="material-symbols-outlined text-base text-error shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              warning
            </span>
            <div className="space-y-0.5">
              <span className="font-semibold text-error block">Hành động không thể hoàn tác</span>
              <span className="text-on-surface-variant leading-relaxed block">
                Phiên trò chuyện cùng toàn bộ tin nhắn liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-error-container/40 border border-error/30 text-xs text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container border border-outline-variant/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-error text-on-error hover:bg-error/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Xóa vĩnh viễn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

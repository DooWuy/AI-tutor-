import React, { useState } from 'react';
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

  if (!isOpen || !session) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await deleteChatSession(session.id);
      onSuccess(session.id);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa cuộc trò chuyện. Vui lòng thử lại.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-outline-variant/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-lg">delete_forever</span>
            </div>
            <h2 className="text-base font-bold text-on-surface">Xóa cuộc trò chuyện</h2>
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

        <div className="p-6 space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Bạn có chắc chắn muốn xóa cuộc trò chuyện{' '}
            <strong className="text-on-surface font-semibold">"{session.title}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-error-container/30 border border-error/20 text-xs text-error flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">warning</span>
            <span>
              Hành động này không thể hoàn tác. Phiên trò chuyện cùng toàn bộ tin nhắn liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </span>
          </div>

          {errorMessage && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMessage}</span>
            </p>
          )}

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
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-error text-on-error hover:bg-error/90 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isLoading && (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              )}
              <span>{isLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

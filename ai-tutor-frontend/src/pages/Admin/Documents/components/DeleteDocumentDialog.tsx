import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    fileName: string;
  } | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error?: string;
}

export const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  isOpen,
  onClose,
  document,
  onConfirm,
  isDeleting,
  error,
}) => {
  if (!isOpen || !document) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm doc-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-delete-dialog-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl text-on-surface">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <Trash2 size={20} />
            </div>
            <div>
              <h2 id="document-delete-dialog-title" className="text-lg font-bold text-on-surface">
                Xóa tài liệu và vector?
              </h2>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <div className="mt-4 space-y-3 text-xs text-on-surface-variant">
          <p className="leading-relaxed">
            Bạn có chắc chắn muốn xóa tài liệu <strong className="text-on-surface break-words">"{document.title}"</strong> ({document.fileName})?
          </p>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-rose-700 dark:text-rose-300">
            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>Toàn bộ các đoạn vector nhúng (DocumentChunk) sẽ bị xóa và AI Tutor sẽ ngừng truy xuất tài liệu này ngay lập tức.</li>
              <li>Lịch sử hội thoại và trích dẫn trước đây của học sinh vẫn được bảo toàn nguyên vẹn.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-outline-variant">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="min-h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="min-h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Đang xóa…
              </>
            ) : (
              'Xác nhận xóa'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


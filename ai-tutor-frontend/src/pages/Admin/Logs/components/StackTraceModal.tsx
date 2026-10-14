import React, { useState } from 'react';
import { useToast } from '../../../../context/ToastContext';
import type { SystemLogItem } from '../../../../types/systemLogs';

interface StackTraceModalProps {
  log: SystemLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StackTraceModal: React.FC<StackTraceModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopy = async () => {
    const textToCopy = log.stackTrace || log.message;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Đã sao chép stack trace vào clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không thể sao chép vào clipboard.');
    }
  };

  const getLevelBadgeClass = (lvl: string) => {
    switch (lvl?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'ERROR':
        return 'bg-error-container/40 text-error border-error/30 dark:bg-error-container/20';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'INFO':
      default:
        return 'bg-primary-container/40 text-primary border-primary/20 dark:bg-primary-container/20';
    }
  };

  const formattedDate = new Date(log.createdAt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-4xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stacktrace-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/40 bg-surface dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${getLevelBadgeClass(
                log.level
              )}`}
            >
              {log.level}
            </span>
            <h2 id="stacktrace-dialog-title" className="text-xl font-bold text-on-surface dark:text-white">
              Chi tiết nhật ký hệ thống
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-on-surface dark:text-slate-200">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface dark:bg-slate-800/60 border border-outline-variant/30">
            <div>
              <span className="text-xs font-medium text-on-surface-variant dark:text-slate-400 block mb-1">
                Thời gian ghi nhận
              </span>
              <span className="font-mono text-xs">{formattedDate}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-on-surface-variant dark:text-slate-400 block mb-1">
                Nguồn phát sinh (Source / Logger)
              </span>
              <span className="font-mono text-xs text-primary dark:text-blue-400 break-all">
                {log.source || 'N/A'}
              </span>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider block mb-1">
              Thông điệp lỗi / Log Message
            </label>
            <div className="p-3.5 rounded-xl bg-surface dark:bg-slate-800 border border-outline-variant/40 font-mono text-xs text-on-surface dark:text-slate-200 break-words leading-relaxed">
              {log.message}
            </div>
          </div>

          {/* StackTrace */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                Stack Trace
              </label>
              {log.stackTrace && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary hover:text-primary-container bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Đã sao chép' : 'Sao chép trace'}</span>
                </button>
              )}
            </div>

            {log.stackTrace ? (
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto max-h-80 border border-slate-800 shadow-inner selection:bg-blue-600 selection:text-white">
                <code>{log.stackTrace}</code>
              </pre>
            ) : (
              <div className="p-4 rounded-xl bg-surface dark:bg-slate-800/40 border border-dashed border-outline-variant/40 text-center text-xs text-on-surface-variant dark:text-slate-400 italic">
                Bản ghi này không kèm theo Stack Trace ngoại lệ.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface dark:bg-slate-900/80 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-surface-variant/40 hover:bg-surface-variant/70 text-on-surface transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

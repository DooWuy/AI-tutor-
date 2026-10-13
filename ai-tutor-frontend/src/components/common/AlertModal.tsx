import React, { useEffect } from 'react';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

export interface AlertModalConfig {
  isOpen: boolean;
  type?: AlertType;
  category?: string;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertModalProps {
  config: AlertModalConfig | null;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ config, onClose }) => {
  useEffect(() => {
    if (!config?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (config.onCancel) config.onCancel();
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, onClose]);

  if (!config || !config.isOpen) return null;

  const type = config.type || 'success';

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          topBar: 'bg-amber-500',
          iconWrapper: 'bg-amber-50 text-amber-600 border border-amber-200/80',
          icon: 'warning',
          categoryColor: 'text-amber-600',
          defaultCategory: 'CONFIRM PROMPT',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
          defaultConfirmText: 'Xác nhận',
        };
      case 'error':
        return {
          topBar: 'bg-red-500',
          iconWrapper: 'bg-red-50 text-red-600 border border-red-200/80',
          icon: 'error',
          categoryColor: 'text-red-600',
          defaultCategory: 'SYSTEM ERROR',
          confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
          defaultConfirmText: 'Đóng',
        };
      case 'info':
        return {
          topBar: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          iconWrapper: 'bg-blue-50 text-blue-600 border border-blue-200/80',
          icon: 'psychology',
          categoryColor: 'text-blue-600',
          defaultCategory: 'AI RECOMMENDATION',
          confirmBtn: 'bg-primary hover:bg-primary-container text-on-primary',
          defaultConfirmText: 'Đã hiểu',
        };
      case 'success':
      default:
        return {
          topBar: 'bg-emerald-500',
          iconWrapper: 'bg-emerald-50 text-emerald-600 border border-emerald-200/80',
          icon: 'check_circle',
          categoryColor: 'text-emerald-600',
          defaultCategory: 'SUCCESS ALERT',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          defaultConfirmText: 'Tuyệt vời',
        };
    }
  };

  const style = getTypeStyles();
  const categoryText = config.category || style.defaultCategory;
  const confirmLabel = config.confirmText || style.defaultConfirmText;

  const handleConfirm = () => {
    if (config.onConfirm) {
      config.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) {
      config.onCancel();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant/60 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Accent Line */}
        <div className={`h-1.5 w-full ${style.topBar}`} />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Circle Icon */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${style.iconWrapper}`}>
              <span className="material-symbols-outlined text-2xl font-bold">
                {style.icon}
              </span>
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
              <span className={`text-[11px] font-bold tracking-wider uppercase block mb-1 ${style.categoryColor}`}>
                {categoryText}
              </span>

              <h3 className="text-base font-bold text-on-surface leading-snug mb-1.5">
                {config.title}
              </h3>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                {config.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-1">
            {config.cancelText && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
              >
                {config.cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2 rounded-xl text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer ${style.confirmBtn}`}
              autoFocus
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

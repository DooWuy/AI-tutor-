import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const ToastItemComponent: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 4000;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (duration <= 0 || isPaused) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [duration, isPaused, toast.id, onDismiss]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          card: 'bg-surface-container-lowest/95 border-emerald-500/30 text-on-surface shadow-emerald-950/10',
          iconWrapper: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          progressBar: 'bg-emerald-500',
          Icon: CheckCircle2,
          defaultTitle: 'Thành công',
        };
      case 'error':
        return {
          card: 'bg-surface-container-lowest/95 border-red-500/30 text-on-surface shadow-red-950/10',
          iconWrapper: 'bg-red-500/10 text-red-600 dark:text-red-400',
          progressBar: 'bg-red-500',
          Icon: AlertCircle,
          defaultTitle: 'Có lỗi xảy ra',
        };
      case 'warning':
        return {
          card: 'bg-surface-container-lowest/95 border-amber-500/30 text-on-surface shadow-amber-950/10',
          iconWrapper: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
          progressBar: 'bg-amber-500',
          Icon: AlertTriangle,
          defaultTitle: 'Chú ý',
        };
      case 'info':
      default:
        return {
          card: 'bg-surface-container-lowest/95 border-primary/30 text-on-surface shadow-primary/10',
          iconWrapper: 'bg-primary/10 text-primary',
          progressBar: 'bg-primary',
          Icon: Info,
          defaultTitle: 'Thông tin',
        };
    }
  };

  const style = getTypeStyles();
  const IconComponent = style.Icon;

  return (
    <div
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative overflow-hidden flex items-start gap-3 w-80 sm:w-96 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 sm:slide-in-from-right-3 ${style.card}`}
    >
      {/* Icon Circle */}
      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${style.iconWrapper}`}>
        <IconComponent size={18} className="stroke-[2.5]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className="text-xs font-bold leading-tight mb-0.5 tracking-tight text-on-surface">
            {toast.title}
          </h4>
        )}
        <p className="text-xs font-medium leading-relaxed text-on-surface-variant break-words">
          {toast.message}
        </p>

        {/* Action Button if specified */}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-on-surface-variant/60 hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <X size={15} />
      </button>

      {/* Progress Bar (countdown indicator) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container-high/40 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${style.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'bottom-right',
}) => {
  if (toasts.length === 0) return null;

  const positionClasses = {
    'bottom-right': 'bottom-5 right-5 flex-col-reverse items-end',
    'top-right': 'top-5 right-5 flex-col items-end',
    'bottom-left': 'bottom-5 left-5 flex-col-reverse items-start',
    'top-left': 'top-5 left-5 flex-col items-start',
  }[position];

  return (
    <div
      aria-live="polite"
      className={`fixed z-[99] flex gap-2.5 max-w-full pointer-events-none p-2 ${positionClasses}`}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItemComponent toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

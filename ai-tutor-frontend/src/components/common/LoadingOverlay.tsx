import React from 'react';
import { Spinner } from './Spinner';

export interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Đang tải dữ liệu...',
  subMessage,
  fullscreen = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={message}
      className={`${
        fullscreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-20'
      } flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200`}
    >
      <div className="bg-surface-container-lowest/95 border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center text-center max-w-sm w-full backdrop-blur-xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Spinner size="lg" color="primary" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1">
          {message}
        </h3>
        {subMessage && (
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
};

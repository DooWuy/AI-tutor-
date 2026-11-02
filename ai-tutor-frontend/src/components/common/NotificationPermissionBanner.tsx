import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';

const DISMISSED_KEY = 'aitutor_dismissed_desktop_notif_banner';

export const NotificationPermissionBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { permission, requestDesktopPermission } = useNotification();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isRequesting, setIsRequesting] = useState(false);

  // If permission changed to granted or denied, we don't need to show it
  if (permission !== 'default' || isDismissed) {
    return null;
  }

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await requestDesktopPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch { /* storage fallback */ }
  };

  return (
    <div
      role="region"
      aria-label="Cảnh báo quyền thông báo"
      className={`relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-surface-container to-primary/5 p-3.5 sm:p-4 text-on-surface shadow-xs transition-all ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications_active
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-on-surface leading-tight">
              Bật thông báo đẩy nhắc nhở tiết học
            </h4>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              Nhận thông báo pop-up trên máy tính trước giờ học 15 phút, ngay cả khi bạn đang chuyển tab hoặc mở ứng dụng khác.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors"
          >
            Để sau
          </button>
          <button
            type="button"
            disabled={isRequesting}
            onClick={handleRequest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-on-primary hover:bg-primary-hover active:scale-95 text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{isRequesting ? 'Đang bật…' : 'Bật thông báo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

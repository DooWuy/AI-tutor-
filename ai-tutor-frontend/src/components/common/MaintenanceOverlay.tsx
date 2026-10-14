import React, { useEffect, useState } from 'react';

// Custom event name for maintenance signaling
export const MAINTENANCE_EVENT = 'aitutor:maintenance';

export interface MaintenanceEventDetail {
  enabled: boolean;
  message?: string;
}

/**
 * Dispatch an event to toggle maintenance overlay globally
 */
export function triggerMaintenanceMode(message?: string) {
  window.dispatchEvent(
    new CustomEvent<MaintenanceEventDetail>(MAINTENANCE_EVENT, {
      detail: { enabled: true, message },
    })
  );
}

export function clearMaintenanceMode() {
  window.dispatchEvent(
    new CustomEvent<MaintenanceEventDetail>(MAINTENANCE_EVENT, {
      detail: { enabled: false },
    })
  );
}

export const MaintenanceOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>(
    'Hệ thống AI Tutor đang được bảo trì và nâng cấp định kỳ để cải thiện chất lượng học tập. Vui lòng quay lại sau ít phút.'
  );

  useEffect(() => {
    // 1. Listen for custom maintenance events
    const handleMaintenanceEvent = (event: Event) => {
      const customEvt = event as CustomEvent<MaintenanceEventDetail>;
      if (customEvt.detail?.enabled) {
        setIsOpen(true);
        if (customEvt.detail.message) {
          setMaintenanceMessage(customEvt.detail.message);
        }
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener(MAINTENANCE_EVENT, handleMaintenanceEvent);

    // 2. Intercept window.fetch to capture 503 MAINTENANCE_MODE responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 503) {
        // Clone response to inspect error body without consuming caller's stream
        try {
          const clone = response.clone();
          const contentType = clone.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await clone.json();
            if (data?.error === 'MAINTENANCE_MODE' || data?.code === 'MAINTENANCE_MODE' || data?.message) {
              setMaintenanceMessage(
                data.message || 'Hệ thống đang trong chế độ bảo trì để nâng cấp định kỳ.'
              );
              setIsOpen(true);
            }
          }
        } catch {
          // If body reading fails, default open
          setIsOpen(true);
        }
      }
      return response;
    };

    return () => {
      window.removeEventListener(MAINTENANCE_EVENT, handleMaintenanceEvent);
      window.fetch = originalFetch;
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
      className="fixed inset-0 z-999 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Animated Icon Container */}
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/10">
          <span className="material-symbols-outlined text-4xl animate-bounce">
            construction
          </span>
        </div>

        {/* Title */}
        <h2
          id="maintenance-title"
          className="text-2xl sm:text-3xl font-black text-on-surface dark:text-white tracking-tight mb-3"
        >
          Hệ thống đang bảo trì
        </h2>

        {/* Subtitle / Message */}
        <p className="text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed mb-6 max-w-md">
          {maintenanceMessage}
        </p>

        {/* Info card */}
        <div className="w-full p-4 rounded-2xl bg-surface dark:bg-slate-800/80 border border-outline-variant/40 text-xs text-on-surface-variant dark:text-slate-400 space-y-2 mb-6 text-left">
          <div className="flex items-center gap-2 text-primary font-medium">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>Thời gian dự kiến hoàn thành: Ít phút nữa</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">mail</span>
            <span>Bộ phận hỗ trợ kỹ thuật: hotro@aitutor.vn</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span>Thử tải lại trang</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              window.location.href = '/login';
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-outline-variant/60 hover:bg-surface-variant/40 text-on-surface dark:text-slate-200 font-semibold text-sm transition"
          >
            Đăng nhập lại
          </button>
        </div>
      </div>
    </div>
  );
};
export default MaintenanceOverlay;

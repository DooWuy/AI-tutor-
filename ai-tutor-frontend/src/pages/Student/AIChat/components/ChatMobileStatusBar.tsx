import React from 'react';

interface ChatMobileStatusBarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreateSession: () => void;
  sessionCount: number;
  currentSubject?: string;
  hasActiveSession: boolean;
  studentAvatar: string;
}

export const ChatMobileStatusBar: React.FC<ChatMobileStatusBarProps> = ({
  isOpen,
  onToggle,
  onCreateSession,
  sessionCount,
  currentSubject,
  hasActiveSession,
  studentAvatar,
}) => {
  return (
    <aside
      className="w-12 bg-surface-container-low border-r border-outline-variant/70 flex flex-col items-center justify-between py-3 px-1 shrink-0 md:hidden select-none z-30"
      aria-label="Thanh trạng thái điều khiển di động"
    >
      {/* Top: AI Brand & Live Status Indicator */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="relative w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-2xs shadow-primary/30"
          title={hasActiveSession ? `Gia sư AI đang trực tuyến • ${currentSubject || ''}` : 'Gia sư AI'}
        >
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            smart_toy
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-1 ring-surface-container-low" />
          </span>
        </div>
      </div>

      {/* Center: Main Controls (Toggle Session List & Quick Add) */}
      <div className="flex flex-col items-center gap-2.5 my-auto">
        {/* Toggle Session List Button */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
            isOpen
              ? 'bg-primary text-on-primary shadow-xs ring-2 ring-primary/20'
              : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/60 shadow-2xs'
          }`}
          title={isOpen ? 'Đóng danh sách chat' : 'Mở danh sách phiên chat'}
          aria-label={isOpen ? 'Đóng danh sách chat' : 'Mở danh sách phiên chat'}
        >
          <span className="material-symbols-outlined text-lg transition-transform duration-200">
            {isOpen ? 'dock_to_left' : 'forum'}
          </span>

          {/* Session Count Badge */}
          {!isOpen && sessionCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-0.5 rounded-full bg-primary text-on-primary text-[8px] font-bold flex items-center justify-center leading-none ring-1 ring-surface-container-low">
              {sessionCount > 99 ? '99+' : sessionCount}
            </span>
          )}
        </button>

        {/* Quick New Session Button */}
        <button
          type="button"
          onClick={onCreateSession}
          className="w-9 h-9 rounded-xl bg-primary-fixed hover:bg-primary-fixed-dim text-primary flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
          title="Tạo cuộc trò chuyện mới"
          aria-label="Tạo cuộc trò chuyện mới"
        >
          <span className="material-symbols-outlined text-lg font-bold">
            add
          </span>
        </button>
      </div>

      {/* Bottom: Active Subject Pill & Student Avatar */}
      <div className="flex flex-col items-center gap-2">
        {currentSubject && (
          <span
            className="text-[9px] font-bold text-secondary uppercase tracking-tight truncate max-w-[40px] text-center"
            title={`Môn học: ${currentSubject}`}
          >
            {currentSubject.slice(0, 4)}
          </span>
        )}

        <img
          src={studentAvatar}
          alt="Avatar"
          className="w-7 h-7 rounded-full object-cover ring-1 ring-outline-variant/70 shrink-0"
        />
      </div>
    </aside>
  );
};

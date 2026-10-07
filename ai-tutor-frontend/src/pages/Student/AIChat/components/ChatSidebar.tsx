import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession } from '../../../../services/chatApi';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (session: ChatSession) => void;
  onDeleteSession: (session: ChatSession) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuSessionId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuSessionId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuSessionId]);

  const filteredSessions = selectedSubject
    ? sessions.filter((s) => s.subject.toLowerCase() === selectedSubject.toLowerCase())
    : sessions;

  return (
    <aside className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col shrink-0 h-full overflow-hidden select-none rounded-l-xl">
      <div className="p-3.5 space-y-3 border-b border-outline-variant/60">
        <button
          onClick={onCreateSession}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-98 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span className="text-body-md font-body-md font-semibold text-sm">Đặt câu hỏi mới</span>
        </button>
        <div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-secondary mb-1.5 px-1 font-semibold">
            <span>Phân loại theo môn</span>
            <button
              onClick={() => setSelectedSubject(null)}
              className="text-[11px] text-primary cursor-pointer hover:underline font-normal"
            >
              Tất cả ({sessions.length})
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedSubject(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedSubject === null
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/60'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setSelectedSubject(selectedSubject === 'Toán học' ? null : 'Toán học')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 border border-outline-variant/60 flex items-center gap-1 transition-colors cursor-pointer ${
                selectedSubject === 'Toán học'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-xs">calculate</span> Toán học
            </button>
            <button
              onClick={() => setSelectedSubject(selectedSubject === 'Tiếng Anh' ? null : 'Tiếng Anh')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 border border-outline-variant/60 flex items-center gap-1 transition-colors cursor-pointer ${
                selectedSubject === 'Tiếng Anh'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-xs">translate</span> Tiếng Anh
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 custom-scrollbar text-sm">
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-outline uppercase tracking-wider">
            Danh sách Phiên Chat
          </div>
          <div className="space-y-1 mt-1">
            {filteredSessions.map((session) => (
              <div key={session.id} className="relative group">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectSession(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSession(session.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors cursor-pointer text-left select-none ${
                    activeSessionId === session.id
                      ? 'bg-secondary-container text-on-secondary-container font-medium shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base shrink-0 ${
                      activeSessionId === session.id ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    forum
                  </span>
                  <div className="truncate flex-1 min-w-0 pr-6">
                    <p
                      className={`text-xs truncate ${
                        activeSessionId === session.id
                          ? 'font-semibold'
                          : 'font-medium group-hover:text-on-surface'
                      }`}
                    >
                      {session.title || 'Trò chuyện mới'}
                    </p>
                    <p
                      className={`text-[10px] truncate ${
                        activeSessionId === session.id ? 'text-secondary' : 'text-outline'
                      }`}
                    >
                      {session.subject} • {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {activeSessionId === session.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mr-1"></span>
                  )}
                </div>

                {/* 3-dots action button */}
                <button
                  type="button"
                  aria-label="Tùy chọn cuộc trò chuyện"
                  title="Tùy chọn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuSessionId((prev) => (prev === session.id ? null : session.id));
                  }}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    openMenuSessionId === session.id
                      ? 'bg-surface-container-highest text-on-surface opacity-100'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container-highest opacity-0 group-hover:opacity-100 focus:opacity-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-base leading-none">more_vert</span>
                </button>

                {/* Dropdown Menu */}
                {openMenuSessionId === session.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-1 top-full mt-1 w-44 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuSessionId(null);
                        onRenameSession(session);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-on-surface hover:bg-surface-container transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-secondary">edit</span>
                      <span>Đổi tên</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuSessionId(null);
                        onDeleteSession(session);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-error hover:bg-error-container/20 transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm text-error">delete</span>
                      <span>Xóa cuộc trò chuyện</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {filteredSessions.length === 0 && (
              <div className="text-center text-xs text-outline py-4">Chưa có phiên chat nào.</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

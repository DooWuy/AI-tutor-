import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatSession } from '../../../../services/chatApi';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onRenameSession: (session: ChatSession) => void;
  onDeleteSession: (session: ChatSession) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Extract unique subjects from sessions
  const availableSubjects = useMemo(() => {
    const defaultSubs = ['Toán học', 'Tiếng Anh', 'Vật lý', 'Hóa học'];
    const sessionSubs = sessions.map((s) => s.subject).filter(Boolean);
    const combined = Array.from(new Set([...defaultSubs, ...sessionSubs]));
    return combined;
  }, [sessions]);

  // Filter sessions by subject & search query
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchSubject = selectedSubject
        ? s.subject.toLowerCase() === selectedSubject.toLowerCase()
        : true;
      const matchSearch = searchQuery.trim()
        ? (s.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          s.subject.toLowerCase().includes(searchQuery.trim().toLowerCase())
        : true;
      return matchSubject && matchSearch;
    });
  }, [sessions, selectedSubject, searchQuery]);

  const formatSessionTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const handleSelect = (id: string) => {
    onSelectSession(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleCreate = () => {
    onCreateSession();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderContent = () => (
    <>
      {/* Top Header Actions */}
      <div className="p-3.5 space-y-3 border-b border-outline-variant/60 bg-surface-container-low shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleCreate}
            className="flex-1 bg-primary hover:bg-primary-container text-on-primary font-medium py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all duration-150 active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_circle
            </span>
            <span className="text-xs font-semibold">Đặt câu hỏi mới</span>
          </button>

          {/* Desktop collapse button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Thu gọn danh sách"
              aria-label="Thu gọn danh sách"
            >
              <span className="material-symbols-outlined text-lg">dock_to_left</span>
            </button>
          )}

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              title="Đóng danh sách"
              aria-label="Đóng danh sách"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-outline pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm cuộc trò chuyện..."
            className="w-full pl-8 pr-7 py-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              aria-label="Xóa tìm kiếm"
            >
              <span className="material-symbols-outlined text-sm">clear</span>
            </button>
          )}
        </div>

        {/* Subject Filter Pills */}
        <div>
          <div className="flex items-center justify-between text-label-sm text-secondary mb-1.5 px-0.5 font-semibold">
            <span>Phân loại theo môn</span>
            <button
              onClick={() => setSelectedSubject(null)}
              className="text-[11px] text-primary cursor-pointer hover:underline font-normal"
            >
              Tất cả ({sessions.length})
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedSubject(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedSubject === null
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/60'
              }`}
            >
              Tất cả
            </button>
            {availableSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(selectedSubject === sub ? null : sub)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 border border-outline-variant/60 flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-primary text-on-primary border-primary shadow-2xs font-semibold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3 custom-scrollbar text-sm">
        <div className="flex items-center justify-between px-2 py-0.5">
          <span className="text-[11px] font-bold text-outline uppercase tracking-wider">
            Lịch sử ({filteredSessions.length})
          </span>
        </div>

        <div className="space-y-1">
          {filteredSessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div key={session.id} className="relative group">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(session.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(session.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-all cursor-pointer text-left select-none ${
                    isActive
                      ? 'bg-secondary-container/90 text-on-secondary-container font-medium shadow-2xs ring-1 ring-primary/20'
                      : 'text-on-surface-variant hover:bg-surface-container/80'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">forum</span>
                  </div>

                  <div className="truncate flex-1 min-w-0 pr-6">
                    <p
                      className={`text-xs truncate ${
                        isActive ? 'font-bold text-on-secondary-container' : 'font-medium group-hover:text-on-surface'
                      }`}
                    >
                      {session.title || 'Trò chuyện mới'}
                    </p>
                    <p
                      className={`text-[10px] truncate mt-0.5 ${
                        isActive ? 'text-on-secondary-container/80 font-medium' : 'text-outline'
                      }`}
                    >
                      {session.subject} • {formatSessionTime(session.createdAt)}
                    </p>
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mr-0.5" />
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
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="text-center text-xs text-outline py-8 px-4">
              <span className="material-symbols-outlined text-3xl opacity-40 mb-1 block">chat_bubble_outline</span>
              <span>{searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có phiên chat nào.'}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer (Visible on < md when isOpenMobile is true) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-12 z-40 w-72 sm:w-80 max-w-[calc(100vw-3.5rem)] bg-surface-container-low border-r border-outline-variant flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-250 select-none">
            {renderContent()}
          </aside>
        </div>
      )}

      {/* Desktop / Tablet Sidebar (Visible on >= md unless collapsed) */}
      {!isCollapsed && (
        <aside className="hidden md:flex w-72 lg:w-80 bg-surface-container-low border-r border-outline-variant flex-col shrink-0 h-full overflow-hidden select-none transition-all duration-200">
          {renderContent()}
        </aside>
      )}
    </>
  );
};

import React from 'react';
import type { ChatSession } from '../../../../services/chatApi';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
}) => {
  return (
    <aside className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col shrink-0 h-full overflow-hidden select-none rounded-l-xl">
      <div className="p-3.5 space-y-3 border-b border-outline-variant/60">
        <button
          onClick={onCreateSession}
          className="w-full bg-primary hover:bg-primary-container text-on-primary font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-98"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          <span className="text-body-md font-body-md font-semibold text-sm">Đặt câu hỏi mới</span>
        </button>
        <div>
          <div className="flex items-center justify-between text-label-sm font-label-sm text-secondary mb-1.5 px-1 font-semibold">
            <span>Phân loại theo môn</span>
            <span className="text-[11px] text-primary cursor-pointer hover:underline">Tất cả ({sessions.length})</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-on-primary shrink-0 transition-colors">
              Tất cả
            </button>
            <button className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container shrink-0 border border-outline-variant/60 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">calculate</span> Toán học
            </button>
            <button className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container shrink-0 border border-outline-variant/60 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">translate</span> Tiếng Anh
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 custom-scrollbar text-sm">
        <div>
          <div className="px-2 py-1 text-[11px] font-bold text-outline uppercase tracking-wider">Danh sách Phiên Chat</div>
          <div className="space-y-1 mt-1">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors text-left ${
                  activeSessionId === session.id
                    ? 'bg-secondary-container text-on-secondary-container font-medium shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container group'
                }`}
              >
                <span className={`material-symbols-outlined text-base shrink-0 ${activeSessionId === session.id ? 'text-primary' : 'text-secondary'}`}>
                  forum
                </span>
                <div className="truncate flex-1">
                  <p className={`text-xs truncate ${activeSessionId === session.id ? 'font-semibold' : 'font-medium group-hover:text-on-surface'}`}>
                    {session.title || 'Trò chuyện mới'}
                  </p>
                  <p className={`text-[10px] truncate ${activeSessionId === session.id ? 'text-secondary' : 'text-outline'}`}>
                    {session.subject} • {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {activeSessionId === session.id && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                )}
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="text-center text-xs text-outline py-4">Chưa có phiên chat nào.</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

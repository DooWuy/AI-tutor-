import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, ChatMessage } from '../../../../services/chatApi';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatAreaProps {
  session: ChatSession | null;
  messages: ChatMessage[];
  studentAvatar: string;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onOpenMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onCreateSession?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  messages,
  studentAvatar,
  onSendMessage,
  isLoading,
  onOpenMobileSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse,
  onCreateSession,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper icon for subjects
  const getSubjectIcon = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case 'toán học':
        return 'calculate';
      case 'tiếng anh':
        return 'translate';
      case 'vật lý':
        return 'science';
      case 'hóa học':
        return 'biotech';
      case 'ngữ văn':
        return 'menu_book';
      case 'sinh học':
        return 'psychology';
      default:
        return 'auto_awesome';
    }
  };

  if (!session) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-background text-center select-none relative">
        {/* Mobile header trigger even in empty state */}
        <div className="absolute top-3 left-4 md:hidden">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Mở danh sách phiên chat"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
            <span>Danh sách chat</span>
          </button>
        </div>

        <div className="max-w-md w-full p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-on-primary flex items-center justify-center shadow-md shadow-primary/25">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              smart_toy
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              Gia Sư AI Sẵn Sàng Đồng Hành
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Hãy chọn một phiên trò chuyện ở danh sách bên trái hoặc tạo mới để nhận hướng dẫn giải bài tập từng bước theo phương pháp Socratic.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onCreateSession && (
              <button
                type="button"
                onClick={onCreateSession}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Đặt câu hỏi mới</span>
              </button>
            )}

            {onOpenMobileSidebar && (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="w-full sm:w-auto md:hidden px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container border border-outline-variant/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">forum</span>
                <span>Xem danh sách chat</span>
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background h-full overflow-hidden relative">
      {/* Chat Header */}
      <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-outline-variant/70 bg-surface flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile open drawer button */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 -ml-1.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            title="Danh sách phiên chat"
            aria-label="Mở danh sách phiên chat"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>

          {/* Tablet/Desktop expand sidebar button if collapsed */}
          {isSidebarCollapsed && onToggleSidebarCollapse && (
            <button
              type="button"
              onClick={onToggleSidebarCollapse}
              className="hidden md:flex p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              title="Mở rộng danh sách chat"
              aria-label="Mở rộng danh sách chat"
            >
              <span className="material-symbols-outlined text-xl">dock_to_left</span>
            </button>
          )}

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm shrink-0 ring-1 ring-primary/20">
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {getSubjectIcon(session.subject)}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className="text-xs sm:text-sm font-bold text-on-surface truncate max-w-[140px] xs:max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg"
                title={session.title || 'Trò chuyện'}
              >
                {session.title || 'Trò chuyện mới'}
              </h1>
              <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                {session.subject}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gia sư AI sẵn sàng hỗ trợ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <ChatMessageBubble key={msg.id || idx} message={msg} studentAvatar={studentAvatar} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-2xs text-primary max-w-sm animate-pulse">
            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            <div className="text-xs font-semibold text-on-surface">
              Gia sư AI đang phân tích câu hỏi...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Chat Input Bar */}
      <div className="p-3 sm:p-4 border-t border-outline-variant/70 bg-surface shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="text-secondary font-semibold flex items-center gap-1 text-[11px] sm:text-xs">
                <span className="material-symbols-outlined text-sm">tune</span> Chế độ giải:
              </span>
              <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/60">
                <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-[11px] sm:text-xs font-semibold bg-surface-container-lowest text-primary shadow-2xs">
                  Gợi mở Socratic
                </span>
              </div>
            </div>
            <div className="text-[11px] text-outline hidden md:block">
              Shift + Enter để xuống dòng • Enter để gửi
            </div>
          </div>

          <div className="relative bg-surface-container-lowest border border-outline-variant/80 rounded-2xl shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full bg-transparent border-0 px-3.5 sm:px-4 pt-3 pb-12 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:ring-0 outline-none resize-none min-h-[58px] sm:min-h-[70px]"
              placeholder="Nhập câu hỏi hoặc bài tập bạn cần hướng dẫn..."
              rows={2}
            />

            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1 pointer-events-auto">
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  title="Đính kèm tệp (sắp ra mắt)"
                  disabled
                >
                  <span className="material-symbols-outlined text-xl opacity-60">attach_file</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="pointer-events-auto bg-primary hover:bg-primary-container disabled:opacity-40 text-on-primary px-3.5 sm:px-4 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Gửi</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

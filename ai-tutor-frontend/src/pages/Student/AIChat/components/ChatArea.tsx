import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, ChatMessage } from '../../../../services/chatApi';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatAreaProps {
  session: ChatSession | null;
  messages: ChatMessage[];
  studentAvatar: string;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  messages,
  studentAvatar,
  onSendMessage,
  isLoading
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-outline">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20" style={{ fontVariationSettings: "'FILL' 1" }}>
          smart_toy
        </span>
        <p>Vui lòng chọn một phiên trò chuyện hoặc tạo mới để bắt đầu.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col bg-background h-full overflow-hidden relative">
      {/* Chat Header */}
      <div className="h-14 px-6 border-b border-outline-variant bg-surface flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-lg">calculate</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-on-surface">{session.title}</h1>
              <span className="bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold px-2 py-0.5 rounded-full">
                {session.subject}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gia sư AI sẵn sàng hỗ trợ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <ChatMessageBubble key={msg.id || idx} message={msg} studentAvatar={studentAvatar} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-primary p-4">
            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            <span className="text-sm font-medium">AI đang trả lời...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Chat Input Bar */}
      <div className="p-4 border-t border-outline-variant bg-surface shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="text-secondary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">tune</span> Chế độ giải:
              </span>
              <div className="inline-flex rounded-lg bg-surface-container p-0.5 border border-outline-variant/60">
                <button className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-surface-container-lowest text-primary shadow-xs">
                  Gợi mở Socratic
                </button>
              </div>
            </div>
            <div className="text-[11px] text-outline hidden md:block">
              Shift + Enter để xuống dòng
            </div>
          </div>

          <div className="relative bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="w-full bg-transparent border-0 px-4 pt-3 pb-12 text-sm text-on-surface placeholder:text-outline focus:ring-0 outline-none resize-none"
              placeholder="Nhập câu hỏi của bạn..."
              rows={2}
            ></textarea>
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Icons placeholder */}
                <button className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-xl">attach_file</span>
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary px-4 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all"
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

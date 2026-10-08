import React, { useState } from 'react';
import type { ChatMessage } from '../../../../services/chatApi';
import { CitationModal } from './CitationModal';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  studentAvatar: string;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, studentAvatar }) => {
  const isStudent = message.senderType === 'STUDENT';
  const [selectedCitation, setSelectedCitation] = useState<any | null>(null);

  return (
    <div className={`flex gap-2.5 sm:gap-3.5 max-w-[92%] sm:max-w-[85%] md:max-w-3xl ${isStudent ? 'ml-auto flex-row-reverse' : ''}`}>
      {isStudent ? (
        <img 
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 ring-2 ring-primary/20 mt-0.5"
          src={studentAvatar} 
          alt="Student Avatar" 
        />
      ) : (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-2xs shadow-primary/30 mt-0.5">
          <span className="material-symbols-outlined text-lg sm:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            smart_toy
          </span>
        </div>
      )}
      
      <div className={`flex flex-col space-y-1.5 sm:space-y-2 flex-1 min-w-0 ${isStudent ? 'items-end' : ''}`}>
        {!isStudent && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-on-surface">Gia Sư AI</span>
            <span className="text-[10px] sm:text-[11px] text-outline">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        <div className={`
          p-3.5 sm:p-4 shadow-2xs text-xs sm:text-sm space-y-3 leading-relaxed break-words overflow-hidden
          ${isStudent 
            ? 'bg-primary text-on-primary rounded-2xl rounded-tr-xs' 
            : 'bg-surface-container-lowest border border-outline-variant/80 rounded-2xl rounded-tl-xs text-on-surface'}
        `}>
          <div className={`prose prose-sm max-w-none overflow-x-auto prose-p:leading-relaxed prose-pre:bg-surface-container-high prose-pre:text-on-surface prose-code:text-primary ${isStudent ? 'text-on-primary prose-headings:text-on-primary prose-strong:text-on-primary prose-a:text-on-primary prose-code:text-on-primary' : 'text-on-surface prose-headings:text-on-surface prose-strong:text-on-surface prose-a:text-primary'}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Citations section if present */}
          {!isStudent && message.citationLinks && message.citationLinks.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-outline-variant/60">
              <p className="text-[11px] sm:text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] sm:text-[14px]">auto_stories</span>
                Nguồn tham khảo:
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {message.citationLinks.map((cit, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCitation(cit)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-[11px] sm:text-xs font-medium text-on-surface-variant transition-colors group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px] text-outline group-hover:text-primary transition-colors shrink-0">
                      description
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-[200px]">
                      {cit.metadata?.file_name || cit.metadata?.source || `Tài liệu ${idx + 1}`}
                    </span>
                    {(cit.metadata?.page_label || cit.metadata?.page) && (
                      <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] ml-0.5 opacity-80 shrink-0">
                        tr.{cit.metadata?.page_label || cit.metadata?.page}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {isStudent && (
          <span className="text-[10px] sm:text-[11px] text-outline mr-1">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <CitationModal
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        citation={selectedCitation}
      />
    </div>
  );
};

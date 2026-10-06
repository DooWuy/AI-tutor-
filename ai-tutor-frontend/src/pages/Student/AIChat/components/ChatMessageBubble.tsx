import React, { useState } from 'react';
import type { ChatMessage } from '../../../../services/chatApi';
import { CitationModal } from './CitationModal';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
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
    <div className={`flex gap-3.5 max-w-3xl ${isStudent ? 'ml-auto flex-row-reverse' : ''}`}>
      {isStudent ? (
        <img 
          className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
          src={studentAvatar} 
          alt="Student Avatar" 
        />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm shadow-primary/30 mt-1">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
      )}
      
      <div className={`flex flex-col space-y-2 flex-1 ${isStudent ? 'items-end' : ''}`}>
        {!isStudent && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-on-surface">Gia Sư AI</span>
            <span className="text-[11px] text-outline">{new Date(message.createdAt).toLocaleTimeString()}</span>
          </div>
        )}
        
        <div className={`
          p-4 shadow-sm text-sm space-y-3 leading-relaxed
          ${isStudent 
            ? 'bg-primary text-on-primary rounded-2xl rounded-tr-xs' 
            : 'bg-surface-container-lowest border border-outline-variant/80 rounded-2xl rounded-tl-xs text-on-surface'}
        `}>
          <div className={`prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface-container-high prose-pre:text-on-surface prose-code:text-primary ${isStudent ? 'text-on-primary prose-headings:text-on-primary prose-strong:text-on-primary prose-a:text-on-primary prose-code:text-on-primary' : 'text-on-surface prose-headings:text-on-surface prose-strong:text-on-surface prose-a:text-primary'}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
          
          {/* Citations section if present */}
          {!isStudent && message.citationLinks && message.citationLinks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-outline-variant/60">
              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                Nguồn tham khảo:
              </p>
              <div className="flex flex-wrap gap-2">
                {message.citationLinks.map((cit, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCitation(cit)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-xs font-medium text-on-surface-variant transition-colors group"
                  >
                    <span className="material-symbols-outlined text-[12px] text-outline group-hover:text-primary transition-colors">description</span>
                    <span className="truncate max-w-[200px]">
                        {cit.metadata?.file_name || cit.metadata?.source || `Tài liệu ${idx + 1}`}
                    </span>
                    {(cit.metadata?.page_label || cit.metadata?.page) && (
                        <span className="bg-surface-container-highest px-1.5 py-0.5 rounded text-[10px] ml-1 opacity-80">
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
          <span className="text-[11px] text-outline mr-1">
            {new Date(message.createdAt).toLocaleTimeString()}
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

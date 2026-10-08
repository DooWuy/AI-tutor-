import React, { useEffect } from 'react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: { text: string; metadata?: any } | null;
}

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose, citation }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !citation) return null;

  const fileName = citation.metadata?.file_name || citation.metadata?.source || 'Tài liệu không tên';
  
  // Format page number if available
  let pageInfo = '';
  if (citation.metadata?.page_label) {
      pageInfo = ` - Trang ${citation.metadata.page_label}`;
  } else if (citation.metadata?.page) {
      pageInfo = ` - Trang ${citation.metadata.page}`;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between sticky top-0 bg-surface-container-lowest">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
              <span className="material-symbols-outlined text-lg">description</span>
            </div>
            <div className="truncate">
                <h2 className="text-base font-bold text-on-surface truncate">
                  {fileName}
                </h2>
                <p className="text-xs font-medium text-on-surface-variant truncate">
                  Trích xuất từ nguồn dữ liệu{pageInfo}
                </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-surface flex-1">
          <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-on-surface-variant">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
               <span className="material-symbols-outlined text-primary text-[18px]">format_quote</span>
               Nội dung trích xuất:
            </h3>
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 shadow-sm">
                <p className="whitespace-pre-wrap text-sm">{citation.text}</p>
            </div>
          </div>
          
          {citation.metadata && Object.keys(citation.metadata).length > 0 && (
              <div className="mt-6 pt-4 border-t border-outline-variant/40">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(citation.metadata).map(([key, value]) => {
                      if (key === 'file_name' || key === 'page' || key === 'page_label' || typeof value !== 'string') return null;
                      return (
                          <div key={key} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                              <span className="block text-[10px] font-semibold text-outline uppercase mb-0.5">{key}</span>
                              <span className="block text-xs font-medium text-on-surface truncate" title={value}>{value}</span>
                          </div>
                      );
                  })}
                </div>
              </div>
          )}
        </div>
        
        <div className="px-5 py-3 border-t border-outline-variant/50 flex justify-end bg-surface-container-lowest">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              Đóng
            </button>
        </div>

      </div>
    </div>
  );
};

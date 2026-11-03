import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
} from 'lucide-react';

interface DocumentStatsSectionProps {
  total: number;
  successCount: number;
  processingCount: number;
  failedCount: number;
  onFilterStatus?: (status: string) => void;
  activeStatus?: string;
}

export const DocumentStatsSection: React.FC<DocumentStatsSectionProps> = ({
  total,
  successCount,
  processingCount,
  failedCount,
  onFilterStatus,
  activeStatus,
}) => {
  const cards = [
    {
      id: '',
      title: 'Tổng số tài liệu',
      value: total,
      desc: 'Tài liệu & học liệu đã lưu trữ',
      icon: Database,
      color: 'blue',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      activeRing: 'ring-2 ring-blue-500',
    },
    {
      id: 'SUCCESS',
      title: 'Sẵn sàng RAG Vector',
      value: successCount,
      desc: 'Đã nhúng vector cho AI Tutor tra cứu',
      icon: CheckCircle2,
      color: 'emerald',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      activeRing: 'ring-2 ring-emerald-500',
    },
    {
      id: 'PROCESSING',
      title: 'Đang bóc tách & Vector',
      value: processingCount,
      desc: 'Đang xếp hàng / OCR / nhúng vector',
      icon: Clock,
      color: 'amber',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      activeRing: 'ring-2 ring-amber-500',
      hasPulse: processingCount > 0,
    },
    {
      id: 'FAILED',
      title: 'Cần kiểm tra lại',
      value: failedCount,
      desc: 'Lỗi định dạng hoặc trích xuất text',
      icon: AlertTriangle,
      color: 'rose',
      badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      activeRing: 'ring-2 ring-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeStatus === card.id;

        return (
          <div
            key={card.id || 'all'}
            onClick={() => onFilterStatus && onFilterStatus(card.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFilterStatus && onFilterStatus(card.id);
              }
            }}
            className={`group relative overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-left cursor-pointer ${
              isSelected ? card.activeRing : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-on-surface tracking-tight">
                    {card.value}
                  </span>
                  {card.hasPulse && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      Đang chạy
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${card.badgeClass}`}
              >
                <Icon size={20} />
              </div>
            </div>
            <p className="mt-2 text-xs text-on-surface-variant line-clamp-1">
              {card.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

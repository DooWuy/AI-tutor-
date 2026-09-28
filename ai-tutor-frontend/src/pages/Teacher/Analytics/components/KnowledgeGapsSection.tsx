import type { KnowledgeGapItem } from '../types/analytics';
import { KnowledgeGapCard } from './KnowledgeGapCard';
import { styles } from '../AnalyticsPage.styles';

interface KnowledgeGapsSectionProps {
  gaps: KnowledgeGapItem[];
  classSize?: number;
  analyzedAt?: string;
}

export function KnowledgeGapsSection({
  gaps,
  classSize,
  analyzedAt,
}: KnowledgeGapsSectionProps) {
  const formattedDate = analyzedAt
    ? new Date(analyzedAt).toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <section className={styles.gapsSectionCard}>
      <div className={styles.gapsHeader}>
        <div>
          <h3 className={styles.gapsTitle}>
            <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
            <span>Phân tích Lỗ hổng Kiến thức của Lớp (AI Class Knowledge Gaps)</span>
          </h3>
          <p className={styles.gapsSubtitle}>
            Hệ thống AI tự động bóc tách các chủ đề học sinh làm sai nhiều nhất trong bài kiểm tra và hỏi AI Tutor
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          {classSize ? (
            <span className="bg-surface-container px-2.5 py-1 rounded-lg font-medium">
              Sĩ số: <strong>{classSize}</strong> học sinh
            </span>
          ) : null}
          {formattedDate && (
            <span className="hidden sm:inline bg-surface-container px-2.5 py-1 rounded-lg font-medium">
              Cập nhật: {formattedDate}
            </span>
          )}
        </div>
      </div>

      {gaps.length === 0 ? (
        <div className={styles.emptyStateBox}>
          <div className={styles.emptyStateIcon}>
            <span className="material-symbols-outlined">sentiment_satisfied</span>
          </div>
          <h4 className={styles.emptyStateTitle}>Không phát hiện lỗ hổng kiến thức nghiêm trọng</h4>
          <p className={styles.emptyStateDesc}>
            Toàn bộ học sinh trong lớp đang nắm rất vững các chủ đề bài thi trong giai đoạn này.
          </p>
        </div>
      ) : (
        <div className={styles.gapsList}>
          {gaps.map((item) => (
            <KnowledgeGapCard key={`${item.rank}-${item.topic}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

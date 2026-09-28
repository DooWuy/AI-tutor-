import type { KnowledgeGapItem } from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface KnowledgeGapCardProps {
  item: KnowledgeGapItem;
}

export function KnowledgeGapCard({ item }: KnowledgeGapCardProps) {
  const percentNumber = Number(item.affectedPercent);
  const percentText = !isNaN(percentNumber) ? `${percentNumber.toFixed(1)}%` : `${item.affectedPercent}%`;

  return (
    <div className={styles.gapCard}>
      <div className={styles.gapCardTop}>
        <div className="flex items-center gap-3">
          <div className={styles.gapRankBadge}>#{item.rank}</div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className={styles.gapTopicName}>{item.topic}</h4>
              <span className={styles.gapSubjectPill}>{item.subject || 'Chung'}</span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Có <strong>{item.affectedStudentCount}</strong> học sinh trong lớp làm sai hoặc gặp khó khăn
            </p>
          </div>
        </div>

        <div className={styles.gapPercentArea}>
          <span className={styles.gapPercentText}>{percentText}</span>
          <span className={styles.gapPercentLabel}>học sinh bị hổng</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.gapProgressTrack}>
        <div
          className={styles.gapProgressBar}
          style={{ width: `${Math.min(100, Math.max(0, percentNumber))}%` }}
        />
      </div>

      {/* Stats row */}
      <div className={styles.gapStatsRow}>
        <div className={styles.gapStatChip}>
          <span className="material-symbols-outlined text-error text-[16px]">cancel</span>
          <span>Số câu làm sai: <strong className="text-on-surface">{item.wrongAnswerCount}</strong></span>
        </div>
        <div className={styles.gapStatChip}>
          <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
          <span>Số câu làm đúng: <strong className="text-on-surface">{item.correctAnswerCount}</strong></span>
        </div>
        <div className={styles.gapStatChip}>
          <span className="material-symbols-outlined text-primary text-[16px]">smart_toy</span>
          <span>Đã hỏi AI Tutor: <strong className="text-on-surface">{item.askingStudentCount}</strong> em</span>
        </div>
      </div>

      {/* AI Advice Box */}
      {item.advice && (
        <div className={styles.gapAdviceBox}>
          <div className={styles.gapAdviceTitle}>
            <div className={styles.gapAdviceIconWrap}>
              <span className="material-symbols-outlined text-[15px]">tips_and_updates</span>
            </div>
            <span>Khuyến nghị can thiệp sư phạm</span>
          </div>
          <p className={styles.gapAdviceText}>{item.advice}</p>
        </div>
      )}
    </div>
  );
}

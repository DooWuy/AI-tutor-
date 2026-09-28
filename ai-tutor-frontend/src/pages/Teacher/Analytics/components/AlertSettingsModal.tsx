import { useState, useEffect } from 'react';
import { analyticsApi } from '../../../../services/analyticsApi';
import type {
  AlertSettingsUpdateResponse,
} from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onUpdateSuccess: (res: AlertSettingsUpdateResponse) => void;
}

export function AlertSettingsModal({
  isOpen,
  onClose,
  classId,
  className,
  onUpdateSuccess,
}: AlertSettingsModalProps) {
  const [scoreThreshold, setScoreThreshold] = useState<string>('5.0');
  const [inactivityDays, setInactivityDays] = useState<number>(7);
  const [maxGapTopics, setMaxGapTopics] = useState<number>(3);
  const [messageTemplate, setMessageTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !classId) return;

    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    analyticsApi
      .getAlertSettings(classId)
      .then((settings) => {
        if (!isCancelled) {
          setScoreThreshold(
            settings.scoreThreshold !== null ? Number(settings.scoreThreshold).toFixed(1) : '5.0'
          );
          setInactivityDays(settings.inactivityDays || 7);
          setMaxGapTopics(settings.maxGapTopics || 3);
          setMessageTemplate(settings.messageTemplate || '');
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tải cấu hình cảnh báo hiện tại.'
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, classId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const scoreNum = parseFloat(scoreThreshold);
    if (isNaN(scoreNum) || scoreNum <= 0 || scoreNum > 10) {
      setErrorMessage('Ngưỡng điểm trung bình phải từ 0.1 đến 10.0');
      return;
    }
    if (inactivityDays < 0 || inactivityDays > 365) {
      setErrorMessage('Số ngày không hoạt động phải từ 0 đến 365 ngày.');
      return;
    }
    if (maxGapTopics < 1 || maxGapTopics > 50) {
      setErrorMessage('Số lượng lỗ hổng kiến thức tối đa phải từ 1 đến 50.');
      return;
    }
    if (!messageTemplate.trim()) {
      setErrorMessage('Mẫu tin nhắn cảnh báo không được để trống.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await analyticsApi.updateAlertSettings(classId, {
        scoreThreshold: scoreNum,
        inactivityDays,
        maxGapTopics,
        messageTemplate: messageTemplate.trim(),
      });
      onUpdateSuccess(res);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể cập nhật cấu hình cảnh báo.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                Cài đặt Ngưỡng Cảnh báo Nguy cơ Học tập {className ? `- Lớp ${className}` : ''}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Tùy chỉnh tiêu chuẩn đánh giá để AI tự động quét và phân loại học sinh mất gốc
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.modalCloseBtn}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {errorMessage && <div className={styles.alertError}>{errorMessage}</div>}

          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-xs text-outline font-medium gap-2">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              <span>Đang tải cấu hình hiện tại...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Score threshold */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Ngưỡng điểm yếu (&lt;)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10.0"
                    value={scoreThreshold}
                    onChange={(e) => setScoreThreshold(e.target.value)}
                    className={styles.formInput}
                  />
                  <p className={styles.formHint}>Học sinh có điểm TB dưới mức này sẽ bị cảnh báo.</p>
                </div>

                {/* Inactive days */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Ngày không học (&gt;)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(parseInt(e.target.value, 10) || 0)}
                    className={styles.formInput}
                  />
                  <p className={styles.formHint}>Số ngày liên tục không mở app tự học.</p>
                </div>

                {/* Gap topics count */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <span>Lỗ hổng tối đa (≥)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxGapTopics}
                    onChange={(e) => setMaxGapTopics(parseInt(e.target.value, 10) || 1)}
                    className={styles.formInput}
                  />
                  <p className={styles.formHint}>Số chủ đề thi bị hổng kiến thức.</p>
                </div>
              </div>

              {/* Message Template textarea */}
              <div className={styles.formGroup}>
                <div className={styles.formLabel}>
                  <span>Mẫu tin nhắn cảnh báo gửi phụ huynh:</span>
                  <span className="text-[11px] text-outline font-normal">Hỗ trợ Dynamic Placeholders</span>
                </div>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={5}
                  className={styles.formTextarea}
                  placeholder="Kính gửi phụ huynh em {StudentName}..."
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-on-surface-variant">
                  <span className="font-semibold text-outline">Từ khóa động:</span>
                  <code className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold">
                    {'{StudentName}'}
                  </code>
                  <code className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold">
                    {'{InactivityDays}'}
                  </code>
                  <code className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold">
                    {'{GapDetails}'}
                  </code>
                </div>
              </div>

              <div className="p-3 bg-primary-fixed/30 rounded-xl border border-primary/20 text-xs text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                  info
                </span>
                <p>
                  Sau khi bấm <strong>Lưu cấu hình</strong>, hệ thống AI sẽ tự động quét và đánh giá lại toàn bộ học sinh trong lớp theo các ngưỡng mới ngay tức thì.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={styles.btnSecondary}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className={styles.btnPrimary}
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Đang quét lại dữ liệu...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Lưu cấu hình</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

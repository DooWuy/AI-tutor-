import { useState, useEffect } from 'react';
import { analyticsApi } from '../../../../services/analyticsApi';
import type {
  AtRiskStudent,
  ParentChannel,
  ReportPeriod,
} from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

interface SendParentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: AtRiskStudent | null;
  classId: string;
  subject: string;
  period: ReportPeriod;
  onSendSuccess: (msg: string) => void;
}

export function SendParentAlertModal({
  isOpen,
  onClose,
  student,
  classId,
  subject,
  period,
  onSendSuccess,
}: SendParentAlertModalProps) {
  const [body, setBody] = useState('');
  const [channels, setChannels] = useState<ParentChannel[]>(['ZALO', 'PUSH']);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !student) return;

    let isCancelled = false;
    setIsLoadingDraft(true);
    setErrorMessage(null);

    analyticsApi
      .draftParentMessage(student.studentId, classId, subject, period)
      .then((draft) => {
        if (!isCancelled) {
          setBody(draft.body || '');
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Không thể tự động soạn bản nháp AI.'
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingDraft(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, student, classId, subject, period]);

  if (!isOpen || !student) return null;

  const toggleChannel = (channel: ParentChannel) => {
    if (channels.includes(channel)) {
      if (channels.length === 1) return; // Must have at least 1
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const handleSend = async () => {
    if (body.trim().length < 50) {
      setErrorMessage('Nội dung tin nhắn phải có tối thiểu 50 ký tự.');
      return;
    }
    if (body.length > 1000) {
      setErrorMessage('Nội dung tin nhắn không được vượt quá 1000 ký tự.');
      return;
    }
    if (channels.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một kênh gửi tin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await analyticsApi.sendParentMessage(student.studentId, {
        classId,
        body: body.trim(),
        channels,
      });
      onSendSuccess(`Đã gửi thông báo cảnh báo tới phụ huynh em ${student.fullName} thành công!`);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Lỗi khi gửi tin nhắn cho phụ huynh.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = body.length;
  const isTooShort = charCount < 50;
  const isTooLong = charCount > 1000;

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">mark_email_read</span>
            </div>
            <div>
              <h3 className={styles.modalTitle}>Gửi Cảnh báo tới Phụ huynh Học sinh</h3>
              <p className="text-xs text-on-surface-variant">
                Bản nháp tự động tổng hợp bởi AI Tutor dựa trên dữ liệu học tập thực tế
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

          {/* Student Info Card */}
          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-outline">Học sinh:</span>{' '}
              <strong className="text-on-surface text-sm">{student.fullName}</strong>{' '}
              <span className="text-outline">({student.studentCode})</span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                Điểm TB:{' '}
                <strong className={student.averageScore && student.averageScore < 5 ? 'text-error' : ''}>
                  {student.averageScore !== null ? Number(student.averageScore).toFixed(1) : '--'}
                </strong>
              </span>
              <span>
                Nghỉ tự học:{' '}
                <strong className="text-error">{student.inactiveDays ?? 0} ngày</strong>
              </span>
            </div>
          </div>

          {/* Message textarea with Auto-draft */}
          <div className={styles.formGroup}>
            <div className={styles.formLabel}>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[16px]">auto_awesome</span>
                <span>Nội dung tin nhắn (AI Auto-Draft):</span>
              </span>
              <span
                className={`text-[11px] font-bold ${
                  isTooShort || isTooLong ? 'text-error' : 'text-outline'
                }`}
              >
                {charCount} / 1000 ký tự (Tối thiểu 50)
              </span>
            </div>

            {isLoadingDraft ? (
              <div className="flex items-center justify-center h-36 bg-surface rounded-xl border border-outline-variant text-xs text-outline font-medium gap-2">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>AI Tutor đang phân tích dữ liệu và soạn thảo tin nhắn...</span>
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className={styles.formTextarea}
                placeholder="Nội dung gửi cho phụ huynh học sinh..."
              />
            )}
            <p className={styles.formHint}>
              Giáo viên có thể kiểm tra và chỉnh sửa câu chữ trước khi bấm nút gửi chính thức.
            </p>
          </div>

          {/* Channels Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span>Kênh gửi thông báo:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { key: 'ZALO' as ParentChannel, label: 'Zalo OA', icon: 'chat' },
                { key: 'PUSH' as ParentChannel, label: 'App Phụ huynh', icon: 'notifications_active' },
                { key: 'SMS' as ParentChannel, label: 'Tin nhắn SMS', icon: 'sms' },
                { key: 'EMAIL' as ParentChannel, label: 'Email', icon: 'mail' },
              ].map((ch) => {
                const checked = channels.includes(ch.key);
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() => toggleChannel(ch.key)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      checked
                        ? 'bg-primary-fixed border-primary text-on-primary-fixed ring-1 ring-primary'
                        : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={styles.btnSecondary}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSubmitting || isLoadingDraft || isTooShort || isTooLong}
            className={styles.btnPrimary}
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Đang gửi thông báo...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Gửi thông báo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

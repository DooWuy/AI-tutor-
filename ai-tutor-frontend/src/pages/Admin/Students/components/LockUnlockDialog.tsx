import { useEffect, useState } from 'react';
import { AlertCircle, Lock, RefreshCw, ShieldAlert, ShieldCheck, Unlock, X } from 'lucide-react';
import { toggleStudentStatus, AdminStudentApiError } from '../../../../services/adminStudentApi';
import type { AdminStudentDetail, AdminStudentListItem } from '../../../../types/adminStudent';

interface LockUnlockDialogProps {
  isOpen: boolean;
  student: AdminStudentListItem | AdminStudentDetail | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function LockUnlockDialog({ isOpen, student, onClose, onSuccess }: LockUnlockDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSubmitting(false);
    setErrorMessage(null);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  const isLocking = student.active;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      setSubmitting(true);
      await toggleStudentStatus(student.studentId, !student.active);
      const toastText = isLocking
        ? 'Đã khóa tài khoản học sinh.'
        : 'Đã mở khóa tài khoản học sinh.';
      onSuccess(toastText);
      onClose();
    } catch (err: unknown) {
      if (err instanceof AdminStudentApiError) {
        setErrorMessage(err.message || 'Không thể thực hiện thay đổi trạng thái.');
      } else {
        setErrorMessage('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-unlock-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-2xl p-6 space-y-4 student-modal-enter">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-xs ${
                isLocking
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isLocking ? <Lock size={22} /> : <Unlock size={22} />}
            </div>
            <div>
              <h3 id="lock-unlock-dialog-title" className="text-base font-extrabold text-on-surface">
                {isLocking ? 'Khóa tài khoản học sinh?' : 'Mở khóa tài khoản học sinh?'}
              </h3>
              <p className="text-xs font-bold text-primary mt-0.5">
                {student.fullName} ({student.studentCode})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Đóng dialog"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error-container/40 border border-error/30 text-on-error-container text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0 text-error" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/50 text-xs text-on-surface-variant leading-relaxed">
          <div className="flex items-start gap-2">
            {isLocking ? (
              <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div>
              {isLocking ? (
                <p>
                  Học sinh sẽ <strong>không thể đăng nhập</strong> vào hệ thống AI Tutor cho đến khi tài khoản được mở lại. Mọi tiến trình học tập, lịch sử quiz và dữ liệu gamification vẫn được <strong>bảo lưu an toàn</strong>.
                </p>
              ) : (
                <p>
                  Học sinh có thể <strong>đăng nhập lại ngay lập tức</strong> bằng thông tin tài khoản hiện tại để tiếp tục lộ trình học tập.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/40">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              isLocking
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20'
            }`}
          >
            {submitting && <RefreshCw size={13} className="animate-spin" />}
            <span>
              {submitting ? 'Đang cập nhật...' : isLocking ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

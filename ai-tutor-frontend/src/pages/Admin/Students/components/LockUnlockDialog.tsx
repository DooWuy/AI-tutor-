import { useEffect, useState } from 'react';
import { AlertCircle, Lock, RefreshCw, Unlock } from 'lucide-react';
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
      await toggleStudentStatus(student.studentId);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181c22]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-unlock-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#c1c6d5]/70 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              isLocking
                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                : 'bg-[#d6e3ff] text-[#005cb8]'
            }`}
          >
            {isLocking ? <Lock size={20} /> : <Unlock size={20} />}
          </div>
          <div>
            <h3 id="lock-unlock-dialog-title" className="text-base font-bold text-[#181c22]">
              {isLocking ? 'Khóa tài khoản học sinh?' : 'Mở khóa tài khoản học sinh?'}
            </h3>
            <p className="text-xs font-semibold text-[#005cb8] mt-0.5">
              {student.fullName} ({student.studentCode})
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs">
            <AlertCircle size={15} className="shrink-0 text-[#ba1a1a]" />
            <span>{errorMessage}</span>
          </div>
        )}

        <p className="text-xs text-[#414753] leading-relaxed">
          {isLocking
            ? 'Học sinh sẽ không thể đăng nhập cho đến khi tài khoản được mở lại. Dữ liệu học tập vẫn được giữ nguyên.'
            : 'Học sinh có thể đăng nhập lại bằng thông tin tài khoản hiện tại.'}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#c1c6d5]/30">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-[#414753] hover:bg-[#ebedf7] hover:text-[#181c22] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              isLocking
                ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
                : 'bg-[#005cb8] hover:bg-[#1275e2]'
            }`}
          >
            {submitting && <RefreshCw size={13} className="animate-spin" />}
            <span>
              {isLocking
                ? submitting
                  ? 'Đang khóa...'
                  : 'Khóa tài khoản'
                : submitting
                ? 'Đang mở khóa...'
                : 'Mở khóa'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

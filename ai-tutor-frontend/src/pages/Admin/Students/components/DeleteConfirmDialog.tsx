import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, RefreshCw, Trash2, X } from 'lucide-react';
import { deleteStudent, AdminStudentApiError } from '../../../../services/adminStudentApi';
import type { AdminStudentDetail, AdminStudentListItem } from '../../../../types/adminStudent';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  student: AdminStudentListItem | AdminStudentDetail | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function DeleteConfirmDialog({ isOpen, student, onClose, onSuccess }: DeleteConfirmDialogProps) {
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

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      setSubmitting(true);
      await deleteStudent(student.studentId);
      onSuccess('Đã xóa mềm tài khoản học sinh.');
      onClose();
    } catch (err: unknown) {
      if (err instanceof AdminStudentApiError) {
        setErrorMessage(err.message || 'Không thể xóa học sinh. Vui lòng thử lại.');
      } else {
        setErrorMessage('Đã có lỗi xảy ra khi thực hiện thao tác xóa.');
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
      aria-labelledby="delete-confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-2xl p-6 space-y-4 student-modal-enter">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 id="delete-confirm-dialog-title" className="text-base font-extrabold text-on-surface">
                Xóa học sinh khỏi danh sách?
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

        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-on-surface-variant leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <p>
              Đây là thao tác <strong>xóa mềm (soft delete)</strong>. Tài khoản học sinh sẽ bị ẩn khỏi danh sách vận hành, nhưng toàn bộ lịch sử điểm số, bài quiz và hội thoại AI <strong>vẫn được giữ nguyên</strong> trong cơ sở dữ liệu để bảo toàn thống kê hệ thống.
            </p>
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-error hover:bg-error/90 rounded-xl shadow-xs shadow-red-900/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting && <RefreshCw size={13} className="animate-spin" />}
            <span>{submitting ? 'Đang xóa...' : 'Xác nhận xóa mềm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

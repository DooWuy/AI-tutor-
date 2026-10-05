import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181c22]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#c1c6d5]/70 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 id="delete-confirm-dialog-title" className="text-base font-bold text-[#181c22]">
              Xóa học sinh khỏi danh sách quản lý?
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
          Đây là xóa mềm. Tài khoản sẽ bị ẩn khỏi danh sách vận hành, nhưng lịch sử học tập, bài làm và hội thoại vẫn được giữ lại để bảo toàn dữ liệu báo cáo.
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#ba1a1a] hover:bg-[#93000a] rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting && <RefreshCw size={13} className="animate-spin" />}
            <span>{submitting ? 'Đang xóa...' : 'Xóa mềm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Trash2, X } from 'lucide-react';
import { skillApi, SkillApiError } from '../../../../services/skillApi';
import { useToast } from '../../../../context/ToastContext';
import type { SkillItem } from '../../../../types/skills';

interface DeleteSkillModalProps {
  isOpen: boolean;
  skill: SkillItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteSkillModal({ isOpen, skill, onClose, onSuccess }: DeleteSkillModalProps) {
  const { toast } = useToast();
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

  if (!isOpen || !skill) return null;

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await skillApi.deleteSkill(skill.id);
      toast.success(`Đã xóa kỹ năng "${skill.skillCode}" khỏi hệ thống.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof SkillApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể xóa kỹ năng này. Vui lòng thử lại sau.');
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
    >
      <div className="w-full max-w-md rounded-2xl bg-surface border border-outline-variant shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10 text-red-600">
            <Trash2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-on-surface">Xác nhận xóa Kỹ năng</h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Bạn có chắc chắn muốn xóa kỹ năng{' '}
              <strong className="text-on-surface font-mono font-bold text-primary">[{skill.skillCode}]</strong> -{' '}
              <span className="font-semibold">{skill.name}</span>?
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-xs text-on-surface-variant space-y-1">
          <div className="flex justify-between">
            <span>Số bài học liên kết:</span>
            <span className="font-bold text-on-surface">{skill.assignedLessonCount || 0} bài</span>
          </div>
          <div className="flex justify-between">
            <span>Số câu hỏi trong ngân hàng:</span>
            <span className="font-bold text-on-surface">{skill.questionCount || 0} câu</span>
          </div>
          <p className="text-[11px] text-red-500 font-medium pt-1">
            * Lưu ý: Thao tác này sẽ gỡ bỏ toàn bộ liên kết của kỹ năng này với bài học.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-red-600/30 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting && <RefreshCw size={14} className="animate-spin" />}
            <span>Xác nhận xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}

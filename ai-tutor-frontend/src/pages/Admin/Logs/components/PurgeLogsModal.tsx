import React, { useState } from 'react';

interface PurgeLogsModalProps {
  isOpen: boolean;
  isPurging: boolean;
  onClose: () => void;
  onConfirm: (daysOld: number) => Promise<void>;
}

export const PurgeLogsModal: React.FC<PurgeLogsModalProps> = ({
  isOpen,
  isPurging,
  onClose,
  onConfirm,
}) => {
  const [daysOld, setDaysOld] = useState<number>(30);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(daysOld);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !isPurging && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-md bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purge-dialog-title"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-error-container/30 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">auto_delete</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="purge-dialog-title" className="text-lg font-bold text-on-surface dark:text-white">
              Dọn dẹp nhật ký cũ
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
              Thao tác này sẽ xoá vĩnh viễn các bản ghi nhật ký hệ thống cũ hơn khoảng thời gian đã chọn nhằm giải phóng dung lượng cơ sở dữ liệu.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant dark:text-slate-300 mb-1.5">
              Thời gian lưu trữ (Xoá các log cũ hơn):
            </label>
            <select
              value={daysOld}
              onChange={(e) => setDaysOld(Number(e.target.value))}
              disabled={isPurging}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface dark:bg-slate-800 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent transition"
            >
              <option value={7}>Cũ hơn 7 ngày (1 tuần)</option>
              <option value={14}>Cũ hơn 14 ngày (2 tuần)</option>
              <option value={30}>Cũ hơn 30 ngày (1 tháng - Khuyến nghị)</option>
              <option value={60}>Cũ hơn 60 ngày (2 tháng)</option>
              <option value={90}>Cũ hơn 90 ngày (3 tháng)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-error text-base shrink-0 mt-0.5">
              warning
            </span>
            <p className="text-xs text-error leading-relaxed">
              <strong>Lưu ý:</strong> Dữ liệu đã dọn dẹp không thể khôi phục lại. Vui lòng chắc chắn bạn đã sao lưu các thông tin kiểm toán cần thiết nếu có.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPurging}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-variant/40 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isPurging}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-error hover:bg-error/90 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isPurging ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  <span>Đang dọn dẹp...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">delete_sweep</span>
                  <span>Xác nhận dọn dẹp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Edit3, X, AlertCircle, Sparkles } from 'lucide-react';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    fileName: string;
  } | null;
  onSave: (payload: { title: string; subject: string; gradeLevel: string }) => Promise<void>;
  isSaving: boolean;
  error?: string;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onSave,
  isSaving,
  error,
}) => {
  if (!isOpen || !document) return null;

  const [title, setTitle] = useState(document.title);
  const [subject, setSubject] = useState(document.subject);
  const [gradeLevel, setGradeLevel] = useState(document.gradeLevel);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;
    await onSave({
      title: title.trim(),
      subject: subject.trim().toUpperCase(),
      gradeLevel: gradeLevel.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm doc-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-dialog"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl text-on-surface">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Edit3 size={20} />
            </div>
            <div>
              <h2 id="document-dialog" className="text-lg font-bold text-on-surface">
                Sửa phân loại tài liệu
              </h2>
              <p className="text-xs text-on-surface-variant break-all">
                Tệp gốc: {document.fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Tên tài liệu <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              required
              maxLength={255}
              placeholder="Nhập tên tài liệu hiển thị"
              className="w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Môn học (mã môn) <span className="text-rose-500">*</span>
              </label>
              <input
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value.toUpperCase())}
                disabled={isSaving}
                required
                maxLength={50}
                placeholder="VD: TOAN, VAN, ANH"
                className="w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Khối lớp <span className="text-rose-500">*</span>
              </label>
              <input
                name="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                disabled={isSaving}
                required
                maxLength={20}
                placeholder="VD: 10, 11, 12"
                className="w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-on-surface-variant flex items-start gap-2.5">
            <Sparkles size={16} className="shrink-0 text-blue-500 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Khi cập nhật, các thuộc tính phân loại (môn học, khối) sẽ được tự động đồng bộ vào toàn bộ các đoạn vector nhúng (DocumentChunk) trong cơ sở dữ liệu để đảm bảo bộ lọc tra cứu AI luôn chính xác.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Đang lưu…
                </>
              ) : (
                'Xác nhận'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


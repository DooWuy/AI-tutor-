import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
  isSaving: boolean;
  error?: string;
}

const subjects = [
  { code: 'TOAN', name: 'Toán học' },
  { code: 'VAN', name: 'Ngữ văn' },
  { code: 'ANH', name: 'Tiếng Anh' },
  { code: 'LY', name: 'Vật lý' },
  { code: 'HOA', name: 'Hóa học' },
  { code: 'SINH', name: 'Sinh học' },
  { code: 'SU', name: 'Lịch sử' },
  { code: 'DIA', name: 'Địa lý' },
  { code: 'TIN', name: 'Tin học' },
  { code: 'GDCD', name: 'Giáo dục công dân' },
  { code: 'KHTN', name: 'Khoa học tự nhiên' },
];

const grades = Array.from({ length: 12 }, (_, i) => String(i + 1));

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isSaving,
  error,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('TOAN');
  const [gradeLevel, setGradeLevel] = useState('10');
  const [customSubject, setCustomSubject] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setLocalError('');
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = ['.pdf', '.docx', '.txt', '.md'];

    if (!validExtensions.includes(ext)) {
      setLocalError('Chỉ hỗ trợ tệp định dạng PDF, DOCX, TXT hoặc MD.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setLocalError('Dung lượng tệp vượt quá giới hạn cho phép (tối đa 50MB).');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isSaving) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isSaving) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile || isSaving) return;

    const finalSubject = subject === 'CUSTOM' ? customSubject.trim().toUpperCase() : subject;
    if (!finalSubject) {
      setLocalError('Vui lòng chọn hoặc nhập mã môn học.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('subject', finalSubject);
    formData.append('gradeLevel', gradeLevel);

    await onUpload(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm doc-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant bg-surface p-6 shadow-2xl text-on-surface">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 id="upload-dialog-title" className="text-lg font-bold text-on-surface">
                Tải lên tài liệu mới
              </h2>
              <p className="text-xs text-on-surface-variant">
                Bổ sung tài liệu học tập vào nguồn tri thức cho AI Tutor
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

        {(error || localError) && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{localError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              Tệp tài liệu (PDF, DOCX, TXT, MD - Tối đa 50MB) <span className="text-rose-500">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isSaving && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container'
              } ${isSaving ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                name="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                disabled={isSaving}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <FileText size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-on-surface break-all">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isSaving}
                    className="mt-1 text-xs text-rose-500 hover:underline font-semibold"
                  >
                    Chọn tệp khác
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-container text-on-surface-variant border border-outline-variant">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      Kéo thả tệp vào đây hoặc <span className="text-primary hover:underline">Duyệt tệp</span>
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Định dạng hỗ trợ: PDF, DOCX, TXT, MD
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subject & Grade grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Môn học <span className="text-rose-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSaving}
                className="w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
              >
                {subjects.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code})
                  </option>
                ))}
                <option value="CUSTOM">Khác (Tự nhập mã)</option>
              </select>
              {subject === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="Nhập mã môn (VD: AMNHAC)"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  disabled={isSaving}
                  required
                  className="mt-2 w-full min-h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 uppercase"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Khối lớp <span className="text-rose-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                disabled={isSaving}
                className="w-full min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
              >
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Khối {g} (Lớp {g})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RAG Ingestion Pipeline Hint */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-on-surface-variant flex items-start gap-2.5">
            <Sparkles size={16} className="shrink-0 text-primary mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-primary">Cơ chế xử lý Vector RAG tự động</span>
              <p className="leading-relaxed text-[11px]">
                Sau khi tải lên, hệ thống sẽ đẩy vào hàng đợi xử lý ngầm (RabbitMQ): trích xuất văn bản OCR, chia thành các đoạn ngữ nghĩa (chunks) và nhúng vector 1024 chiều. Chỉ tài liệu đạt trạng thái <strong>Thành công</strong> mới được AI Tutor dùng tra cứu.
              </p>
            </div>
          </div>

          {/* Actions */}
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
              disabled={!selectedFile || isSaving}
              className="min-h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Đang tải lên & xử lý…
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  Tải tài liệu
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

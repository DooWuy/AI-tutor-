import { useState, useRef, type ChangeEvent } from 'react';
import { styles } from '../TeachingMaterialsPage.styles';
import { curriculumApi } from '../../../../services/curriculumApi';
import type {
  BookItem,
  PendingUploadBook,
  TocAnalysisResult,
  TocChapterDraft,
  ExtractStructurePayload,
} from '../types/curriculum';

interface TocScanModalProps {
  book: BookItem | PendingUploadBook;
  pdfFile?: File;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onEnsureBookSaved?: (pending: PendingUploadBook) => Promise<string>;
}

export function TocScanModal({
  book,
  pdfFile: initialPdfFile,
  isOpen,
  onClose,
  onSuccess,
  onEnsureBookSaved,
}: TocScanModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(() => {
    if (initialPdfFile) return initialPdfFile;
    if ('file' in book && book.file instanceof File) return book.file;
    return null;
  });

  const [tocImages, setTocImages] = useState<File[]>([]);
  const [method, setMethod] = useState<'AI' | 'OCR'>('AI');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TocAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [persistedBookId, setPersistedBookId] = useState<string | null>(() => {
    if ('savedBookId' in book && book.savedBookId) return book.savedBookId;
    if (!('file' in book) && 'id' in book) return (book as BookItem).id;
    return null;
  });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle PDF file selection if not provided
  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setPdfFile(file);
        setErrorMessage(null);
      } else {
        setErrorMessage('File được chọn phải có định dạng PDF.');
      }
    }
  };

  // Handle TOC images selection
  const handleImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setTocImages((prev) => [...prev, ...newImages]);
      setErrorMessage(null);
    }
  };

  const handleImagesDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validImages = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name)
      );
      if (validImages.length > 0) {
        setTocImages((prev) => [...prev, ...validImages]);
        setErrorMessage(null);
      } else {
        setErrorMessage('Vui lòng chọn ảnh định dạng JPG, PNG hoặc WebP.');
      }
    }
  };

  const removeImage = (index: number) => {
    setTocImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger Step 1: Analyze TOC
  const handleAnalyzeToc = async () => {
    setErrorMessage(null);

    if (!pdfFile) {
      setErrorMessage('Vui lòng chọn file PDF sách giáo khoa.');
      return;
    }

    if (tocImages.length === 0) {
      setErrorMessage('Cần ít nhất một ảnh chụp mục lục (chụp trang mục lục của sách).');
      return;
    }

    setIsAnalyzing(true);
    try {
      let activeBookId = persistedBookId;

      // If pending book is not yet created in database, create it now
      if (!activeBookId && onEnsureBookSaved && 'file' in book) {
        activeBookId = await onEnsureBookSaved(book as PendingUploadBook);
        setPersistedBookId(activeBookId);
      }

      if (!activeBookId) {
        throw new Error('Chưa thể xác định định danh Sách trong CSDL.');
      }

      const result = await curriculumApi.analyzeToc(
        activeBookId,
        pdfFile,
        tocImages,
        method,
        book.curriculumName
      );

      setAnalysisResult(result);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể phân tích mục lục.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update page range in result table
  const handleUpdateLessonPage = (
    chIndex: number,
    lsIndex: number,
    field: 'startPage' | 'endPage',
    val: number | null
  ) => {
    if (!analysisResult) return;
    const chaptersCopy = [...analysisResult.chapters];
    const chapter = { ...chaptersCopy[chIndex] };
    const lessonsCopy = [...chapter.lessons];
    lessonsCopy[lsIndex] = {
      ...lessonsCopy[lsIndex],
      [field]: val,
    };
    chapter.lessons = lessonsCopy;
    chaptersCopy[chIndex] = chapter;

    setAnalysisResult({
      ...analysisResult,
      chapters: chaptersCopy,
    });
  };

  // Trigger Step 2: Extract & Ingest
  const handleConfirmAndIngest = async () => {
    if (!analysisResult || !pdfFile) return;

    setErrorMessage(null);
    setIsIngesting(true);

    try {
      const activeBookId = persistedBookId || ('savedBookId' in book ? book.savedBookId : (book as BookItem).id);
      if (!activeBookId) {
        throw new Error('Không tìm thấy định danh sách trong CSDL để cắt.');
      }

      const payload: ExtractStructurePayload = {
        pdfPageOffset: analysisResult.pdfPageOffset,
        documentType: 'THEORY',
        chapters: analysisResult.chapters.map((ch: TocChapterDraft, chIdx: number) => ({
          chapterName: ch.chapterName,
          chapterCode: `CH_${chIdx + 1}`,
          lessons: ch.lessons.map((ls, lsIdx) => ({
            lessonName: ls.lessonName,
            lessonCode: `LS_${chIdx + 1}_${lsIdx + 1}`,
            startPage: ls.startPage,
            endPage: ls.endPage,
            documentType: 'THEORY',
          })),
        })),
      };

      await curriculumApi.extractAndIngest(activeBookId, pdfFile, payload);
      onSuccess(
        `Đã tiếp nhận yêu cầu số hóa sách "${book.title}". Tiến trình cắt PDF và nạp tri thức vector đang chạy ngầm!`
      );
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể kích hoạt tiến trình cắt sách.');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span className="material-symbols-outlined text-primary text-[22px]">
              document_scanner
            </span>
            <span>Quét Mục Lục AI</span>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {errorMessage && (
            <div className={styles.alertError}>
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Book Info Summary */}
          <div className={styles.tocBookInfoBox}>
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-outline uppercase tracking-wider">
                Sách giáo khoa đang chọn
              </div>
              <div className="text-base font-bold text-on-surface">{book.title}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={styles.badgeSubject}>{book.subject}</span>
              <span className={styles.badgeGrade}>{book.gradeLevel}</span>
              <span className={styles.badgeCurriculum}>{book.curriculumName}</span>
            </div>
          </div>

          {/* Step 1: Select PDF if not already present */}
          {!pdfFile && (
            <div className="space-y-1.5">
              <label className={styles.fieldLabel}>
                Chọn file PDF gốc từ máy tính <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfChange}
              />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePdfDrop}
                onClick={() => pdfInputRef.current?.click()}
                className={`w-full py-4 px-4 border-2 border-dashed rounded-xl text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  errorMessage?.includes('PDF')
                    ? 'border-red-400 bg-red-50/50 hover:bg-red-50'
                    : 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-[26px]">upload_file</span>
                <span className="font-bold text-primary">Bấm hoặc kéo thả file PDF sách giáo khoa vào đây</span>
                <span className="text-[11px] text-on-surface-variant font-normal">
                  File PDF sách gốc dùng để tính tổng số trang và cắt từng bài học tự động
                </span>
              </div>
            </div>
          )}

          {pdfFile && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-outline-variant text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-red-500 text-[20px]">
                  picture_as_pdf
                </span>
                <span className="font-bold text-on-surface truncate">{pdfFile.name}</span>
                <span className="text-outline">
                  ({(pdfFile.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
              </div>
              <button
                type="button"
                className="text-primary hover:underline font-semibold cursor-pointer"
                onClick={() => {
                  setPdfFile(null);
                  setAnalysisResult(null);
                }}
              >
                Đổi file PDF
              </button>
            </div>
          )}

          {/* Upload TOC Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={styles.fieldLabel}>
                Ảnh chụp trang mục lục sách ({tocImages.length} ảnh đã chọn) *
              </label>
              <span className="text-[11px] text-outline">
                Chụp rõ nét các trang mục lục để AI đọc chính xác nhất
              </span>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImagesChange}
            />

            <div
              className={styles.tocUploadCard}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImagesDrop}
              onClick={() => imageInputRef.current?.click()}
            >
              <span className="material-symbols-outlined text-primary text-[28px]">
                add_photo_alternate
              </span>
              <div className="text-xs font-bold text-on-surface">
                Bấm hoặc kéo thả ảnh chụp mục lục vào đây (hỗ trợ nhiều ảnh)
              </div>
              <div className="text-[11px] text-outline">
                Định dạng JPG, PNG hoặc WebP • Tối đa 10 MB / ảnh
              </div>
            </div>

            {/* Thumbnail Preview */}
            {tocImages.length > 0 && (
              <div className={styles.tocImageThumbnails}>
                {tocImages.map((img, idx) => (
                  <div key={idx} className={styles.tocImageThumb}>
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Mục lục ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extraction Method & Analyze Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-outline-variant/60">
            <div className="flex items-center gap-3">
              <label className={styles.fieldLabel}>Phương pháp:</label>
              <div className="inline-flex p-1 bg-surface-container rounded-xl border border-outline-variant text-xs">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    method === 'AI'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => setMethod('AI')}
                >
                  AI Gemini Vision
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    method === 'OCR'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => setMethod('OCR')}
                >
                  LlamaParse / OCR
                </button>
              </div>
            </div>

            <button
              type="button"
              className={styles.dropzoneUploadBtn}
              onClick={handleAnalyzeToc}
              disabled={isAnalyzing || isIngesting}
            >
              {isAnalyzing ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>AI đang phân tích mục lục...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Bắt đầu Phân Tích Mục Lục</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results Table */}
          {analysisResult && (
            <div className="space-y-4 pt-4 border-t border-outline-variant">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      toc
                    </span>
                    <span>Cấu trúc Mục lục Trích xuất bởi AI</span>
                  </h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Tổng số trang PDF: <strong>{analysisResult.pdfPageCount}</strong> • Độ lệch trang in:{' '}
                    <strong>{analysisResult.pdfPageOffset ?? 0} trang</strong>
                  </p>
                </div>
                <span className="text-[11px] text-outline italic">
                  * Bạn có thể bấm vào ô số trang để chỉnh sửa thủ công
                </span>
              </div>

              <div className={styles.tocTableWrapper}>
                <table className={styles.tocTable}>
                  <thead className={styles.tocThead}>
                    <tr>
                      <th className={styles.tocTh}>Tên Chương / Bài học</th>
                      <th className={`${styles.tocTh} text-center w-24`}>Trang bắt đầu</th>
                      <th className={`${styles.tocTh} text-center w-24`}>Trang kết thúc</th>
                      <th className={styles.tocTh}>Ghi chú AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.chapters.map((ch: TocChapterDraft, chIdx: number) => (
                      <>
                        <tr key={`ch-${chIdx}`} className={styles.tocRowChapter}>
                          <td colSpan={4} className={styles.tocTd}>
                            <div className="flex items-center gap-2 font-bold text-primary">
                              <span className="material-symbols-outlined text-[16px]">folder</span>
                              <span>{ch.chapterName}</span>
                            </div>
                          </td>
                        </tr>
                        {ch.lessons.map((ls, lsIdx) => (
                          <tr key={`ls-${chIdx}-${lsIdx}`} className={styles.tocRowLesson}>
                            <td className={`${styles.tocTd} pl-8`}>
                              <div className="flex items-center gap-2 font-medium">
                                <span className="material-symbols-outlined text-outline text-[15px]">
                                  article
                                </span>
                                <span>{ls.lessonName}</span>
                              </div>
                            </td>
                            <td className={`${styles.tocTd} text-center`}>
                              <input
                                type="number"
                                className={styles.tocPageInput}
                                value={ls.startPage ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                  handleUpdateLessonPage(chIdx, lsIdx, 'startPage', val);
                                }}
                              />
                            </td>
                            <td className={`${styles.tocTd} text-center`}>
                              <input
                                type="number"
                                className={styles.tocPageInput}
                                value={ls.endPage ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                  handleUpdateLessonPage(chIdx, lsIdx, 'endPage', val);
                                }}
                              />
                            </td>
                            <td className={styles.tocTd}>
                              {ls.warning ? (
                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                                  {ls.warning}
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                                  Hợp lệ
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.bookActionBtnOutline}
            onClick={onClose}
            disabled={isIngesting}
          >
            Đóng
          </button>

          {analysisResult && (
            <button
              type="button"
              className={styles.queueSaveBtn}
              onClick={handleConfirmAndIngest}
              disabled={isIngesting}
            >
              {isIngesting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang khởi chạy luồng Ingestion...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Xác nhận & Cắt Sách Tự Động (Extract & Ingest)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

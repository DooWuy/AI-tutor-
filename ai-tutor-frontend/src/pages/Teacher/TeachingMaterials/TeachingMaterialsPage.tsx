import { useState, useEffect, useCallback, useMemo } from 'react';
import { styles } from './TeachingMaterialsPage.styles';
import { curriculumApi } from '../../../services/curriculumApi';
import type {
  BookItem,
  PendingUploadBook,
} from './types/curriculum';
import { BookImportDropzone } from './components/BookImportDropzone';
import { ImportBatchQueue } from './components/ImportBatchQueue';
import { BookListSection } from './components/BookListSection';
import { TocScanModal } from './components/TocScanModal';
import { BookStructureDrawer } from './components/BookStructureDrawer';

export default function TeachingMaterialsPage() {
  // Existing Books State
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  // Import Queue State (multi-file)
  const [pendingBooks, setPendingBooks] = useState<PendingUploadBook[]>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Modals & Drawers State
  const [scanningBook, setScanningBook] = useState<BookItem | PendingUploadBook | null>(null);
  const [scanningPdfFile, setScanningPdfFile] = useState<File | undefined>(undefined);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const [structureBook, setStructureBook] = useState<BookItem | null>(null);
  const [isStructureDrawerOpen, setIsStructureDrawerOpen] = useState(false);

  // Feedback State
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch list of books
  const fetchBooks = useCallback(async () => {
    setIsLoadingBooks(true);
    setErrorMessage(null);
    try {
      const data = await curriculumApi.listBooks();
      setBooks(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể tải danh sách sách giáo khoa.'
      );
    } finally {
      setIsLoadingBooks(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Handlers for Queue
  const handleFilesAdded = (newBooks: PendingUploadBook[]) => {
    setPendingBooks((prev) => [...prev, ...newBooks]);
    setSuccessToast(
      `Đã nạp thành công ${newBooks.length} file sách vào hàng đợi! Hãy kiểm tra thông tin và sẵn sàng quét mục lục AI.`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleUpdatePendingBook = (id: string, updates: Partial<PendingUploadBook>) => {
    setPendingBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const handleRemovePendingBook = (id: string) => {
    setPendingBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleClearQueue = () => {
    if (pendingBooks.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ hàng đợi nhập sách?')) {
      setPendingBooks([]);
    }
  };

  // Helper to ensure a single pending book is persisted to DB
  const handleEnsureBookSaved = async (pending: PendingUploadBook): Promise<string> => {
    if (pending.savedBookId) return pending.savedBookId;

    const created = await curriculumApi.createBook({
      title: pending.title,
      subject: pending.subject,
      gradeLevel: pending.gradeLevel,
      curriculumName: pending.curriculumName,
    });

    handleUpdatePendingBook(pending.id, {
      status: 'SAVED',
      savedBookId: created.id,
    });

    fetchBooks();
    return created.id;
  };

  // Batch Save all pending books to DB
  const handleSaveBatch = async () => {
    if (pendingBooks.length === 0) return;

    setIsSavingBatch(true);
    setErrorMessage(null);

    let savedCount = 0;
    const errors: string[] = [];

    for (const pending of pendingBooks) {
      if (pending.status === 'SAVED') {
        savedCount++;
        continue;
      }

      handleUpdatePendingBook(pending.id, { status: 'SAVING' });

      try {
        const created = await curriculumApi.createBook({
          title: pending.title,
          subject: pending.subject,
          gradeLevel: pending.gradeLevel,
          curriculumName: pending.curriculumName,
        });

        handleUpdatePendingBook(pending.id, {
          status: 'SAVED',
          savedBookId: created.id,
        });
        savedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi lưu sách';
        handleUpdatePendingBook(pending.id, {
          status: 'ERROR',
          errorMessage: msg,
        });
        errors.push(`"${pending.title}": ${msg}`);
      }
    }

    setIsSavingBatch(false);
    fetchBooks();

    if (savedCount > 0) {
      setSuccessToast(`Đã lưu thành công ${savedCount} cuốn sách vào CSDL! Bạn có thể bắt đầu Quét Mục Lục AI ngay.`);
      setTimeout(() => setSuccessToast(null), 5000);
    }

    if (errors.length > 0) {
      setErrorMessage(`Một số sách chưa lưu được:\n${errors.join('\n')}`);
    }
  };

  // Open Scan TOC for a pending book in queue
  const handleOpenScanForPending = (pending: PendingUploadBook) => {
    setScanningBook(pending);
    setScanningPdfFile(pending.file);
    setIsScanModalOpen(true);
  };

  // Open Scan TOC for an existing book in DB
  const handleOpenScanForExisting = (book: BookItem) => {
    setScanningBook(book);
    setScanningPdfFile(undefined);
    setIsScanModalOpen(true);
  };

  // Open Book structure drawer
  const handleOpenStructure = async (book: BookItem) => {
    try {
      const fullBook = await curriculumApi.getBook(book.id!);
      setStructureBook(fullBook);
      setIsStructureDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load book structure:', err);
      setStructureBook(book); // Fallback to shallow book
      setIsStructureDrawerOpen(true);
    }
  };

  // Delete an existing book
  const handleDeleteBook = async (book: BookItem) => {
    try {
      await curriculumApi.deleteBook(book.id);
      setSuccessToast(`Đã xóa sách "${book.title}" thành công.`);
      setTimeout(() => setSuccessToast(null), 4000);
      fetchBooks();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể xóa sách.'
      );
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const totalChapters = books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0);
    const totalLessons = books.reduce(
      (acc, b) =>
        acc +
        (b.chapters?.reduce((chAcc, ch) => chAcc + (ch.lessons?.length || 0), 0) || 0),
      0
    );
    const pendingCount = pendingBooks.length;

    return { totalBooks, totalChapters, totalLessons, pendingCount };
  }, [books, pendingBooks]);

  return (
    <div className={styles.container}>
      {/* Toast Feedbacks */}
      {successToast && (
        <div className={styles.alertSuccess}>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span className="flex-1 whitespace-pre-line">{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="hover:opacity-75 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className={styles.alertError}>
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span className="flex-1 whitespace-pre-line">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="hover:opacity-75 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerBadge}>
            <span className="material-symbols-outlined text-[15px]">auto_stories</span>
            <span>Hệ Thống Tri Thức RAG & Giáo Trình Chuẩn</span>
          </div>
          <h2 className={styles.headerTitle}>
            Tài liệu giảng dạy & Quản lý Giáo trình
          </h2>
          <p className={styles.headerSubtitle}>
            Số hóa tài liệu và sách giáo khoa PDF theo chuẩn Bộ GD&ĐT, tự động phân tích mục lục bằng AI và nạp tri thức vector hóa phục vụ gia sư ảo AI Tutor.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerPrimaryBtn}
            onClick={() => {
              const dropzoneElem = document.getElementById('book-dropzone-section');
              dropzoneElem?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Import Sách Giáo Khoa (PDF)</span>
          </button>

          <button
            type="button"
            className={styles.headerSecondaryBtn}
            onClick={fetchBooks}
            disabled={isLoadingBooks}
          >
            <span className={`material-symbols-outlined text-[18px] ${isLoadingBooks ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>Đồng bộ CSDL</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox}>
            <span className="material-symbols-outlined text-[24px]">library_books</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Sách Giáo Khoa</div>
            <div className={styles.statValue}>{stats.totalBooks}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBoxSecondary}>
            <span className="material-symbols-outlined text-[24px]">folder</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Chương học</div>
            <div className={styles.statValue}>{stats.totalChapters}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBoxEmerald}>
            <span className="material-symbols-outlined text-[24px]">menu_book</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Bài học số hóa</div>
            <div className={styles.statValue}>{stats.totalLessons}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBoxAmber}>
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Sách chờ scan</div>
            <div className={styles.statValue}>{stats.pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Import Section: Khung nhập liệu & Nút import Book dạng PDF */}
      <div id="book-dropzone-section" className={styles.importSectionCard}>
        <div className={styles.importSectionHeader}>
          <div>
            <h3 className={styles.importSectionTitle}>
              <span className="material-symbols-outlined text-primary text-[22px]">
                file_upload
              </span>
              <span>Khung Nhập Liệu Sách Giáo Khoa (PDF Import)</span>
            </h3>
            <p className={styles.importSectionSubtitle}>
              Kéo thả hoặc chọn 1 hoặc nhiều file PDF cùng lúc từ máy tính của bạn để bắt đầu quy trình bóc tách mục lục và vector hóa.
            </p>
          </div>
        </div>

        {/* Dropzone Component */}
        <BookImportDropzone
          onFilesAdded={handleFilesAdded}
          onError={(err) => setErrorMessage(err)}
        />

        {/* Queue of selected PDF files */}
        <ImportBatchQueue
          pendingBooks={pendingBooks}
          onUpdateBook={handleUpdatePendingBook}
          onRemoveBook={handleRemovePendingBook}
          onClearQueue={handleClearQueue}
          onSaveBatch={handleSaveBatch}
          onOpenScanForBook={handleOpenScanForPending}
          isSaving={isSavingBatch}
        />
      </div>

      {/* Existing Books in Database */}
      <BookListSection
        books={books}
        isLoading={isLoadingBooks}
        onRefresh={fetchBooks}
        onOpenStructure={handleOpenStructure}
        onOpenScanModal={handleOpenScanForExisting}
        onDeleteBook={handleDeleteBook}
      />

      {/* Modal Quét Mục Lục AI (Issue 7 Integration) */}
      {scanningBook && (
        <TocScanModal
          book={scanningBook}
          pdfFile={scanningPdfFile}
          isOpen={isScanModalOpen}
          onClose={() => {
            setIsScanModalOpen(false);
            setScanningBook(null);
            setScanningPdfFile(undefined);
          }}
          onSuccess={(msg) => {
            setSuccessToast(msg);
            setTimeout(() => setSuccessToast(null), 6000);
            fetchBooks();
          }}
          onEnsureBookSaved={handleEnsureBookSaved}
        />
      )}

      {/* Drawer Cây cấu trúc Sách -> Chương -> Bài học */}
      <BookStructureDrawer
        book={structureBook}
        isOpen={isStructureDrawerOpen}
        onClose={() => {
          setIsStructureDrawerOpen(false);
          setStructureBook(null);
        }}
        onScanToc={(b) => {
          handleOpenScanForExisting(b);
        }}
      />
    </div>
  );
}

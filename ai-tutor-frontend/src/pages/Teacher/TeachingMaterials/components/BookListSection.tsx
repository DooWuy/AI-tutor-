import { useState, useMemo } from 'react';
import { styles } from '../TeachingMaterialsPage.styles';
import {
  SUBJECT_OPTIONS,
  GRADE_OPTIONS,
  type BookItem,
} from '../types/curriculum';

interface BookListSectionProps {
  books: BookItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenStructure: (book: BookItem) => void;
  onOpenScanModal: (book: BookItem) => void;
  onDeleteBook: (book: BookItem) => Promise<void>;
}

export function BookListSection({
  books,
  isLoading,
  onRefresh,
  onOpenStructure,
  onOpenScanModal,
  onDeleteBook,
}: BookListSectionProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter books based on criteria
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        searchKeyword.trim() === '' ||
        b.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        b.curriculumName.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchSubject = selectedSubject === 'ALL' || b.subject === selectedSubject;
      const matchGrade = selectedGrade === 'ALL' || b.gradeLevel === selectedGrade;

      return matchSearch && matchSubject && matchGrade;
    });
  }, [books, searchKeyword, selectedSubject, selectedGrade]);

  const handleDelete = async (book: BookItem) => {
    const hasChapters = (book.chapters?.length || 0) > 0;
    if (hasChapters) {
      alert(
        'Không thể xóa sách đang chứa các chương và bài học bên trong (Quy tắc AC-07). Vui lòng dọn dẹp nội dung con trước khi xóa sách.'
      );
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa sách "${book.title}" khỏi hệ thống?`)) {
      return;
    }

    setDeletingId(book.id);
    try {
      await onDeleteBook(book);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.booksSectionCard}>
      {/* Header */}
      <div className={styles.booksSectionHeader}>
        <div>
          <h3 className={styles.booksSectionTitle}>
            <span className="material-symbols-outlined text-primary text-[22px]">library_books</span>
            <span>Kho Sách Giáo Khoa Đã Nạp ({filteredBooks.length} cuốn)</span>
          </h3>
          <p className={styles.booksSectionSubtitle}>
            Các tài liệu chuẩn được liên kết trực tiếp vào hệ thống RAG và mô hình AI Tutor để hỗ trợ học sinh học tập chuẩn Bộ GD&ĐT.
          </p>
        </div>

        <button
          type="button"
          className={styles.bookActionBtnOutline}
          onClick={onRefresh}
          disabled={isLoading}
        >
          <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className={styles.filterRow}>
        <div className={styles.filterLeft}>
          {/* Search Box */}
          <div className={styles.filterSearchBox}>
            <span className={styles.filterSearchIcon}>search</span>
            <input
              type="text"
              placeholder="Tìm theo tên sách, bộ sách..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className={styles.filterSearchInput}
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">Tất cả Môn học</option>
            {SUBJECT_OPTIONS.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">Tất cả Khối lớp</option>
            {GRADE_OPTIONS.map((gr) => (
              <option key={gr} value={gr}>
                {gr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-primary text-[36px] animate-spin">
            progress_activity
          </span>
          <span className="text-xs font-semibold">Đang tải danh sách sách giáo khoa...</span>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-outline-variant rounded-2xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-container mx-auto flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[32px]">auto_stories</span>
          </div>
          <div className="text-sm font-bold text-on-surface">Không tìm thấy sách giáo khoa nào</div>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            {books.length === 0
              ? 'Hệ thống chưa có sách giáo khoa nào. Hãy sử dụng khung nhập liệu ở trên để import file PDF sách giáo khoa đầu tiên!'
              : 'Không có sách nào khớp với bộ lọc tìm kiếm hiện tại.'}
          </p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {filteredBooks.map((book) => {
            const chapterCount = book.chapters?.length || 0;
            const lessonCount =
              book.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;

            return (
              <div key={book.id} className={styles.bookCard}>
                <div className={styles.bookCardTop}>
                  <div className={styles.bookCardBadges}>
                    <span className={styles.badgeSubject}>{book.subject}</span>
                    <span className={styles.badgeGrade}>{book.gradeLevel}</span>
                    <span className={styles.badgeCurriculum} title={book.curriculumName}>
                      {book.curriculumName}
                    </span>
                  </div>

                  <h4 className={styles.bookCardTitle} title={book.title}>
                    {book.title}
                  </h4>

                  <div className={styles.bookCardStats}>
                    <span className={styles.bookStatItem}>
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        folder
                      </span>
                      <span>{chapterCount} chương</span>
                    </span>
                    <span className={styles.bookStatItem}>
                      <span className="material-symbols-outlined text-[15px] text-primary">
                        menu_book
                      </span>
                      <span>{lessonCount} bài học</span>
                    </span>
                  </div>
                </div>

                <div className={styles.bookCardFooter}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={styles.bookActionBtnOutline}
                      onClick={() => onOpenStructure(book)}
                      title="Xem cấu trúc chương & bài"
                    >
                      <span className="material-symbols-outlined text-[15px]">account_tree</span>
                      <span>Cấu trúc</span>
                    </button>

                    <button
                      type="button"
                      className={styles.bookActionBtnPrimary}
                      onClick={() => onOpenScanModal(book)}
                      title="Quét lại mục lục bằng AI"
                    >
                      <span className="material-symbols-outlined text-[15px]">document_scanner</span>
                      <span>Quét Mục Lục AI</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.bookDeleteBtn}
                    onClick={() => handleDelete(book)}
                    disabled={deletingId === book.id}
                    title="Xóa sách"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

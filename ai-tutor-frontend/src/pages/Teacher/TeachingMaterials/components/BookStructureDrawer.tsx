import { styles } from '../TeachingMaterialsPage.styles';
import type { BookItem } from '../types/curriculum';

interface BookStructureDrawerProps {
  book: BookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onScanToc: (book: BookItem) => void;
}

export function BookStructureDrawer({
  book,
  isOpen,
  onClose,
  onScanToc,
}: BookStructureDrawerProps) {
  if (!isOpen || !book) return null;

  const totalLessons =
    book.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawerDialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">
              account_tree
            </span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">Cấu Trúc Khung Giáo Trình</h3>
              <p className="text-[11px] text-on-surface-variant truncate max-w-sm">
                {book.title}
              </p>
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.drawerBody}>
          {/* Metadata Card */}
          <div className={styles.tocBookInfoBox}>
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-outline uppercase tracking-wider">
                Thông tin xuất bản & chương trình
              </div>
              <div className="text-sm font-bold text-on-surface">{book.title}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={styles.badgeSubject}>{book.subject}</span>
              <span className={styles.badgeGrade}>{book.gradeLevel}</span>
              <span className={styles.badgeCurriculum}>{book.curriculumName}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant border-b border-outline-variant/60 pb-2">
            <span>
              Tổng số chương: <strong>{book.chapters?.length || 0}</strong> • Tổng số bài học:{' '}
              <strong>{totalLessons}</strong>
            </span>
            <button
              type="button"
              className={styles.scanActionBtn}
              onClick={() => {
                onClose();
                onScanToc(book);
              }}
            >
              <span className="material-symbols-outlined text-[15px]">document_scanner</span>
              <span>Quét Lại Mục Lục AI</span>
            </button>
          </div>

          {/* Chapters & Lessons Tree */}
          {(!book.chapters || book.chapters.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-outline-variant rounded-xl space-y-2">
              <span className="material-symbols-outlined text-outline text-[32px]">
                auto_stories
              </span>
              <div className="text-xs font-bold text-on-surface">
                Sách này chưa có cấu trúc Chương & Bài học
              </div>
              <p className="text-[11px] text-on-surface-variant max-w-xs mx-auto">
                Hãy sử dụng tính năng <strong>Quét Mục Lục AI</strong> để tự động trích xuất các chương và bài học từ file sách giáo khoa.
              </p>
              <button
                type="button"
                className={`${styles.dropzoneUploadBtn} mt-2 inline-flex`}
                onClick={() => {
                  onClose();
                  onScanToc(book);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">document_scanner</span>
                <span>Quét Mục Lục Ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {book.chapters.map((ch, idx) => (
                <div
                  key={ch.id || idx}
                  className="rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-2xs"
                >
                  <div className="p-3 bg-surface-container-high/60 flex items-center justify-between font-bold text-xs text-primary">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">folder_open</span>
                      <span>{ch.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                      {ch.lessons?.length || 0} bài học
                    </span>
                  </div>

                  {ch.lessons && ch.lessons.length > 0 && (
                    <div className="p-2 divide-y divide-outline-variant/30">
                      {ch.lessons.map((ls, lIdx) => (
                        <div
                          key={ls.id || lIdx}
                          className="py-2 px-3 flex items-center justify-between text-xs hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-center gap-2 text-on-surface font-medium">
                            <span className="material-symbols-outlined text-outline text-[16px]">
                              menu_book
                            </span>
                            <span>{ls.title}</span>
                          </div>
                          <span className="text-[10px] text-outline font-semibold">
                            {ls.lessonCode || `Bài ${lIdx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Layers,
  Book,
  RefreshCw,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { curriculumApi } from '../../../../services/curriculumApi';
import type { BookItem } from '../../../Teacher/TeachingMaterials/types/curriculum';

export const DocumentTextbooksTab: React.FC = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await curriculumApi.listBooks(
        subjectFilter === 'ALL' ? undefined : subjectFilter,
        gradeFilter === 'ALL' ? undefined : gradeFilter
      );
      setBooks(data || []);
      if (selectedBook && data) {
        const refreshed = data.find((b) => b.id === selectedBook.id);
        if (refreshed) setSelectedBook(refreshed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách sách giáo khoa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [subjectFilter, gradeFilter]);

  const filteredBooks = books.filter((book) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      (book.curriculumName && book.curriculumName.toLowerCase().includes(query)) ||
      book.subject.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sách, chương trình, môn học…"
            className="w-full min-h-11 rounded-xl border border-outline-variant bg-surface pl-9 pr-3 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="min-h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="ALL">Tất cả môn học</option>
            <option value="TOAN">Toán học</option>
            <option value="VAN">Ngữ văn</option>
            <option value="ANH">Tiếng Anh</option>
            <option value="LY">Vật lý</option>
            <option value="HOA">Hóa học</option>
            <option value="SINH">Sinh học</option>
            <option value="SU">Lịch sử</option>
            <option value="DIA">Địa lý</option>
            <option value="TIN">Tin học</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="min-h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="ALL">Tất cả khối lớp</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
              <option key={g} value={g}>
                Khối {g}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchBooks}
            className="min-h-11 inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-600">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchBooks}
            className="font-semibold underline hover:text-rose-800"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 animate-pulse"
            />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
          <BookOpen size={40} className="mx-auto text-on-surface-variant opacity-50 mb-3" />
          <h3 className="text-sm font-bold text-on-surface">Không tìm thấy sách giáo khoa nào</h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            Hãy điều chỉnh bộ lọc hoặc bổ sung sách giáo khoa chuẩn qua Curriculum Service.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const isSelected = selectedBook?.id === book.id;
            const lessonCount = (book.chapters || []).reduce((acc, c) => acc + (c.lessons?.length || 0), 0);

            return (
              <div
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className={`group relative rounded-2xl border bg-surface-container-lowest p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'border-outline-variant hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-primary/10 to-primary/20 text-primary border border-primary/20">
                    <Book size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-primary-fixed px-2 py-0.5 text-[10px] font-bold text-on-primary-fixed uppercase">
                        {book.subject}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant border border-outline-variant">
                        Khối {book.gradeLevel}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-sm font-bold text-on-surface leading-snug line-clamp-2">
                      {book.title}
                    </h4>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Layers size={13} />
                      {book.chapters?.length || 0} chương
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileCheck size={13} />
                      {lessonCount} bài học
                    </span>
                  </div>
                  {book.curriculumName && (
                    <span className="truncate max-w-[120px] text-[11px]" title={book.curriculumName}>
                      {book.curriculumName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book details slide-down when selected */}
      {selectedBook && (
        <div className="rounded-2xl border border-primary/30 bg-surface-container-lowest p-6 shadow-md doc-slide-up space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-on-primary">
                  {selectedBook.subject}
                </span>
                <span className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-on-surface border border-outline-variant">
                  Khối {selectedBook.gradeLevel}
                </span>
                {selectedBook.curriculumName && (
                  <span className="text-xs text-on-surface-variant">Bộ sách: {selectedBook.curriculumName}</span>
                )}
              </div>
              <h3 className="text-base font-bold text-on-surface">{selectedBook.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBook(null)}
              className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface text-xs font-semibold"
            >
              Đóng chi tiết
            </button>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Cấu trúc chương & mục lục ({selectedBook.chapters?.length || 0} chương)
            </h4>
            {selectedBook.chapters && selectedBook.chapters.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto doc-scrollbar pr-1">
                {selectedBook.chapters.map((chap, cIdx) => (
                  <div
                    key={chap.id || cIdx}
                    className="rounded-xl border border-outline-variant/60 bg-surface p-3 text-xs"
                  >
                    <div className="font-semibold text-on-surface flex items-center justify-between">
                      <span>
                        Chương {cIdx + 1}: {chap.title}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-normal">
                        {chap.lessons?.length || 0} bài học
                      </span>
                    </div>
                    {chap.lessons && chap.lessons.length > 0 && (
                      <ul className="mt-2 pl-4 space-y-1 text-on-surface-variant list-disc text-[11px]">
                        {chap.lessons.map((les, lIdx) => (
                          <li key={les.id || lIdx}>
                            Bài {lIdx + 1}: {les.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">
                Chưa có cấu trúc bài học chi tiết được nạp cho sách này.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Link, RefreshCw, Search, X } from 'lucide-react';
import { skillApi, SkillApiError } from '../../../../services/skillApi';
import { useToast } from '../../../../context/ToastContext';
import type { LessonSummary, SkillItem } from '../../../../types/skills';

interface LessonAssignModalProps {
  isOpen: boolean;
  skill: SkillItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function LessonAssignModal({ isOpen, skill, onClose, onSuccess }: LessonAssignModalProps) {
  const { toast } = useToast();

  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !skill) return;

    setLoading(true);
    setErrorMessage(null);
    setSearch('');

    Promise.all([
      skillApi.getAvailableLessons(skill.id),
      skillApi.getAssignedLessons(skill.id),
    ])
      .then(([available, assigned]) => {
        setLessons(available);
        setSelectedIds(new Set(assigned.map((l) => l.id)));
      })
      .catch((err: unknown) => {
        const msg = err instanceof SkillApiError ? err.message : 'Không thể tải danh sách bài học';
        setErrorMessage(msg);
      })
      .finally(() => setLoading(false));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, skill, onClose]);

  const filteredLessons = useMemo(() => {
    if (!search.trim()) return lessons;
    const term = search.toLowerCase();
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        (l.chapterTitle && l.chapterTitle.toLowerCase().includes(term)) ||
        (l.bookTitle && l.bookTitle.toLowerCase().includes(term)) ||
        l.lessonCode.toLowerCase().includes(term)
    );
  }, [lessons, search]);

  if (!isOpen || !skill) return null;

  const toggleLesson = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredLessons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLessons.map((l) => l.id)));
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setErrorMessage(null);
      await skillApi.assignLessons(skill.id, Array.from(selectedIds));
      toast.success(`Đã cập nhật ${selectedIds.size} bài học liên kết cho kỹ năng "${skill.skillCode}"`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof SkillApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Không thể lưu liên kết bài học. Vui lòng thử lại.');
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
      <div className="w-full max-w-2xl rounded-2xl bg-surface border border-outline-variant shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
              <Link size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                Liên kết Bài học SGK (Lesson Mapping)
              </h2>
              <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                Kỹ năng: <span className="font-mono font-bold text-primary">{skill.skillCode}</span> - {skill.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-500">
            {errorMessage}
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm bài học, chương, sách giáo khoa..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-9 pr-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            {selectedIds.size === filteredLessons.length && filteredLessons.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>

        {/* Lessons List Container */}
        <div className="flex-1 overflow-y-auto border border-outline-variant/60 rounded-xl divide-y divide-outline-variant/40 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-on-surface-variant">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span className="text-xs">Đang tải danh sách bài học khả dụng...</span>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-1 text-on-surface-variant">
              <BookOpen size={28} className="opacity-40" />
              <span className="text-xs font-semibold">Không tìm thấy bài học nào phù hợp.</span>
              <span className="text-[11px] text-outline">
                {lessons.length === 0
                  ? 'Chưa có bài học nào trong môn học và khối lớp này. Vui lòng nạp sách SGK trước.'
                  : 'Thử tìm với từ khóa khác.'}
              </span>
            </div>
          ) : (
            filteredLessons.map((lesson) => {
              const isSelected = selectedIds.has(lesson.id);
              return (
                <div
                  key={lesson.id}
                  onClick={() => toggleLesson(lesson.id)}
                  className={`flex items-start gap-3 p-3 text-xs cursor-pointer transition-colors select-none ${
                    isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent onClick
                    className="mt-0.5 h-4 w-4 rounded border-outline-variant text-[#004bb5] focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                        {lesson.lessonCode}
                      </span>
                      <span className="font-bold text-on-surface truncate">{lesson.title}</span>
                    </div>
                    {(lesson.chapterTitle || lesson.bookTitle) && (
                      <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                        {lesson.chapterTitle && <span>{lesson.chapterTitle} • </span>}
                        {lesson.bookTitle && <span className="text-outline">{lesson.bookTitle}</span>}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-outline-variant/60 pt-3">
          <span className="text-xs text-on-surface-variant">
            Đã chọn <strong className="text-primary">{selectedIds.size}</strong> bài học liên kết
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-outline-variant px-4 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004bb5] to-[#2575fc] px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-[#004bb5]/25 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Lưu liên kết</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Zap,
} from 'lucide-react';
import { skillApi, SkillApiError } from '../../../services/skillApi';
import { getSubjectColor } from '../../../utils/subjectColorUtils';
import { useToast } from '../../../context/ToastContext';
import type { PageResponseDTO, SkillFilterParams, SkillItem } from '../../../types/skills';
import { SkillFormModal } from './components/SkillFormModal';
import { LessonAssignModal } from './components/LessonAssignModal';
import { DeleteSkillModal } from './components/DeleteSkillModal';

const SUBJECT_OPTIONS = ['Tất cả môn học', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Tin học', 'Lịch sử', 'Địa lí'];
const GRADE_OPTIONS = [
  { label: 'Tất cả khối lớp', value: '' },
  { label: 'Lớp 10', value: '10' },
  { label: 'Lớp 11', value: '11' },
  { label: 'Lớp 12', value: '12' },
];

export function SkillsManagementPage() {
  const { toast } = useToast();

  const [data, setData] = useState<PageResponseDTO<SkillItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('code');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<SkillItem | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSkill, setAssignSkill] = useState<SkillItem | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSkill, setDeleteSkill] = useState<SkillItem | null>(null);

  // Debounced search trigger
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedKeyword(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handler);
  }, [search]);

  // Load skills list
  const loadSkills = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const params: SkillFilterParams = {
        keyword: debouncedKeyword || undefined,
        subject: subject && subject !== 'Tất cả môn học' ? subject : undefined,
        gradeLevel: gradeLevel || undefined,
        page,
        size: 15,
        sort,
        direction,
      };
      const res = await skillApi.searchSkills(params);
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof SkillApiError ? err.message : 'Không thể tải danh sách kỹ năng. Hãy đảm bảo Backend đang chạy.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, subject, gradeLevel, page, sort, direction]);

  const handleOpenCreate = () => {
    setEditSkill(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (skill: SkillItem) => {
    setEditSkill(skill);
    setFormModalOpen(true);
  };

  const handleOpenAssign = (skill: SkillItem) => {
    setAssignSkill(skill);
    setAssignModalOpen(true);
  };

  const handleOpenDelete = (skill: SkillItem) => {
    setDeleteSkill(skill);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-[#004bb5] to-[#2575fc] text-white shadow-md shadow-[#004bb5]/20 ring-1 ring-white/20">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface">
              Quản lý Kỹ năng Thích ứng (Skills Map)
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Thiết lập bản đồ kỹ năng học tập, trọng số thuật toán thích ứng và liên kết với bài học SGK
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004bb5] to-[#2575fc] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#004bb5]/25 hover:opacity-95 active:scale-95 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus size={16} />
          <span>Thêm Kỹ năng mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-surface p-4 rounded-2xl border border-outline-variant/60 shadow-xs">
        {/* Search Input */}
        <div className="sm:col-span-5 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã kỹ năng (MATH_DER_01) hoặc tên..."
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-2 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Subject Filter */}
        <div className="sm:col-span-3">
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt} value={opt === 'Tất cả môn học' ? '' : opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Filter */}
        <div className="sm:col-span-2">
          <select
            value={gradeLevel}
            onChange={(e) => {
              setGradeLevel(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div className="sm:col-span-2">
          <select
            value={`${sort}-${direction}`}
            onChange={(e) => {
              const [s, d] = e.target.value.split('-');
              setSort(s);
              setDirection(d as 'asc' | 'desc');
            }}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none"
          >
            <option value="code-asc">Mã A-Z</option>
            <option value="importance-desc">Độ quan trọng cao</option>
            <option value="masteryThreshold-desc">Ngưỡng thành thạo cao</option>
            <option value="createdAt-desc">Mới nhất</option>
          </select>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-600 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={loadSkills}
            className="inline-flex items-center gap-1 font-bold text-red-600 underline hover:no-underline"
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* Data Table Container */}
      <div className="rounded-2xl border border-outline-variant/60 bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface-container-lowest/80 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4">Mã Kỹ năng</th>
                <th className="py-3 px-4">Tên & Mô tả</th>
                <th className="py-3 px-3">Môn & Khối</th>
                <th className="py-3 px-3 text-center">Độ quan trọng</th>
                <th className="py-3 px-3 text-center">Ngưỡng đạt</th>
                <th className="py-3 px-3 text-center">Lượt thử</th>
                <th className="py-3 px-3 text-center">Bỏ qua</th>
                <th className="py-3 px-3 text-center">Bài học SGK</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-on-surface-variant">
                    <div className="inline-flex flex-col items-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-primary" />
                      <span className="font-semibold text-xs">Đang tải danh sách kỹ năng...</span>
                    </div>
                  </td>
                </tr>
              ) : !data || data.content.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-on-surface-variant">
                    <div className="inline-flex flex-col items-center gap-2">
                      <Zap size={32} className="opacity-30" />
                      <span className="font-bold text-sm">Chưa có kỹ năng nào được tạo</span>
                      <p className="text-xs text-outline max-w-sm">
                        Hãy nhấn nút <strong>"Thêm Kỹ năng mới"</strong> để thiết lập kỹ năng rèn luyện thích ứng đầu tiên.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.content.map((skill) => {
                  const subjectColor = getSubjectColor(skill.subject || 'Toán');
                  const thresholdPercent = Math.round((skill.masteryThreshold ?? 0.85) * 100);

                  return (
                    <tr key={skill.id} className="hover:bg-surface-container/50 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        <span className="inline-block bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[11px]">
                          {skill.skillCode}
                        </span>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-on-surface truncate">{skill.name}</div>
                        {skill.description ? (
                          <p className="text-[11px] text-on-surface-variant truncate mt-0.5" title={skill.description}>
                            {skill.description}
                          </p>
                        ) : (
                          <span className="text-[11px] text-outline italic">Không có mô tả</span>
                        )}
                      </td>

                      {/* Subject & Grade */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: `${subjectColor}15`,
                              color: subjectColor,
                              border: `1px solid ${subjectColor}35`,
                            }}
                          >
                            {skill.subject || 'Toán'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-semibold">
                            Lớp {skill.gradeLevel || '12'}
                          </span>
                        </div>
                      </td>

                      {/* Importance */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-[#004bb5] bg-[#004bb5]/10 px-2 py-0.5 rounded-md">
                          <Star size={11} className="fill-[#004bb5]" />
                          {skill.importance ?? 5}/10
                        </span>
                      </td>

                      {/* Mastery Threshold */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-emerald-600 text-[11px]">{thresholdPercent}%</span>
                          <div className="w-12 h-1 bg-surface-container rounded-full overflow-hidden mt-0.5">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${thresholdPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Min Attempts */}
                      <td className="py-3.5 px-3 text-center font-semibold text-on-surface">
                        {skill.minAttempts ?? 3} câu
                      </td>

                      {/* Can Skip */}
                      <td className="py-3.5 px-3 text-center">
                        {skill.canSkip ? (
                          <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            Có
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-semibold text-on-surface-variant bg-surface-container border border-outline-variant px-2 py-0.5 rounded-full">
                            Không
                          </span>
                        )}
                      </td>

                      {/* Assigned Lessons */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAssign(skill)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-outline-variant hover:border-primary hover:bg-primary/5 text-on-surface transition-all text-[11px]"
                          title="Bấm để gán bài học SGK"
                        >
                          <BookOpen size={12} className="text-primary" />
                          <span className="font-bold text-primary">{skill.assignedLessonCount || 0}</span>
                          <span className="text-[10px] text-on-surface-variant">bài</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(skill)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
                            title="Liên kết bài học SGK"
                          >
                            <LinkIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(skill)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                            title="Chỉnh sửa thông tin kỹ năng"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(skill)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            title="Xóa kỹ năng"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant/60 px-4 py-3 bg-surface-container-lowest/50 text-xs">
            <span className="text-on-surface-variant">
              Hiển thị trang <strong className="text-on-surface">{data.page}</strong> / {data.totalPages} (Tổng số{' '}
              <strong className="text-on-surface">{data.totalElements}</strong> kỹ năng)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.hasPrevious}
                className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={!data.hasNext}
                className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SkillFormModal
        isOpen={formModalOpen}
        skill={editSkill}
        onClose={() => setFormModalOpen(false)}
        onSuccess={loadSkills}
      />

      <LessonAssignModal
        isOpen={assignModalOpen}
        skill={assignSkill}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={loadSkills}
      />

      <DeleteSkillModal
        isOpen={deleteModalOpen}
        skill={deleteSkill}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={loadSkills}
      />
    </div>
  );
}
export default SkillsManagementPage;

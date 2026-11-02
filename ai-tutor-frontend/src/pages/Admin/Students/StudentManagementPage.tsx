import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Filter,
  Flame,
  GraduationCap,
  Home,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Unlock,
  UserCheck,
  UserX,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { fetchStudents } from '../../../services/adminStudentApi';
import { analyticsApi } from '../../../services/analyticsApi';
import { useToast } from '../../../context/ToastContext';
import type { ClassOption } from '../../Teacher/Analytics/types/analytics';
import type {
  AdminStudentListItem,
  AdminStudentListParams,
  PageResponse,
  StudentSortField,
} from '../../../types/adminStudent';
import { AddStudentModal } from './components/AddStudentModal';
import { EditStudentModal } from './components/EditStudentModal';
import { LockUnlockDialog } from './components/LockUnlockDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import './StudentManagementPage.css';

const initialParams: AdminStudentListParams = {
  page: 1,
  size: 20,
  sort: 'createdAt',
  direction: 'desc',
};

const sortOptions = [
  { label: 'Mới nhất', sort: 'createdAt' as StudentSortField, direction: 'desc' as const },
  { label: 'Tên A–Z', sort: 'fullName' as StudentSortField, direction: 'asc' as const },
  { label: 'XP cao nhất', sort: 'totalXp' as StudentSortField, direction: 'desc' as const },
  { label: 'Hoạt động gần đây', sort: 'lastActivityDate' as StudentSortField, direction: 'desc' as const },
];

const numberFormatter = new Intl.NumberFormat('vi-VN');

function formatDate(value: string | null, fallback = '—') {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString('vi-VN');
}

export function StudentManagementPage() {
  const [params, setParams] = useState<AdminStudentListParams>(initialParams);
  const [search, setSearch] = useState('');
  const [school, setSchool] = useState('');
  const [data, setData] = useState<PageResponse<AdminStudentListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  // Classes filter
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesError, setClassesError] = useState('');
  const [classesLoading, setClassesLoading] = useState(true);
  const [classRetry, setClassRetry] = useState(0);

  // Modals & Dialogs state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminStudentListItem | null>(null);
  const [lockTarget, setLockTarget] = useState<AdminStudentListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStudentListItem | null>(null);

  // Toast & Copy
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(text);
    } else {
      toast.error(text);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info(`Đã sao chép mã ${code}`);
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  // Debounced search (300ms)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setParams((prev) =>
        prev.search === search.trim() && prev.schoolName === school.trim()
          ? prev
          : { ...prev, search: search.trim(), schoolName: school.trim(), page: 1 }
      );
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, school]);

  // Load Classes Filter
  useEffect(() => {
    let disposed = false;
    setClassesLoading(true);
    setClassesError('');
    analyticsApi
      .getFilters()
      .then((res) => {
        if (!disposed) setClasses(res.classes);
      })
      .catch(() => {
        if (!disposed) setClassesError('Không thể tải bộ lọc lớp.');
      })
      .finally(() => {
        if (!disposed) setClassesLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [classRetry]);

  // Load Students List
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchStudents(params, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.totalPages > 0 && (params.page || 1) > res.totalPages) {
          setParams((prev) => ({ ...prev, page: res.totalPages }));
          return;
        }
        setData(res);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params, retry]);

  const filter = (patch: Partial<AdminStudentListParams>) => {
    setParams((prev) => ({ ...prev, ...patch, page: 1 }));
  };

  const reset = () => {
    setSearch('');
    setSchool('');
    setParams({ ...initialParams, size: params.size });
  };

  const hasFilterActive = Boolean(
    search.trim() || school.trim() || params.active !== undefined || params.gradeLevel || params.classId
  );
  const pendingSearch = search.trim() !== (params.search || '') || school.trim() !== (params.schoolName || '');
  const busy = loading || pendingSearch;
  const page = params.page || 1;
  const size = params.size || 20;
  const total = data?.totalElements || 0;
  const visibleClasses = classes.filter((item) => !params.gradeLevel || item.gradeLevel === params.gradeLevel);
  const sortIndex = Math.max(
    0,
    sortOptions.findIndex((opt) => opt.sort === params.sort && opt.direction === params.direction)
  );

  // Executive summary metrics (calculated from current page & total counts)
  const summary = useMemo(() => {
    const items = data?.content || [];
    const activeCount = items.filter((s) => s.active).length;
    const lockedCount = items.filter((s) => !s.active).length;
    const totalXpSum = items.reduce((acc, curr) => acc + (curr.totalXp || 0), 0);
    const avgXp = items.length > 0 ? Math.round(totalXpSum / items.length) : 0;
    const activeStreakCount = items.filter((s) => (s.currentStreak || 0) > 0).length;

    return {
      activeCount,
      lockedCount,
      avgXp,
      activeStreakCount,
    };
  }, [data]);

  const selectedClassName = classes.find((c) => c.id === params.classId)?.name;

  return (
    <section className="space-y-6 pb-12 font-sans" aria-labelledby="student-management-title">
      {/* 1. Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant/80" aria-label="Breadcrumb">
        <Link to="/admin" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Home size={13} />
          <span>Quản trị hệ thống</span>
        </Link>
        <span className="text-outline-variant">/</span>
        <span className="hover:text-primary transition-colors">Học sinh</span>
        <span className="text-outline-variant">/</span>
        <strong className="text-on-surface font-semibold">Danh sách học sinh</strong>
      </nav>

      {/* 2. Page Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 id="student-management-title" className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Quản lý học sinh
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={12} />
              <span>Hệ thống AI Tutor</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
            Theo dõi tài khoản, phân lớp, tiến trình gamification (XP, Level, Streak) và kiểm soát truy cập an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Tải lại danh sách"
          >
            <RefreshCw size={14} className={busy ? 'animate-spin text-primary' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* 3. Executive Summary Strip (Mục 5.1 & 7.5 SRS & UI/UX Requirements) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students Card */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tổng học sinh</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
              {busy ? '…' : numberFormatter.format(total)}
            </strong>
            <span className="text-xs text-on-surface-variant font-medium">tài khoản</span>
          </div>
          <div className="mt-1 text-[11px] text-on-surface-variant/80 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>Toàn hệ thống trường lớp</span>
          </div>
        </div>

        {/* Active Students Card */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs transition-all hover:border-emerald-500/40 hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đang hoạt động</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {busy ? '…' : summary.activeCount}
            </strong>
            <span className="text-xs text-on-surface-variant font-medium">trang hiện hành</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Đủ quyền đăng nhập & học tập</span>
          </div>
        </div>

        {/* Locked Students Card */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs transition-all hover:border-rose-500/40 hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Đang khóa</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <UserX size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {busy ? '…' : summary.lockedCount}
            </strong>
            <span className="text-xs text-on-surface-variant font-medium">trang hiện hành</span>
          </div>
          <div className="mt-1 text-[11px] text-on-surface-variant/80 flex items-center gap-1">
            <ShieldAlert size={12} className="text-rose-500" />
            <span>Bảo lưu hồ sơ & lịch sử</span>
          </div>
        </div>

        {/* Gamification / Active Streak Card */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs transition-all hover:border-amber-500/40 hover:shadow-xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">XP Trung bình</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Trophy size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {busy ? '…' : numberFormatter.format(summary.avgXp)}
            </strong>
            <span className="text-xs text-on-surface-variant font-medium">XP / học sinh</span>
          </div>
          <div className="mt-1 text-[11px] text-on-surface-variant/80 flex items-center gap-1">
            <Flame size={12} className="text-amber-500" />
            <span>{summary.activeStreakCount} bạn đang giữ streak</span>
          </div>
        </div>
      </div>

      {/* 4. Filter and Search Toolbar */}
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* Search box (Col span 4) */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5" htmlFor="search-input">
              <Search size={13} className="text-primary" />
              <span>Tìm kiếm học sinh</span>
            </label>
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3.5 text-outline pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, username, mã HS..."
                className="w-full h-10 pl-9 pr-9 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-medium transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 text-outline hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
                  aria-label="Xóa từ khóa"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Status filter (Col span 2) */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-on-surface-variant" htmlFor="status-filter">
              Trạng thái
            </label>
            <select
              id="status-filter"
              value={params.active === undefined ? '' : String(params.active)}
              onChange={(e) =>
                filter({ active: e.target.value === '' ? undefined : e.target.value === 'true' })
              }
              className="w-full h-10 px-3 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-semibold transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-2xs"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">🟢 Đang hoạt động</option>
              <option value="false">🔴 Đang khóa</option>
            </select>
          </div>

          {/* Grade filter (Col span 2) */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-on-surface-variant" htmlFor="grade-filter">
              Khối
            </label>
            <select
              id="grade-filter"
              value={params.gradeLevel || ''}
              onChange={(e) =>
                filter({ gradeLevel: e.target.value || undefined, classId: undefined })
              }
              className="w-full h-10 px-3 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-semibold transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-2xs"
            >
              <option value="">Tất cả khối</option>
              {Array.from(
                new Set([
                  ...Array.from({ length: 12 }, (_, i) => String(i + 1)),
                  ...classes.map((c) => c.gradeLevel).filter(Boolean),
                ])
              ).map((grade) => (
                <option key={grade} value={grade}>
                  Khối {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Class filter (Col span 2) */}
          <div className="space-y-1.5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface-variant" htmlFor="class-filter">
                Lớp học
              </label>
              {classesError && (
                <button
                  type="button"
                  onClick={() => setClassRetry((v) => v + 1)}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  title="Thử tải lại danh sách lớp"
                >
                  Thử lại
                </button>
              )}
            </div>
            <select
              id="class-filter"
              disabled={classesLoading || Boolean(classesError)}
              value={params.classId || ''}
              onChange={(e) => filter({ classId: e.target.value || undefined })}
              className="w-full h-10 px-3 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-semibold transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <option value="">{classesLoading ? 'Đang tải lớp…' : classesError ? 'Lỗi tải lớp' : 'Tất cả lớp'}</option>
              {visibleClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.gradeLevel ? `(K${item.gradeLevel})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* School filter (Col span 2) */}
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-xs font-bold text-on-surface-variant" htmlFor="school-filter">
              Trường học
            </label>
            <input
              id="school-filter"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Nhập tên trường..."
              className="w-full h-10 px-3 text-xs bg-surface-container-low border border-outline-variant rounded-xl text-on-surface font-medium transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Tags & Active Status & Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/40">
          {/* Left: Active Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap min-h-7">
            <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5 mr-1">
              <Filter size={13} className="text-primary" />
              <span>Bộ lọc:</span>
            </span>

            {hasFilterActive ? (
              <>
                {search.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    <span>Tìm: "{search.trim()}"</span>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="hover:opacity-70 p-0.5"
                      aria-label="Xóa bộ lọc tìm kiếm"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {params.active !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container text-on-surface border border-outline-variant/60">
                    <span>{params.active ? 'Đang hoạt động' : 'Đang khóa'}</span>
                    <button
                      type="button"
                      onClick={() => filter({ active: undefined })}
                      className="hover:opacity-70 p-0.5"
                      aria-label="Xóa bộ lọc trạng thái"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {params.gradeLevel && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container text-on-surface border border-outline-variant/60">
                    <span>Khối {params.gradeLevel}</span>
                    <button
                      type="button"
                      onClick={() => filter({ gradeLevel: undefined })}
                      className="hover:opacity-70 p-0.5"
                      aria-label="Xóa bộ lọc khối"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {params.classId && selectedClassName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container text-on-surface border border-outline-variant/60">
                    <span>Lớp: {selectedClassName}</span>
                    <button
                      type="button"
                      onClick={() => filter({ classId: undefined })}
                      className="hover:opacity-70 p-0.5"
                      aria-label="Xóa bộ lọc lớp"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {school.trim() && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface-container text-on-surface border border-outline-variant/60">
                    <span>Trường: {school.trim()}</span>
                    <button
                      type="button"
                      onClick={() => setSchool('')}
                      className="hover:opacity-70 p-0.5"
                      aria-label="Xóa bộ lọc trường"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer ml-1 py-1 px-2 rounded hover:bg-primary/5 transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Xóa tất cả</span>
                </button>
              </>
            ) : (
              <span className="text-xs text-on-surface-variant/80 italic">Chưa áp dụng bộ lọc tùy chọn</span>
            )}
          </div>

          {/* Right: Sort dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-on-surface-variant">Sắp xếp:</span>
            <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant rounded-xl px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown size={13} className="text-primary" />
              <select
                value={sortIndex}
                onChange={(e) => {
                  const opt = sortOptions[Number(e.target.value)];
                  filter({ sort: opt.sort, direction: opt.direction });
                }}
                className="bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer pr-1"
                aria-label="Sắp xếp danh sách"
              >
                {sortOptions.map((opt, i) => (
                  <option key={opt.sort} value={i} className="bg-surface-container-lowest text-on-surface">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Inline Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-error/40 bg-error-container/20 text-error text-xs font-medium shadow-xs" role="alert">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-error" />
            <div>
              <strong className="font-bold">Không thể tải danh sách học sinh.</strong>
              <span className="ml-1 opacity-90">{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            className="px-3.5 py-1.5 bg-surface-container-lowest border border-error/40 text-error hover:bg-error-container/40 font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 6. Data Table Card Container */}
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-2xs overflow-hidden" aria-busy={busy}>
        {/* Table Subheader */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/60">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={18} className="text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Bảng dữ liệu học sinh</h2>
          </div>
          <span className="text-xs bg-surface-container text-on-surface-variant font-semibold border border-outline-variant/50 px-3 py-1 rounded-full shadow-2xs" aria-live="polite">
            {busy ? 'Đang cập nhật…' : error ? 'Lỗi kết nối' : `${numberFormatter.format(total)} học sinh${hasFilterActive ? ' phù hợp' : ''}`}
          </span>
        </div>

        {/* Desktop Table View (Hidden on mobile <768px for optimal usability) */}
        <div className="hidden md:block overflow-x-auto student-scrollbar" tabIndex={0} role="region" aria-label="Bảng danh sách học sinh">
          <table className="w-full text-left text-xs min-w-[1120px] border-collapse">
            <thead className="bg-surface-container/60 border-b border-outline-variant/50 text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3.5 px-6">Học sinh</th>
                <th scope="col" className="py-3.5 px-4">Mã HS</th>
                <th scope="col" className="py-3.5 px-4">Lớp / Trường</th>
                <th scope="col" className="py-3.5 px-4">Tiến trình (XP & Streak)</th>
                <th scope="col" className="py-3.5 px-4">Hoạt động gần nhất</th>
                <th scope="col" className="py-3.5 px-4">Trạng thái</th>
                <th scope="col" className="py-3.5 px-4">Ngày tạo</th>
                <th scope="col" className="py-3.5 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-on-surface">
              {busy ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-surface-container rounded-full" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-surface-container rounded-md" />
                          <div className="h-3 w-40 bg-surface-container rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-surface-container rounded-md" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-28 bg-surface-container rounded-md" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-24 bg-surface-container rounded-md" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-surface-container rounded-md" /></td>
                    <td className="py-4 px-4"><div className="h-6 w-24 bg-surface-container rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-surface-container rounded-md" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-8 w-28 ml-auto bg-surface-container rounded-xl" /></td>
                  </tr>
                ))
              ) : !error && data && data.content.length > 0 ? (
                data.content.map((student) => {
                  const initials = student.fullName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(-2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase() || 'HS';

                  return (
                    <tr
                      key={student.studentId}
                      className="hover:bg-surface-container-low/70 transition-colors group"
                    >
                      {/* 1. Học sinh: Avatar, Full Name, Email */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-outline-variant/60 shadow-2xs group-hover:ring-primary/40 transition-all">
                            {student.avatarUrl ? (
                              <img
                                src={student.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              initials
                            )}
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface-container-lowest ${
                                student.active ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/students/${student.studentId}`}
                              className="font-bold text-on-surface hover:text-primary transition-colors block text-xs sm:text-sm truncate max-w-xs"
                            >
                              {student.fullName}
                            </Link>
                            <span className="text-[11px] text-on-surface-variant block truncate max-w-xs">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Mã HS with One-Click Copy */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(student.studentCode)}
                          className="group/copy inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold bg-surface-container-low text-on-surface-variant hover:text-primary px-2.5 py-1 rounded-lg border border-outline-variant/60 transition-all cursor-pointer shadow-2xs"
                          title="Sao chép mã học sinh"
                        >
                          <span>{student.studentCode}</span>
                          {copiedCode === student.studentCode ? (
                            <Check size={12} className="text-emerald-500 font-bold" />
                          ) : (
                            <Copy size={12} className="opacity-40 group-hover/copy:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* 3. Lớp & Trường */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-xs bg-surface-container text-on-surface">
                          <span>{student.className || 'Chưa xếp lớp'}</span>
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-1 truncate max-w-[200px]" title={student.schoolName || 'Chưa có trường'}>
                          {student.gradeLevel ? `Khối ${student.gradeLevel}` : '—'} · {student.schoolName || 'Chưa có trường'}
                        </div>
                      </td>

                      {/* 4. Tiến trình (XP, Level, Streak) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-black text-primary">
                            {numberFormatter.format(student.totalXp)} XP
                          </strong>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            Lv.{student.currentLevel}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                          <Flame size={12} className="text-amber-500" />
                          <span>{student.currentStreak} ngày streak</span>
                        </div>
                      </td>

                      {/* 5. Hoạt động gần đây */}
                      <td className="py-3.5 px-4 text-on-surface-variant">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock size={12} className="text-outline" />
                          <span>{formatDate(student.lastActivityDate, 'Chưa có hoạt động')}</span>
                        </div>
                      </td>

                      {/* 6. Trạng thái */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs ${
                            student.active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              student.active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{student.active ? 'Đang hoạt động' : 'Đang khóa'}</span>
                        </span>
                      </td>

                      {/* 7. Ngày tạo */}
                      <td className="py-3.5 px-4 text-on-surface-variant text-[11px]">
                        {formatDate(student.createdAt)}
                      </td>

                      {/* 8. Hành động */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* View Detail */}
                          <Link
                            to={`/admin/students/${student.studentId}`}
                            className="grid h-8 w-8 place-items-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Xem chi tiết"
                            aria-label={`Xem chi tiết ${student.fullName}`}
                          >
                            <Eye size={16} />
                          </Link>

                          {/* Edit Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setEditTarget(student)}
                            className="grid h-8 w-8 place-items-center rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                            title="Chỉnh sửa hồ sơ"
                            aria-label={`Chỉnh sửa ${student.fullName}`}
                          >
                            <Pencil size={15} />
                          </button>

                          {/* Lock / Unlock Trigger */}
                          <button
                            type="button"
                            onClick={() => setLockTarget(student)}
                            className={`grid h-8 w-8 place-items-center rounded-xl transition-colors cursor-pointer ${
                              student.active
                                ? 'text-on-surface-variant hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'
                                : 'text-on-surface-variant hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                            title={student.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            aria-label={`${student.active ? 'Khóa' : 'Mở khóa'} ${student.fullName}`}
                          >
                            {student.active ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>

                          {/* Soft Delete Trigger */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            className="grid h-8 w-8 place-items-center rounded-xl text-on-surface-variant hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Xóa mềm học sinh"
                            aria-label={`Xóa mềm ${student.fullName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card List View (<768px for clean responsive experience) */}
        <div className="block md:hidden divide-y divide-outline-variant/30">
          {busy ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-container" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-32 bg-surface-container rounded" />
                    <div className="h-3 w-48 bg-surface-container rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : !error && data && data.content.length > 0 ? (
            data.content.map((student) => {
              const initials = student.fullName
                .split(/\s+/)
                .filter(Boolean)
                .slice(-2)
                .map((p) => p[0])
                .join('')
                .toUpperCase() || 'HS';

              return (
                <div key={student.studentId} className="p-4 space-y-3 hover:bg-surface-container-low/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-outline-variant/60">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          initials
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-surface-container-lowest ${
                            student.active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/admin/students/${student.studentId}`}
                          className="font-bold text-on-surface hover:text-primary transition-colors block text-sm truncate"
                        >
                          {student.fullName}
                        </Link>
                        <span className="text-xs text-on-surface-variant block truncate">{student.email}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        student.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {student.active ? 'Hoạt động' : 'Đang khóa'}
                    </span>
                  </div>

                  {/* Metadata line: Code & Class */}
                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(student.studentCode)}
                      className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-surface-container text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/60"
                    >
                      <span>{student.studentCode}</span>
                      {copiedCode === student.studentCode ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>

                    <div className="text-[11px] text-on-surface-variant">
                      <strong className="text-on-surface">{student.className || 'Chưa có lớp'}</strong>
                      {student.gradeLevel ? ` · Khối ${student.gradeLevel}` : ''}
                    </div>
                  </div>

                  {/* Gamification strip */}
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-container-low border border-outline-variant/40">
                    <div className="flex items-center gap-1.5 font-black text-primary">
                      <Zap size={13} />
                      <span>{numberFormatter.format(student.totalXp)} XP (Lv.{student.currentLevel})</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                      <Flame size={13} />
                      <span>{student.currentStreak} ngày</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/30">
                    <Link
                      to={`/admin/students/${student.studentId}`}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-semibold text-on-surface flex items-center gap-1"
                    >
                      <Eye size={13} /> Chi tiết
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditTarget(student)}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-semibold text-primary flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil size={13} /> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockTarget(student)}
                      className={`px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        student.active ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {student.active ? <Lock size={13} /> : <Unlock size={13} />}
                      {student.active ? 'Khóa' : 'Mở'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(student)}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Xóa mềm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>

        {/* 7. Empty State (Mục 5.1 & Mục 8) */}
        {!busy && !error && data && data.content.length === 0 && (
          <div className="py-16 px-6 text-center space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto ring-8 ring-primary/5">
              <GraduationCap size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-on-surface">
                {hasFilterActive ? 'Không tìm thấy học sinh phù hợp' : 'Chưa có học sinh'}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                {hasFilterActive
                  ? 'Thử đổi từ khóa hoặc xóa bộ lọc đang áp dụng.'
                  : 'Tạo học sinh đầu tiên để bắt đầu quản lý tài khoản và hồ sơ học tập.'}
              </p>
            </div>
            <div className="pt-2">
              {hasFilterActive ? (
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 border border-outline-variant text-primary hover:bg-surface-container text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Thêm học sinh
                </button>
              )}
            </div>
          </div>
        )}

        {/* 8. Pagination Footer (Mục 7.3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface-variant">
          <div className="font-medium">
            {busy || error
              ? 'Đang tải thông tin trang…'
              : total === 0
              ? '0 học sinh'
              : `Hiển thị ${numberFormatter.format((page - 1) * size + 1)}–${numberFormatter.format(
                  Math.min(page * size, total)
                )} trên tổng số ${numberFormatter.format(total)} học sinh`}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Hiển thị:</span>
              <select
                value={size}
                onChange={(e) => filter({ size: Number(e.target.value) as 10 | 20 | 50 })}
                className="h-8 px-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-bold text-on-surface focus:outline-none cursor-pointer shadow-2xs"
              >
                {[10, 20, 50].map((v) => (
                  <option key={v} value={v} className="bg-surface-container-lowest text-on-surface">
                    {v} bản ghi
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={busy || Boolean(error) || !data?.hasPrevious}
                onClick={() => setParams((p) => ({ ...p, page: page - 1 }))}
                className="grid h-8 w-8 place-items-center rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-on-surface shadow-2xs"
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 bg-surface-container-lowest border border-outline-variant/60 rounded-lg font-bold text-on-surface shadow-2xs">
                Trang {page} / {Math.max(1, data?.totalPages || 0)}
              </span>

              <button
                type="button"
                disabled={busy || Boolean(error) || !data?.hasNext}
                onClick={() => setParams((p) => ({ ...p, page: page + 1 }))}
                className="grid h-8 w-8 place-items-center rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-on-surface shadow-2xs"
                aria-label="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task 11: Add Student Modal */}
      <AddStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          setRetry((v) => v + 1);
        }}
      />

      {/* Task 11: Edit Student Modal */}
      <EditStudentModal
        isOpen={Boolean(editTarget)}
        student={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={(msg) => {
          showToast(msg);
          setRetry((v) => v + 1);
        }}
      />

      {/* Task 12: Lock / Unlock Dialog */}
      <LockUnlockDialog
        isOpen={Boolean(lockTarget)}
        student={lockTarget}
        onClose={() => setLockTarget(null)}
        onSuccess={(msg) => {
          showToast(msg);
          setRetry((v) => v + 1);
        }}
      />

      {/* Task 12: Soft Delete Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        student={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={(msg) => {
          showToast(msg);
          setRetry((v) => v + 1);
        }}
      />
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Flame,
  GraduationCap,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { fetchStudents } from '../../../services/adminStudentApi';
import { analyticsApi } from '../../../services/analyticsApi';
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
  { label: 'Tên A-Z', sort: 'fullName' as StudentSortField, direction: 'asc' as const },
  { label: 'XP cao nhất', sort: 'totalXp' as StudentSortField, direction: 'desc' as const },
  { label: 'Hoạt động gần đây', sort: 'lastActivityDate' as StudentSortField, direction: 'desc' as const },
];

const number = new Intl.NumberFormat('vi-VN');

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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
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

  const filtered = Boolean(
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

  return (
    <section className="space-y-6 pb-12 font-sans" aria-labelledby="student-management-title">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-xs font-bold transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-900/20'
              : 'bg-[#ba1a1a] text-white shadow-red-900/20'
          }`}
          role="status"
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Breadcrumb (Mục 5.1) */}
      <nav className="flex items-center gap-2 text-xs text-[#717785]" aria-label="Breadcrumb">
        <Link to="/admin" className="hover:text-[#005cb8]">Quản trị hệ thống</Link>
        <span>/</span>
        <span>Học sinh</span>
        <span>/</span>
        <strong className="text-[#181c22] font-semibold">Danh sách học sinh</strong>
      </nav>

      {/* Page Header (Mục 5.1 & Mục 8 Text chuẩn) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="student-management-title" className="text-2xl sm:text-3xl font-bold text-[#181c22] tracking-tight">
            Quản lý học sinh
          </h1>
          <p className="text-xs sm:text-sm text-[#414753] mt-1">
            Theo dõi tài khoản, lớp học và tiến trình cơ bản của học sinh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005cb8] hover:bg-[#1275e2] text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm học sinh</span>
        </button>
      </div>

      {/* Filter and Search Toolbar (Mục 5.1 & Mục 7.2) */}
      <div className="rounded-xl border border-[#c1c6d5]/50 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Search box (Mục 7.1) */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-[#414753]" htmlFor="search-input">
              Tìm kiếm
            </label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-[#717785] pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, username hoặc mã học sinh"
                className="w-full h-10 pl-9 pr-8 text-xs bg-[#f1f3fc] border border-[#c1c6d5] rounded-lg text-[#181c22] font-normal transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-[#717785] hover:text-[#181c22] cursor-pointer"
                  aria-label="Xóa từ khóa"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#414753]" htmlFor="status-filter">
              Trạng thái
            </label>
            <select
              id="status-filter"
              value={params.active === undefined ? '' : String(params.active)}
              onChange={(e) =>
                filter({ active: e.target.value === '' ? undefined : e.target.value === 'true' })
              }
              className="w-full h-10 px-3 text-xs bg-[#f1f3fc] border border-[#c1c6d5] rounded-lg text-[#181c22] font-normal transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8] cursor-pointer"
            >
              <option value="">Tất cả</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đang khóa</option>
            </select>
          </div>

          {/* School filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#414753]" htmlFor="school-filter">
              Trường
            </label>
            <input
              id="school-filter"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Nhập tên trường"
              className="w-full h-10 px-3 text-xs bg-[#f1f3fc] border border-[#c1c6d5] rounded-lg text-[#181c22] font-normal transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
            />
          </div>

          {/* Grade filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#414753]" htmlFor="grade-filter">
              Khối
            </label>
            <select
              id="grade-filter"
              value={params.gradeLevel || ''}
              onChange={(e) =>
                filter({ gradeLevel: e.target.value || undefined, classId: undefined })
              }
              className="w-full h-10 px-3 text-xs bg-[#f1f3fc] border border-[#c1c6d5] rounded-lg text-[#181c22] font-normal transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8] cursor-pointer"
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
        </div>

        {/* Class filter row & error retry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#c1c6d5]/30">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-[#414753] whitespace-nowrap" htmlFor="class-filter">
              Lớp:
            </label>
            <select
              id="class-filter"
              disabled={classesLoading || Boolean(classesError)}
              value={params.classId || ''}
              onChange={(e) => filter({ classId: e.target.value || undefined })}
              className="h-9 px-3 text-xs bg-[#f1f3fc] border border-[#c1c6d5] rounded-lg text-[#181c22] font-normal transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8] cursor-pointer disabled:opacity-50 min-w-[180px]"
            >
              <option value="">{classesLoading ? 'Đang tải lớp…' : 'Tất cả lớp'}</option>
              {visibleClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · Khối {item.gradeLevel}
                </option>
              ))}
            </select>

            {classesError && (
              <span className="text-xs text-[#ba1a1a] flex items-center gap-1.5">
                {classesError}
                <button
                  type="button"
                  onClick={() => setClassRetry((v) => v + 1)}
                  className="underline font-bold text-[#005cb8] hover:text-[#1275e2]"
                >
                  Thử lại
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Filter status & Reset button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#414753]">
                {filtered ? 'Đang áp dụng bộ lọc' : 'Tất cả học sinh'}
              </span>
              <button
                type="button"
                onClick={reset}
                disabled={!filtered && sortIndex === 0}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#005cb8] hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCcw size={12} /> Xóa bộ lọc
              </button>
            </div>

            {/* Sort picker */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#717785]">Sắp xếp:</span>
              <div className="flex items-center gap-1 bg-[#f1f3fc] border border-[#c1c6d5] rounded-lg px-2 py-1">
                <ArrowUpDown size={12} className="text-[#717785]" />
                <select
                  value={sortIndex}
                  onChange={(e) => {
                    const opt = sortOptions[Number(e.target.value)];
                    filter({ sort: opt.sort, direction: opt.direction });
                  }}
                  className="bg-transparent text-xs font-semibold text-[#181c22] focus:outline-none cursor-pointer"
                  aria-label="Sắp xếp danh sách"
                >
                  {sortOptions.map((opt, i) => (
                    <option key={opt.sort} value={i}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Error Block (Mục 5.1) */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] text-[#93000a] text-xs font-medium" role="alert">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-[#ba1a1a]" />
            <div>
              <strong>Không thể tải danh sách học sinh.</strong>
              <span className="ml-1 text-[11px] opacity-80">{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRetry((v) => v + 1)}
            className="px-3 py-1 bg-white border border-[#ba1a1a]/40 text-[#ba1a1a] hover:bg-[#ffdad6] font-bold rounded-lg transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Card (Mục 5.1 Table columns & states) */}
      <div className="rounded-xl border border-[#c1c6d5]/50 bg-white shadow-2xs overflow-hidden" aria-busy={busy}>
        {/* Table heading */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c1c6d5]/40 bg-[#f9f9ff]">
          <h2 className="text-sm font-bold text-[#181c22]">Danh sách học sinh</h2>
          <span className="text-xs bg-[#f1f3fc] text-[#414753] border border-[#c1c6d5]/40 px-2.5 py-0.5 rounded-full" aria-live="polite">
            {busy ? 'Đang tải…' : error ? 'Chưa tải được dữ liệu' : `${number.format(total)} học sinh${filtered ? ' phù hợp' : ''}`}
          </span>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto scrollbar-thin" tabIndex={0} role="region" aria-label="Bảng danh sách học sinh">
          <table className="w-full text-left text-xs min-w-[1100px] border-collapse">
            <thead className="bg-[#f1f3fc] border-b border-[#c1c6d5]/50 text-[#414753] font-bold">
              <tr>
                <th scope="col" className="py-3.5 px-6">Học sinh</th>
                <th scope="col" className="py-3.5 px-4">Mã HS</th>
                <th scope="col" className="py-3.5 px-4">Lớp / Trường</th>
                <th scope="col" className="py-3.5 px-4">Tiến trình</th>
                <th scope="col" className="py-3.5 px-4">Hoạt động gần đây</th>
                <th scope="col" className="py-3.5 px-4">Trạng thái</th>
                <th scope="col" className="py-3.5 px-4">Ngày tạo</th>
                <th scope="col" className="py-3.5 px-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c1c6d5]/30 text-[#181c22]">
              {busy ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#ebedf7] rounded-full" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 bg-[#ebedf7] rounded" />
                          <div className="h-3 w-36 bg-[#ebedf7] rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-[#ebedf7] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-[#ebedf7] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-[#ebedf7] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-[#ebedf7] rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-20 bg-[#ebedf7] rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-[#ebedf7] rounded" /></td>
                    <td className="py-4 px-6 text-right"><div className="h-6 w-24 ml-auto bg-[#ebedf7] rounded" /></td>
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
                    <tr key={student.studentId} className="hover:bg-[#f9f9ff] transition-colors">
                      {/* 1. Học sinh (Avatar, Tên, Email) */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#d6e3ff] text-[#00458d] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-[#c1c6d5]/40 shadow-xs">
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
                          </div>
                          <div>
                            <Link
                              to={`/admin/students/${student.studentId}`}
                              className="font-bold text-[#181c22] hover:text-[#005cb8] hover:underline transition-colors block"
                            >
                              {student.fullName}
                            </Link>
                            <span className="text-[11px] text-[#717785] block truncate max-w-xs">{student.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Mã HS */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(student.studentCode)}
                          className="group inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-[#f1f3fc] text-[#414753] hover:text-[#005cb8] px-2 py-0.5 rounded border border-[#c1c6d5]/40 transition-colors cursor-pointer"
                          title="Sao chép mã học sinh"
                        >
                          <span>{student.studentCode}</span>
                          {copiedCode === student.studentCode ? (
                            <Check size={11} className="text-[#166534]" />
                          ) : (
                            <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* 3. Lớp / Trường */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#181c22]">
                          {student.className || 'Chưa có lớp'}
                        </div>
                        <div className="text-[11px] text-[#717785] mt-0.5">
                          {student.gradeLevel ? `Khối ${student.gradeLevel}` : '—'} · {student.schoolName || 'Chưa có trường'}
                        </div>
                      </td>

                      {/* 4. Tiến trình (XP, Level, Streak) */}
                      <td className="py-3.5 px-4">
                        <strong className="text-xs font-bold text-[#005cb8]">
                          {number.format(student.totalXp)} XP
                        </strong>
                        <div className="text-[11px] text-[#717785] mt-0.5 flex items-center gap-1">
                          <span>Lv.{student.currentLevel}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5 text-[#9a4600] font-semibold">
                            <Flame size={11} /> {student.currentStreak} ngày
                          </span>
                        </div>
                      </td>

                      {/* 5. Hoạt động gần đây */}
                      <td className="py-3.5 px-4 text-[#414753]">
                        {formatDate(student.lastActivityDate, 'Chưa có hoạt động')}
                      </td>

                      {/* 6. Trạng thái */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            student.active
                              ? 'bg-[#e8f5ed] text-[#166534]'
                              : 'bg-[#ffdad6] text-[#93000a]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              student.active ? 'bg-emerald-500' : 'bg-[#ba1a1a]'
                            }`}
                          />
                          {student.active ? 'Đang hoạt động' : 'Đang khóa'}
                        </span>
                      </td>

                      {/* 7. Ngày tạo */}
                      <td className="py-3.5 px-4 text-[#717785]">
                        {formatDate(student.createdAt)}
                      </td>

                      {/* 8. Hành động */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* View Detail */}
                          <Link
                            to={`/admin/students/${student.studentId}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#414753] hover:bg-[#d6e3ff] hover:text-[#005cb8] transition-colors"
                            title="Xem chi tiết"
                            aria-label={`Xem chi tiết ${student.fullName}`}
                          >
                            <Eye size={16} />
                          </Link>

                          {/* Edit Modal Trigger (Task 11) */}
                          <button
                            type="button"
                            onClick={() => setEditTarget(student)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#414753] hover:bg-[#d6e3ff] hover:text-[#005cb8] transition-colors cursor-pointer"
                            title="Chỉnh sửa hồ sơ"
                            aria-label={`Chỉnh sửa ${student.fullName}`}
                          >
                            <Pencil size={16} />
                          </button>

                          {/* Lock / Unlock Trigger (Task 12) */}
                          <button
                            type="button"
                            onClick={() => setLockTarget(student)}
                            className={`grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                              student.active
                                ? 'text-[#414753] hover:bg-[#ffdad6] hover:text-[#ba1a1a]'
                                : 'text-[#414753] hover:bg-[#d6e3ff] hover:text-[#005cb8]'
                            }`}
                            title={student.active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            aria-label={`${student.active ? 'Khóa' : 'Mở khóa'} ${student.fullName}`}
                          >
                            {student.active ? <Lock size={16} /> : <Unlock size={16} />}
                          </button>

                          {/* Soft Delete Trigger (Task 12) */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(student)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                            title="Xóa mềm học sinh"
                            aria-label={`Xóa mềm ${student.fullName}`}
                          >
                            <Trash2 size={16} />
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

        {/* Empty State (Mục 5.1 & Mục 8) */}
        {!busy && !error && data && data.content.length === 0 && (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#d6e3ff] text-[#005cb8] mx-auto">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-base font-bold text-[#181c22]">
              {filtered ? 'Không tìm thấy học sinh phù hợp' : 'Chưa có học sinh'}
            </h3>
            <p className="text-xs text-[#717785] max-w-sm mx-auto">
              {filtered
                ? 'Thử đổi từ khóa hoặc xóa bộ lọc đang áp dụng.'
                : 'Tạo học sinh đầu tiên để bắt đầu quản lý tài khoản và hồ sơ học tập.'}
            </p>
            <div className="pt-2">
              {filtered ? (
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 border border-[#c1c6d5] text-[#005cb8] hover:bg-[#f1f3fc] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="px-4 py-2 bg-[#005cb8] hover:bg-[#1275e2] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Thêm học sinh
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pagination Footer (Mục 7.3) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3.5 border-t border-[#c1c6d5]/40 bg-[#f9f9ff] text-xs text-[#414753]">
          <div>
            {busy || error
              ? '—'
              : total === 0
              ? '0 học sinh'
              : `${number.format((page - 1) * size + 1)}–${number.format(
                  Math.min(page * size, total)
                )} / ${number.format(total)} học sinh`}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Số dòng:</span>
              <select
                value={size}
                onChange={(e) => filter({ size: Number(e.target.value) as 10 | 20 | 50 })}
                className="h-8 px-2 bg-white border border-[#c1c6d5] rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {[10, 20, 50].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={busy || Boolean(error) || !data?.hasPrevious}
                onClick={() => setParams((p) => ({ ...p, page: page - 1 }))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#c1c6d5] bg-white hover:bg-[#d6e3ff] hover:text-[#005cb8] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                aria-label="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-2 font-semibold text-[#181c22]">
                Trang {page} / {Math.max(1, data?.totalPages || 0)}
              </span>

              <button
                type="button"
                disabled={busy || Boolean(error) || !data?.hasNext}
                onClick={() => setParams((p) => ({ ...p, page: page + 1 }))}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#c1c6d5] bg-white hover:bg-[#d6e3ff] hover:text-[#005cb8] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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

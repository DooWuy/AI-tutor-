import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  GraduationCap,
  Home,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  RefreshCw,
  Sparkles,
  Trash2,
  Trophy,
  Unlock,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { fetchStudentDetail, AdminStudentApiError } from '../../../services/adminStudentApi';
import type { AdminStudentDetail } from '../../../types/adminStudent';
import { EditStudentModal } from './components/EditStudentModal';
import { LockUnlockDialog } from './components/LockUnlockDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import './StudentManagementPage.css';

const numberFormatter = new Intl.NumberFormat('vi-VN');

function formatDate(value: string | null, fallback = '—') {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString('vi-VN');
}

type DetailTab = 'profile' | 'learning' | 'class-schedule' | 'activities';

export function AdminStudentDetailShell() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('profile');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLockUnlockOpen, setIsLockUnlockOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  const loadStudent = async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchStudentDetail(studentId);
      setStudent(res);
    } catch (err: unknown) {
      if (err instanceof AdminStudentApiError) {
        setError(err.message || 'Không tìm thấy học sinh.');
      } else {
        setError('Không thể tải thông tin học sinh. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  const handleCopyCode = () => {
    if (!student?.studentCode) return;
    navigator.clipboard.writeText(student.studentCode);
    setCopiedCode(true);
    showToast(`Đã sao chép mã học sinh: ${student.studentCode}`);
    window.setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!student?.email) return;
    navigator.clipboard.writeText(student.email);
    setCopiedEmail(true);
    showToast(`Đã sao chép email: ${student.email}`);
    window.setTimeout(() => setCopiedEmail(false), 2000);
  };

  const initials = student?.fullName
    ? student.fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(-2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : 'HS';

  // XP calculation toward next level (1000 XP per level benchmark)
  const xpInCurrentLevel = student ? student.totalXp % 1000 : 0;
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / 1000) * 100));

  return (
    <section className="space-y-6 pb-12 font-sans" aria-labelledby="admin-student-detail-title">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-900/30'
              : 'bg-error text-white shadow-red-900/30'
          }`}
          role="status"
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-on-surface-variant/80" aria-label="Breadcrumb">
        <Link to="/admin" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Home size={13} />
          <span>Quản trị hệ thống</span>
        </Link>
        <span className="text-outline-variant">/</span>
        <Link to="/admin/students" className="hover:text-primary transition-colors">
          Học sinh
        </Link>
        <span className="text-outline-variant">/</span>
        <strong className="text-on-surface font-semibold truncate max-w-xs">
          {student?.fullName || 'Chi tiết học sinh'}
        </strong>
      </nav>

      {/* 2. Top Bar with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/admin/students"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/80 bg-surface-container-lowest text-xs font-bold text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-surface-container-low transition-all active:scale-95 shadow-2xs"
          >
            <ArrowLeft size={14} />
            <span>Quay lại</span>
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 id="admin-student-detail-title" className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                {student ? student.fullName : 'Hồ sơ học sinh'}
              </h1>
              {student && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                    student.active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      student.active ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{student.active ? 'Đang hoạt động' : 'Đang khóa'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {student && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <Pencil size={14} />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLockUnlockOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer shadow-2xs ${
                student.active
                  ? 'bg-surface-container-lowest text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10'
                  : 'bg-surface-container-lowest text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10'
              }`}
            >
              {student.active ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{student.active ? 'Khóa tài khoản' : 'Mở khóa'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-surface-container-lowest border border-rose-500/30 hover:bg-rose-500/10 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Xóa mềm học sinh"
            >
              <Trash2 size={14} />
              <span>Xóa</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-surface-container-high rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-surface-container-high rounded-2xl" />
            ))}
          </div>
          <div className="h-80 bg-surface-container-high rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {!loading && (error || !student) && (
        <div className="rounded-2xl border border-error/40 bg-error-container/20 p-8 text-center space-y-4 shadow-xs" role="alert">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-error text-white mx-auto shadow-md">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-on-surface">Không thể tải thông tin học sinh</h2>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">{error || 'Học sinh không tồn tại hoặc đã bị xóa.'}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadStudent}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-error hover:bg-error/90 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      )}

      {/* Loaded Student Content */}
      {!loading && student && (
        <>
          {/* 3. Hero Profile Summary Band */}
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/70 bg-gradient-to-r from-surface-container-lowest via-surface-container-low/40 to-surface-container-lowest p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
              {/* Avatar */}
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/10 text-primary flex items-center justify-center font-black text-2xl shrink-0 overflow-hidden ring-2 ring-primary/30 shadow-md">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
                <span
                  className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full ring-2 ring-surface-container-lowest ${
                    student.active ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </div>

              {/* Identity & Badges */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-extrabold text-on-surface truncate">{student.fullName}</h2>

                  {/* Student Code Badge with Copy */}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-surface-container-low text-primary hover:bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 transition-all cursor-pointer shadow-2xs"
                    title="Sao chép mã học sinh"
                  >
                    <span>{student.studentCode}</span>
                    {copiedCode ? <Check size={12} className="text-emerald-500 font-bold" /> : <Copy size={12} />}
                  </button>

                  <span className="text-xs text-on-surface-variant font-mono">@{student.username}</span>
                </div>

                {/* Sub details: email, class, school */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-on-surface-variant">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    title="Sao chép email"
                  >
                    <Mail size={13} className="text-outline" />
                    <span>{student.email}</span>
                    {copiedEmail && <Check size={11} className="text-emerald-500 font-bold" />}
                  </button>

                  <span className="text-outline-variant">•</span>

                  <div className="flex items-center gap-1">
                    <GraduationCap size={14} className="text-primary" />
                    <strong className="text-on-surface font-bold">
                      {student.className || 'Chưa có lớp'}
                    </strong>
                    {student.gradeLevel ? <span>(Khối {student.gradeLevel})</span> : null}
                  </div>

                  <span className="text-outline-variant">•</span>

                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <MapPin size={13} className="text-outline" />
                    <span>{student.schoolName || 'Chưa có trường'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Gamification KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total XP */}
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Tổng XP Tích lũy</span>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Trophy size={18} />
                </div>
              </div>
              <div className="mt-2.5">
                <strong className="text-xl sm:text-2xl font-black text-primary block">
                  {numberFormatter.format(student.totalXp)} XP
                </strong>
                {/* Level progress indicator */}
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                    <span>Cấp tiếp theo</span>
                    <span>{xpProgressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${xpProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Level */}
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs hover:border-purple-500/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Cấp bậc</span>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                  <Zap size={18} />
                </div>
              </div>
              <div className="mt-2.5">
                <strong className="text-xl sm:text-2xl font-black text-on-surface block">
                  Cấp {student.currentLevel}
                </strong>
                <span className="mt-1 text-[11px] text-on-surface-variant/80 flex items-center gap-1 font-medium">
                  <Sparkles size={11} className="text-purple-500" />
                  <span>Hạng thành viên</span>
                </span>
              </div>
            </div>

            {/* Current Streak */}
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs hover:border-amber-500/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Chuỗi Streak</span>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Flame size={18} />
                </div>
              </div>
              <div className="mt-2.5">
                <strong className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 block">
                  {student.currentStreak} ngày
                </strong>
                <span className="mt-1 text-[11px] text-on-surface-variant/80 flex items-center gap-1 font-medium">
                  <Award size={11} className="text-amber-500" />
                  <span>Kỷ lục: {student.longestStreak || student.currentStreak} ngày</span>
                </span>
              </div>
            </div>

            {/* Last Activity */}
            <div className="relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs hover:border-blue-500/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Hoạt động gần nhất</span>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-2.5">
                <strong className="text-sm sm:text-base font-bold text-on-surface block truncate" title={formatDate(student.lastActivityDate)}>
                  {formatDate(student.lastActivityDate, 'Chưa có')}
                </strong>
                <span className="mt-1 text-[11px] text-on-surface-variant/80 flex items-center gap-1 font-medium">
                  <Calendar size={11} className="text-blue-500" />
                  <span>Tương tác hệ thống</span>
                </span>
              </div>
            </div>
          </div>

          {/* 5. Navigation Tabs & Content Card */}
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-2xs overflow-hidden">
            {/* Tab header */}
            <div className="flex items-center gap-1 p-2 border-b border-outline-variant/40 bg-surface-container-low/60 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                <User size={14} />
                <span>Hồ sơ & Tài khoản</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('learning')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'learning'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                <BookOpen size={14} />
                <span>Tiến trình học tập & Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('class-schedule')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'class-schedule'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                <GraduationCap size={14} />
                <span>Phân lớp & Thời khóa biểu</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'activities'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                <Clock size={14} />
                <span>Lịch sử hoạt động</span>
              </button>
            </div>

            {/* TAB 1: Hồ sơ & Tài khoản */}
            {activeTab === 'profile' && (
              <div className="p-6 space-y-8">
                {/* 1.1 Identity & Account */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <User size={15} />
                    <span>Thông tin định danh & tài khoản</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5 text-xs">
                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Họ và tên</span>
                      <strong className="text-sm font-bold text-on-surface mt-1 block">{student.fullName}</strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Username</span>
                      <span className="font-mono text-sm text-primary font-bold mt-1 block">@{student.username}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Email đăng nhập</span>
                      <span className="text-sm text-on-surface font-semibold mt-1 block truncate" title={student.email}>
                        {student.email}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Số điện thoại</span>
                      <span className="text-sm text-on-surface font-semibold mt-1 block">
                        {student.phoneNumber || '—'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Ngày sinh</span>
                      <span className="text-sm text-on-surface font-semibold mt-1 block">
                        {formatDate(student.dateOfBirth)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Giới tính</span>
                      <span className="text-sm text-on-surface font-semibold mt-1 block">
                        {student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Địa chỉ cư trú</span>
                      <span className="text-sm text-on-surface font-semibold mt-1 block">
                        {student.address || '—'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Trạng thái truy cập</span>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            student.active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <strong className="text-xs font-bold text-on-surface">
                          {student.active ? 'Đang hoạt động' : 'Đang khóa'}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Ngày tạo tài khoản</span>
                      <span className="text-sm text-on-surface font-semibold mt-1 block">
                        {formatDate(student.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1.2 Parent Contact */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <Users size={15} />
                    <span>Thông tin liên lạc phụ huynh</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5 text-xs">
                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Họ tên phụ huynh</span>
                      <strong className="text-sm font-bold text-on-surface mt-1 block">
                        {student.parentName || 'Chưa cung cấp'}
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Số điện thoại liên lạc</span>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-on-surface">
                        <Phone size={13} className="text-outline" />
                        <span>{student.parentPhone || '—'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Email phụ huynh</span>
                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-on-surface truncate">
                        <Mail size={13} className="text-outline" />
                        <span className="truncate">{student.parentEmail || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Học tập & Quiz */}
            {activeTab === 'learning' && (
              <div className="p-6 space-y-8">
                {/* Gamification breakdown */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <Trophy size={15} />
                    <span>Chỉ số Gamification & Tiến trình học tập</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Tổng điểm XP</span>
                      <strong className="text-lg font-black text-primary mt-1.5 block">
                        {numberFormatter.format(student.totalXp)} XP
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Level hiện tại</span>
                      <strong className="text-lg font-black text-on-surface mt-1.5 block">
                        Level {student.currentLevel}
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Streak hiện tại</span>
                      <strong className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1.5 block">
                        {student.currentStreak} ngày
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Streak dài nhất</span>
                      <strong className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1.5 block">
                        {student.longestStreak || student.currentStreak} ngày
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Quiz statistics */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <BookOpen size={15} />
                    <span>Kết quả đánh giá Quiz & Bài tập</span>
                  </h3>

                  {!student.quizAttemptCount || student.quizAttemptCount === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/60 mt-4">
                      <BookOpen size={36} className="text-outline mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-on-surface">Học sinh chưa có lượt làm quiz nào.</p>
                        <p className="text-[11px] text-on-surface-variant">
                          Khi học sinh làm bài tập và nộp bài, điểm số và số lần làm sẽ hiển thị tại đây.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5 text-xs">
                      <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                        <span className="text-on-surface-variant font-semibold block text-[11px]">Số bài quiz đã làm</span>
                        <strong className="text-xl font-black text-on-surface mt-1.5 block">
                          {student.quizAttemptCount} bài
                        </strong>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                        <span className="text-on-surface-variant font-semibold block text-[11px]">Điểm trung bình</span>
                        <strong className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 block">
                          {student.averageScore !== null ? Number(student.averageScore).toFixed(1) : '—'} / 10
                        </strong>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                        <span className="text-on-surface-variant font-semibold block text-[11px]">Lần nộp bài gần nhất</span>
                        <strong className="text-sm font-bold text-on-surface mt-1.5 block">
                          {formatDate(student.lastQuizSubmittedAt, '—')}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Phân lớp & Thời khóa biểu */}
            {activeTab === 'class-schedule' && (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <GraduationCap size={15} />
                    <span>Phân lớp và trường học</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-5 text-xs">
                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Trường học</span>
                      <strong className="text-sm font-bold text-on-surface mt-1 block">
                        {student.schoolName || 'Chưa cung cấp'}
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Khối lớp</span>
                      <strong className="text-sm font-bold text-on-surface mt-1 block">
                        {student.gradeLevel ? `Khối ${student.gradeLevel}` : '—'}
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Tên lớp</span>
                      <strong className="text-sm font-bold text-on-surface mt-1 block">
                        {student.className || 'Chưa xếp lớp'}
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/40">
                      <span className="text-on-surface-variant font-semibold block text-[11px]">Mã định danh HS</span>
                      <strong className="font-mono text-sm font-bold text-primary mt-1 block">
                        {student.studentCode}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Schedules */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <Calendar size={15} />
                    <span>Thời khóa biểu & Lịch học</span>
                  </h3>

                  {!student.scheduleCount || student.scheduleCount === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/60 mt-4">
                      <Calendar size={36} className="text-outline mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-on-surface">Học sinh chưa tạo lịch học.</p>
                        <p className="text-[11px] text-on-surface-variant">
                          Học sinh có thể cấu hình thời khóa biểu cá nhân trên ứng dụng học tập.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 mt-5 text-xs flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <span className="text-on-surface-variant font-medium">Thời khóa biểu hiện hành:</span>
                        <p className="text-sm font-bold text-on-surface mt-0.5">
                          Học sinh hiện đang có <strong className="text-primary font-black">{student.scheduleCount}</strong> buổi học trong lịch học cá nhân.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Lịch sử hoạt động */}
            {activeTab === 'activities' && (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 pb-2.5 border-b border-outline-variant/30">
                    <Clock size={15} />
                    <span>Tổng hợp hoạt động học tập tương tác</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs">
                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1.5">
                        <MessageSquare size={16} className="text-primary" />
                        <span className="font-semibold text-[11px]">Phiên chat AI</span>
                      </div>
                      <strong className="text-xl font-black text-on-surface block">
                        {student.chatSessionCount ?? 0} phiên
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1.5">
                        <Calendar size={16} className="text-primary" />
                        <span className="font-semibold text-[11px]">Lịch học</span>
                      </div>
                      <strong className="text-xl font-black text-on-surface block">
                        {student.scheduleCount ?? 0} lịch
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1.5">
                        <BookOpen size={16} className="text-primary" />
                        <span className="font-semibold text-[11px]">Bài quiz đã nộp</span>
                      </div>
                      <strong className="text-xl font-black text-on-surface block">
                        {student.quizAttemptCount ?? 0} lượt
                      </strong>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/40 shadow-2xs">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1.5">
                        <Clock size={16} className="text-primary" />
                        <span className="font-semibold text-[11px]">Gần nhất</span>
                      </div>
                      <strong className="text-xs font-bold text-on-surface block truncate" title={formatDate(student.lastActivityDate)}>
                        {formatDate(student.lastActivityDate, 'Chưa có')}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditOpen}
        student={student}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadStudent();
        }}
      />

      {/* Lock/Unlock Dialog */}
      <LockUnlockDialog
        isOpen={isLockUnlockOpen}
        student={student}
        onClose={() => setIsLockUnlockOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          loadStudent();
        }}
      />

      {/* Soft Delete Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        student={student}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={(msg) => {
          showToast(msg);
          navigate('/admin/students');
        }}
      />
    </section>
  );
}

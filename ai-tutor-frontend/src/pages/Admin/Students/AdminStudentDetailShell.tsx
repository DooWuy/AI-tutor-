import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Flame,
  Lock,
  MessageSquare,
  Pencil,
  RefreshCw,
  Trophy,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import { fetchStudentDetail, AdminStudentApiError } from '../../../services/adminStudentApi';
import type { AdminStudentDetail } from '../../../types/adminStudent';
import { EditStudentModal } from './components/EditStudentModal';
import { LockUnlockDialog } from './components/LockUnlockDialog';

const number = new Intl.NumberFormat('vi-VN');

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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLockUnlockOpen, setIsLockUnlockOpen] = useState(false);

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
    window.setTimeout(() => setCopiedCode(false), 2000);
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

  return (
    <section className="space-y-6 pb-12 font-sans" aria-labelledby="admin-student-detail-title">
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

      {/* Top Bar (Mục 5.4.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-2" aria-label="Breadcrumb">
            <Link to="/admin" className="hover:text-primary">Quản trị hệ thống</Link>
            <span>/</span>
            <Link to="/admin/students" className="hover:text-primary">Học sinh</Link>
            <span>/</span>
            <strong className="text-on-surface font-semibold truncate max-w-xs">
              {student?.fullName || 'Chi tiết học sinh'}
            </strong>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/students"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-surface-container transition-all"
            >
              <ArrowLeft size={14} /> Quay lại
            </Link>

            <h1 id="admin-student-detail-title" className="text-xl sm:text-2xl font-bold text-on-surface">
              {student ? student.fullName : 'Hồ sơ học sinh'}
            </h1>

            {student && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  student.active
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    student.active ? 'bg-emerald-500' : 'bg-error'
                  }`}
                />
                {student.active ? 'Đang hoạt động' : 'Đang khóa'}
              </span>
            )}
          </div>
        </div>

        {/* Actions in top bar */}
        {student && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <Pencil size={15} />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLockUnlockOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                student.active
                  ? 'bg-surface-container-lowest text-error border-error/40 hover:bg-error-container/40'
                  : 'bg-surface-container-lowest text-primary border-primary/40 hover:bg-primary/10'
              }`}
            >
              {student.active ? <Lock size={15} /> : <Unlock size={15} />}
              <span>{student.active ? 'Khóa tài khoản' : 'Mở khóa'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-surface-container-high rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container-high rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-surface-container-high rounded-xl" />
        </div>
      )}

      {/* Error State */}
      {!loading && (error || !student) && (
        <div className="rounded-xl border border-error/30 bg-error-container/30 p-6 text-center space-y-3" role="alert">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-error text-white mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-on-error-container">Không thể tải thông tin học sinh</h2>
          <p className="text-xs text-on-error-container max-w-md mx-auto">{error || 'Học sinh không tồn tại hoặc đã bị xóa.'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadStudent}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-error hover:bg-error/90 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      )}

      {/* Loaded Student Content */}
      {!loading && student && (
        <>
          {/* Profile Summary Band (Mục 5.4.2) */}
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden ring-2 ring-primary/20 shadow-xs">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-on-surface truncate">{student.fullName}</h2>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-surface-container text-on-surface-variant hover:text-primary px-2 py-0.5 rounded border border-outline-variant/50 transition-colors cursor-pointer"
                    title="Sao chép mã học sinh"
                  >
                    <span>{student.studentCode}</span>
                    {copiedCode ? <Check size={11} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                  <span>{student.email}</span>
                  <span>·</span>
                  <span className="font-medium text-on-surface">
                    {student.className || 'Chưa có lớp'}
                  </span>
                  <span>·</span>
                  <span>{student.schoolName || 'Chưa có trường'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Row (Mục 5.4.3) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Total XP */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary shrink-0">
                <Trophy size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Tổng XP</span>
                <strong className="text-lg font-black text-primary">{number.format(student.totalXp)}</strong>
              </div>
            </div>

            {/* Level */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-tertiary/15 text-tertiary shrink-0">
                <Zap size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Cấp độ</span>
                <strong className="text-lg font-black text-on-surface">Level {student.currentLevel}</strong>
              </div>
            </div>

            {/* Current Streak */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <Flame size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Streak hiện tại</span>
                <strong className="text-lg font-black text-amber-600 dark:text-amber-400">{student.currentStreak} ngày</strong>
              </div>
            </div>

            {/* Last Activity */}
            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-container-high text-on-surface-variant shrink-0">
                <Clock size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Hoạt động gần đây</span>
                <strong className="text-xs font-bold text-on-surface block truncate" title={formatDate(student.lastActivityDate)}>
                  {formatDate(student.lastActivityDate, 'Chưa có')}
                </strong>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Mục 5.4.4) */}
          {/* Navigation Tabs (Mục 5.4.4) */}
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xs overflow-hidden">
            <div className="flex items-center gap-1 p-1.5 border-b border-outline-variant/40 bg-surface-container-low overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Hồ sơ
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('learning')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'learning'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Học tập
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('class-schedule')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'class-schedule'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Lớp & lịch học
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'activities'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Hoạt động
              </button>
            </div>

            {/* TAB 1: Hồ sơ (Mục 5.4.4.1) */}
            {activeTab === 'profile' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                    Thông tin định danh và tài khoản
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4 text-xs">
                    <div>
                      <span className="text-on-surface-variant block font-semibold">Họ và tên</span>
                      <strong className="text-sm font-bold text-on-surface mt-0.5 block">{student.fullName}</strong>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Username</span>
                      <span className="font-mono text-xs text-on-surface font-semibold mt-0.5 block">{student.username}</span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Email</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block truncate" title={student.email}>
                        {student.email}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Số điện thoại</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block">
                        {student.phoneNumber || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Ngày sinh</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block">
                        {formatDate(student.dateOfBirth)}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Giới tính</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block">
                        {student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Địa chỉ</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block">
                        {student.address || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Trạng thái</span>
                      <span className="text-xs font-semibold text-on-surface mt-0.5 block">
                        {student.active ? 'Đang hoạt động' : 'Đang khóa'}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Ngày tạo tài khoản</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block">
                        {formatDate(student.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Cập nhật gần nhất</span>
                      <span className="text-xs text-on-surface font-medium mt-0.5 block">
                        {formatDate(student.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parent Contact if exists */}
                {(student.parentName || student.parentPhone || student.parentEmail) && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                      Thông tin liên lạc phụ huynh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4 text-xs">
                      <div>
                        <span className="text-on-surface-variant block font-semibold">Họ tên phụ huynh</span>
                        <strong className="text-xs font-bold text-on-surface mt-0.5 block">
                          {student.parentName || '—'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-on-surface-variant block font-semibold">Số điện thoại</span>
                        <span className="text-xs text-on-surface font-medium mt-0.5 block">
                          {student.parentPhone || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-on-surface-variant block font-semibold">Email</span>
                        <span className="text-xs text-on-surface font-medium mt-0.5 block">
                          {student.parentEmail || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Học tập (Mục 5.4.4.2) */}
            {activeTab === 'learning' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                    Chỉ số gamification & tiến độ
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <span className="text-on-surface-variant font-semibold block">Total XP</span>
                      <strong className="text-base font-bold text-primary mt-1 block">
                        {number.format(student.totalXp)} XP
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <span className="text-on-surface-variant font-semibold block">Current Level</span>
                      <strong className="text-base font-bold text-on-surface mt-1 block">
                        Level {student.currentLevel}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <span className="text-on-surface-variant font-semibold block">Current Streak</span>
                      <strong className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                        {student.currentStreak} ngày
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <span className="text-on-surface-variant font-semibold block">Longest Streak</span>
                      <strong className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                        {student.longestStreak} ngày
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Quiz Summary */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                    Kết quả đánh giá Quiz
                  </h3>

                  {(!student.quizAttemptCount || student.quizAttemptCount === 0) ? (
                    <div className="py-8 text-center space-y-2">
                      <BookOpen size={32} className="text-on-surface-variant mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-on-surface-variant">Học sinh chưa có lượt làm quiz.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
                      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                        <span className="text-on-surface-variant font-semibold block">Số lần làm quiz</span>
                        <strong className="text-base font-bold text-on-surface mt-1 block">
                          {student.quizAttemptCount} bài
                        </strong>
                      </div>

                      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                        <span className="text-on-surface-variant font-semibold block">Điểm trung bình</span>
                        <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                          {student.averageScore !== null ? Number(student.averageScore).toFixed(1) : '—'} / 10
                        </strong>
                      </div>

                      <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                        <span className="text-on-surface-variant font-semibold block">Lần nộp quiz gần nhất</span>
                        <strong className="text-xs font-bold text-on-surface mt-1 block">
                          {formatDate(student.lastQuizSubmittedAt, '—')}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Lớp & lịch học (Mục 5.4.4.3) */}
            {activeTab === 'class-schedule' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                    Phân lớp và trường học
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div>
                      <span className="text-on-surface-variant block font-semibold">Trường</span>
                      <strong className="text-sm font-bold text-on-surface mt-0.5 block">{student.schoolName || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Khối</span>
                      <strong className="text-sm font-bold text-on-surface mt-0.5 block">
                        {student.gradeLevel ? `Khối ${student.gradeLevel}` : '—'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Lớp</span>
                      <strong className="text-sm font-bold text-on-surface mt-0.5 block">{student.className || 'Chưa xếp lớp'}</strong>
                    </div>

                    <div>
                      <span className="text-on-surface-variant block font-semibold">Mã học sinh</span>
                      <strong className="font-mono text-sm font-bold text-primary mt-0.5 block">{student.studentCode}</strong>
                    </div>
                  </div>
                </div>

                {/* Schedules */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                    Lịch học hiện hành
                  </h3>

                  {(!student.scheduleCount || student.scheduleCount === 0) ? (
                    <div className="py-8 text-center space-y-2">
                      <Calendar size={32} className="text-on-surface-variant mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-on-surface-variant">Học sinh chưa tạo lịch học.</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/50 mt-4 text-xs">
                      <p className="font-medium text-on-surface">
                        Học sinh hiện đang có <strong className="text-primary">{student.scheduleCount}</strong> buổi học trong thời khóa biểu cá nhân.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Hoạt động (Mục 5.4.4.4) */}
            {activeTab === 'activities' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
                    Tổng hợp hoạt động học tập
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                        <MessageSquare size={14} className="text-primary" />
                        <span className="font-semibold">Phiên chat AI</span>
                      </div>
                      <strong className="text-lg font-bold text-on-surface">
                        {student.chatSessionCount ?? 0} phiên
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                        <Calendar size={14} className="text-primary" />
                        <span className="font-semibold">Lịch học tạo</span>
                      </div>
                      <strong className="text-lg font-bold text-on-surface">
                        {student.scheduleCount ?? 0} lịch
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                        <BookOpen size={14} className="text-primary" />
                        <span className="font-semibold">Quiz attempt</span>
                      </div>
                      <strong className="text-lg font-bold text-on-surface">
                        {student.quizAttemptCount ?? 0} lượt
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/50">
                      <div className="flex items-center gap-2 text-on-surface-variant mb-1">
                        <Clock size={14} className="text-primary" />
                        <span className="font-semibold">Hoạt động gần nhất</span>
                      </div>
                      <strong className="text-xs font-bold text-on-surface block truncate">
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
    </section>
  );
}

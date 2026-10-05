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
          <nav className="flex items-center gap-2 text-xs text-[#717785] mb-2" aria-label="Breadcrumb">
            <Link to="/admin" className="hover:text-[#005cb8]">Quản trị hệ thống</Link>
            <span>/</span>
            <Link to="/admin/students" className="hover:text-[#005cb8]">Học sinh</Link>
            <span>/</span>
            <strong className="text-[#181c22] font-semibold truncate max-w-xs">
              {student?.fullName || 'Chi tiết học sinh'}
            </strong>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/students"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c1c6d5] bg-white text-xs font-semibold text-[#414753] hover:text-[#005cb8] hover:border-[#005cb8]/40 hover:bg-[#f1f3fc] transition-all"
            >
              <ArrowLeft size={14} /> Quay lại
            </Link>

            <h1 id="admin-student-detail-title" className="text-xl sm:text-2xl font-bold text-[#181c22]">
              {student ? student.fullName : 'Hồ sơ học sinh'}
            </h1>

            {student && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
            )}
          </div>
        </div>

        {/* Actions in top bar */}
        {student && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#005cb8] bg-[#d6e3ff]/70 hover:bg-[#d6e3ff] rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <Pencil size={15} />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLockUnlockOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all active:scale-95 cursor-pointer ${
                student.active
                  ? 'bg-white text-[#ba1a1a] border-[#ba1a1a]/40 hover:bg-[#ffdad6]/40'
                  : 'bg-white text-[#005cb8] border-[#005cb8]/40 hover:bg-[#d6e3ff]/40'
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
          <div className="h-32 bg-[#ebedf7] rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#ebedf7] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-[#ebedf7] rounded-xl" />
        </div>
      )}

      {/* Error State */}
      {!loading && (error || !student) && (
        <div className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] p-6 text-center space-y-3" role="alert">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#ba1a1a] text-white mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-[#93000a]">Không thể tải thông tin học sinh</h2>
          <p className="text-xs text-[#93000a] max-w-md mx-auto">{error || 'Học sinh không tồn tại hoặc đã bị xóa.'}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadStudent}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={14} /> Thử lại
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="px-4 py-2 border border-[#93000a] text-[#93000a] hover:bg-white/50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
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
          <div className="rounded-xl border border-[#c1c6d5]/50 bg-white p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-[#d6e3ff] text-[#00458d] flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden ring-2 ring-[#005cb8]/20 shadow-xs">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[#181c22] truncate">{student.fullName}</h2>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-[#f1f3fc] text-[#414753] hover:text-[#005cb8] px-2 py-0.5 rounded border border-[#c1c6d5]/40 transition-colors cursor-pointer"
                    title="Sao chép mã học sinh"
                  >
                    <span>{student.studentCode}</span>
                    {copiedCode ? <Check size={11} className="text-[#166534]" /> : <Copy size={11} />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#717785]">
                  <span>{student.email}</span>
                  <span>·</span>
                  <span className="font-medium text-[#414753]">
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
            <div className="rounded-xl border border-[#c1c6d5]/50 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#d6e3ff] text-[#005cb8] shrink-0">
                <Trophy size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#717785] uppercase tracking-wider block">Tổng XP</span>
                <strong className="text-lg font-black text-[#005cb8]">{number.format(student.totalXp)}</strong>
              </div>
            </div>

            {/* Level */}
            <div className="rounded-xl border border-[#c1c6d5]/50 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#b6d0ff] text-[#3f5881] shrink-0">
                <Zap size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#717785] uppercase tracking-wider block">Cấp độ</span>
                <strong className="text-lg font-black text-[#181c22]">Level {student.currentLevel}</strong>
              </div>
            </div>

            {/* Current Streak */}
            <div className="rounded-xl border border-[#c1c6d5]/50 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#ffdbc9] text-[#9a4600] shrink-0">
                <Flame size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#717785] uppercase tracking-wider block">Streak hiện tại</span>
                <strong className="text-lg font-black text-[#9a4600]">{student.currentStreak} ngày</strong>
              </div>
            </div>

            {/* Last Activity */}
            <div className="rounded-xl border border-[#c1c6d5]/50 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#ebedf7] text-[#414753] shrink-0">
                <Clock size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#717785] uppercase tracking-wider block">Hoạt động gần đây</span>
                <strong className="text-xs font-bold text-[#181c22] block truncate" title={formatDate(student.lastActivityDate)}>
                  {formatDate(student.lastActivityDate, 'Chưa có')}
                </strong>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Mục 5.4.4) */}
          <div className="rounded-xl border border-[#c1c6d5]/50 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center gap-1 p-1.5 border-b border-[#c1c6d5]/40 bg-[#f9f9ff] overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white text-[#005cb8] shadow-xs'
                    : 'text-[#414753] hover:text-[#181c22]'
                }`}
              >
                Hồ sơ
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('learning')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'learning'
                    ? 'bg-white text-[#005cb8] shadow-xs'
                    : 'text-[#414753] hover:text-[#181c22]'
                }`}
              >
                Học tập
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('class-schedule')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'class-schedule'
                    ? 'bg-white text-[#005cb8] shadow-xs'
                    : 'text-[#414753] hover:text-[#181c22]'
                }`}
              >
                Lớp & lịch học
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'activities'
                    ? 'bg-white text-[#005cb8] shadow-xs'
                    : 'text-[#414753] hover:text-[#181c22]'
                }`}
              >
                Hoạt động
              </button>
            </div>

            {/* TAB 1: Hồ sơ (Mục 5.4.4.1) */}
            {activeTab === 'profile' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                    Thông tin định danh và tài khoản
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4 text-xs">
                    <div>
                      <span className="text-[#717785] block font-semibold">Họ và tên</span>
                      <strong className="text-sm font-bold text-[#181c22] mt-0.5 block">{student.fullName}</strong>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Username</span>
                      <span className="font-mono text-xs text-[#181c22] font-semibold mt-0.5 block">{student.username}</span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Email</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block truncate" title={student.email}>
                        {student.email}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Số điện thoại</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                        {student.phoneNumber || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Ngày sinh</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                        {formatDate(student.dateOfBirth)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Giới tính</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                        {student.gender === 'MALE' ? 'Nam' : student.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Địa chỉ</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                        {student.address || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Trạng thái</span>
                      <span className="text-xs font-semibold text-[#181c22] mt-0.5 block">
                        {student.active ? 'Đang hoạt động' : 'Đang khóa'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Ngày tạo tài khoản</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                        {formatDate(student.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Cập nhật gần nhất</span>
                      <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                        {formatDate(student.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parent Contact if exists */}
                {(student.parentName || student.parentPhone || student.parentEmail) && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                      Thông tin liên lạc phụ huynh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-4 text-xs">
                      <div>
                        <span className="text-[#717785] block font-semibold">Họ tên phụ huynh</span>
                        <strong className="text-xs font-bold text-[#181c22] mt-0.5 block">
                          {student.parentName || '—'}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[#717785] block font-semibold">Số điện thoại</span>
                        <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
                          {student.parentPhone || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#717785] block font-semibold">Email</span>
                        <span className="text-xs text-[#181c22] font-medium mt-0.5 block">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                    Chỉ số gamification & tiến độ
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <span className="text-[#717785] font-semibold block">Total XP</span>
                      <strong className="text-base font-bold text-[#005cb8] mt-1 block">
                        {number.format(student.totalXp)} XP
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <span className="text-[#717785] font-semibold block">Current Level</span>
                      <strong className="text-base font-bold text-[#181c22] mt-1 block">
                        Level {student.currentLevel}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <span className="text-[#717785] font-semibold block">Current Streak</span>
                      <strong className="text-base font-bold text-[#9a4600] mt-1 block">
                        {student.currentStreak} ngày
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <span className="text-[#717785] font-semibold block">Longest Streak</span>
                      <strong className="text-base font-bold text-[#9a4600] mt-1 block">
                        {student.longestStreak} ngày
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Quiz Summary */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                    Kết quả đánh giá Quiz
                  </h3>

                  {(!student.quizAttemptCount || student.quizAttemptCount === 0) ? (
                    <div className="py-8 text-center space-y-2">
                      <BookOpen size={32} className="text-[#717785] mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-[#717785]">Học sinh chưa có lượt làm quiz.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
                      <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                        <span className="text-[#717785] font-semibold block">Số lần làm quiz</span>
                        <strong className="text-base font-bold text-[#181c22] mt-1 block">
                          {student.quizAttemptCount} bài
                        </strong>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                        <span className="text-[#717785] font-semibold block">Điểm trung bình</span>
                        <strong className="text-base font-bold text-[#166534] mt-1 block">
                          {student.averageScore !== null ? Number(student.averageScore).toFixed(1) : '—'} / 10
                        </strong>
                      </div>

                      <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                        <span className="text-[#717785] font-semibold block">Lần nộp quiz gần nhất</span>
                        <strong className="text-xs font-bold text-[#181c22] mt-1 block">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                    Phân lớp và trường học
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div>
                      <span className="text-[#717785] block font-semibold">Trường</span>
                      <strong className="text-sm font-bold text-[#181c22] mt-0.5 block">{student.schoolName || '—'}</strong>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Khối</span>
                      <strong className="text-sm font-bold text-[#181c22] mt-0.5 block">
                        {student.gradeLevel ? `Khối ${student.gradeLevel}` : '—'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Lớp</span>
                      <strong className="text-sm font-bold text-[#181c22] mt-0.5 block">{student.className || 'Chưa xếp lớp'}</strong>
                    </div>

                    <div>
                      <span className="text-[#717785] block font-semibold">Mã học sinh</span>
                      <strong className="font-mono text-sm font-bold text-[#005cb8] mt-0.5 block">{student.studentCode}</strong>
                    </div>
                  </div>
                </div>

                {/* Schedules */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                    Lịch học hiện hành
                  </h3>

                  {(!student.scheduleCount || student.scheduleCount === 0) ? (
                    <div className="py-8 text-center space-y-2">
                      <Calendar size={32} className="text-[#717785] mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-[#717785]">Học sinh chưa tạo lịch học.</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40 mt-4 text-xs">
                      <p className="font-medium text-[#181c22]">
                        Học sinh hiện đang có <strong className="text-[#005cb8]">{student.scheduleCount}</strong> buổi học trong thời khóa biểu cá nhân.
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] pb-2 border-b border-[#c1c6d5]/30">
                    Tổng hợp hoạt động học tập
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <div className="flex items-center gap-2 text-[#717785] mb-1">
                        <MessageSquare size={14} className="text-[#005cb8]" />
                        <span className="font-semibold">Phiên chat AI</span>
                      </div>
                      <strong className="text-lg font-bold text-[#181c22]">
                        {student.chatSessionCount ?? 0} phiên
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <div className="flex items-center gap-2 text-[#717785] mb-1">
                        <Calendar size={14} className="text-[#005cb8]" />
                        <span className="font-semibold">Lịch học tạo</span>
                      </div>
                      <strong className="text-lg font-bold text-[#181c22]">
                        {student.scheduleCount ?? 0} lịch
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <div className="flex items-center gap-2 text-[#717785] mb-1">
                        <BookOpen size={14} className="text-[#005cb8]" />
                        <span className="font-semibold">Quiz attempt</span>
                      </div>
                      <strong className="text-lg font-bold text-[#181c22]">
                        {student.quizAttemptCount ?? 0} lượt
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-lg bg-[#f1f3fc] border border-[#c1c6d5]/40">
                      <div className="flex items-center gap-2 text-[#717785] mb-1">
                        <Clock size={14} className="text-[#005cb8]" />
                        <span className="font-semibold">Hoạt động gần nhất</span>
                      </div>
                      <strong className="text-xs font-bold text-[#181c22] block truncate">
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

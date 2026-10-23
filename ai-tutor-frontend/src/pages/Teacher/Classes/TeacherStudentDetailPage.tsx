import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { fetchStudentDetail } from '../../../services/adminStudentApi';
import { fetchStudyStudent } from '../../../services/studyClassApi';
import { fetchTeacherStudent } from '../../../services/teacherClassApi';
import type { AdminStudentDetail } from '../../../types/adminStudent';

const number = new Intl.NumberFormat('vi-VN');

function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('vi-VN');
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-medium text-on-surface">{value}</p>
    </div>
  );
}

export default function TeacherStudentDetailPage() {
  const { classId = '', studentId = '' } = useParams();
  const location = useLocation();
  const studyClass = location.pathname.includes('/study-classes/');
  const { user } = useAuth();
  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError('');
    const load = studyClass
      ? fetchStudyStudent(classId, studentId)
      : user?.role === 'ADMIN'
        ? fetchStudentDetail(studentId)
        : fetchTeacherStudent(studentId);
    load
      .then((detail) => {
        if (!disposed) setStudent(detail);
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được hồ sơ học sinh');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [classId, studentId, studyClass, user?.role, retry]);

  return (
    <section className="space-y-5">
      <Link to={studyClass ? `/teacher/study-classes/${classId}` : `/teacher/classes/${classId}`} className="text-sm font-semibold text-primary">← Quay lại lớp</Link>
      <div>
        <h1 className="text-2xl font-bold text-on-surface">{student?.fullName || 'Hồ sơ học sinh'}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Thông tin chỉ để theo dõi. Tài khoản học sinh được quản lý ở trang Admin.</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm" role="alert">
          <p>{error}</p>
          <button type="button" className="mt-2 font-semibold text-primary" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
        </div>
      ) : null}
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải hồ sơ...</p> : null}
      {student ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="space-y-4 rounded-2xl border border-outline-variant p-4">
            <h2 className="font-bold text-on-surface">Thông tin</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mã học sinh" value={student.studentCode} />
              <Field label="Email" value={student.email} />
              <Field label="Lớp" value={student.className || '—'} />
              <Field label="Khối" value={student.gradeLevel || '—'} />
              <Field label="Trường" value={student.schoolName || '—'} />
              <Field label="Trạng thái" value={student.active ? 'Đang học' : 'Đã khóa'} />
            </div>
          </article>
          <article className="space-y-4 rounded-2xl border border-outline-variant p-4">
            <h2 className="font-bold text-on-surface">Học tập</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="XP" value={number.format(student.totalXp)} />
              <Field label="Level" value={String(student.currentLevel)} />
              <Field label="Streak" value={String(student.currentStreak)} />
              <Field label="Số lượt làm quiz" value={number.format(student.quizAttemptCount)} />
              <Field label="Điểm trung bình" value={student.averageScore == null ? '—' : number.format(student.averageScore)} />
              <Field label="Lần nộp gần nhất" value={formatDate(student.lastQuizSubmittedAt)} />
              <Field label="Hoạt động gần nhất" value={formatDate(student.lastActivityDate)} />
              <Field label="Phiên chat" value={number.format(student.chatSessionCount)} />
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

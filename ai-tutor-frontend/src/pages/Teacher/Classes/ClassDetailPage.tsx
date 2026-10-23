import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getTeacherClass, listClassQuizzes, listClassStudents } from '../../../services/teacherClassApi';
import type { AdminStudentListItem, StudentSortField, SortDirection } from '../../../types/adminStudent';
import type { PageResponse } from '../../../types/adminStudent';
import { formatQuizWindow, subjectLabel } from '../../../types/assessment';
import type { TeacherClass, TeacherClassQuiz } from '../../../types/teacherClass';

const number = new Intl.NumberFormat('vi-VN');
const sorts: { label: string; sort: StudentSortField; direction: SortDirection }[] = [
  { label: 'Tên A-Z', sort: 'fullName', direction: 'asc' },
  { label: 'XP cao nhất', sort: 'totalXp', direction: 'desc' },
  { label: 'Hoạt động gần đây', sort: 'lastActivityDate', direction: 'desc' },
];

function formatDate(value: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('vi-VN');
}

export default function ClassDetailPage() {
  const { classId = '' } = useParams();
  const [schoolClass, setSchoolClass] = useState<TeacherClass | null>(null);
  const [students, setStudents] = useState<PageResponse<AdminStudentListItem> | null>(null);
  const [quizzes, setQuizzes] = useState<TeacherClassQuiz[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(sorts[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError('');
    Promise.all([
      getTeacherClass(classId),
      listClassStudents(classId, { search, page, size: 20, sort: sort.sort, direction: sort.direction }),
      listClassQuizzes(classId),
    ])
      .then(([info, roster, published]) => {
        if (disposed) return;
        setSchoolClass(info);
        setStudents(roster);
        setQuizzes(published);
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được lớp học');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [classId, search, page, sort, retry]);

  const rows = students?.content || [];

  return (
    <section className="space-y-5">
      <Link to="/teacher/classes" className="text-sm font-semibold text-primary">← Lớp học của tôi</Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{schoolClass?.name || 'Lớp học'}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {schoolClass ? `Khối ${schoolClass.gradeLevel}${schoolClass.subject ? ` · ${schoolClass.subject}` : ''} · ${schoolClass.studentCount} học sinh` : 'Đang tải thông tin lớp'}
          </p>
        </div>
        <Link to={`/teacher/analytics?classId=${classId}`} className="rounded-xl border border-outline-variant px-4 py-2 text-center text-sm font-semibold">
          Xem phân tích lớp
        </Link>
      </div>
      {error ? (
        <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm" role="alert">
          <p>{error}</p>
          <button type="button" className="mt-2 font-semibold text-primary" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-on-surface">
          Tìm học sinh
          <input
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm"
            value={searchInput}
            placeholder="Tên, email, username hoặc mã học sinh"
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
          Sắp xếp
          <select
            className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm"
            value={`${sort.sort}:${sort.direction}`}
            onChange={(event) => {
              const next = sorts.find((item) => `${item.sort}:${item.direction}` === event.target.value) || sorts[0];
              setSort(next);
              setPage(1);
            }}
          >
            {sorts.map((item) => (
              <option key={`${item.sort}:${item.direction}`} value={`${item.sort}:${item.direction}`}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className="text-sm text-on-surface-variant">Đang tải sĩ số...</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{search ? 'Không có học sinh phù hợp.' : 'Lớp chưa có học sinh.'}</p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-outline-variant md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-container text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-semibold">Học sinh</th>
                  <th className="px-4 py-3 font-semibold">Mã</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">XP</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Streak</th>
                  <th className="px-4 py-3 font-semibold">Hoạt động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => (
                  <tr key={student.studentId} className="border-t border-outline-variant">
                    <td className="px-4 py-3">
                      <Link className="font-semibold text-primary hover:underline" to={`/teacher/classes/${classId}/students/${student.studentId}`}>
                        {student.fullName}
                      </Link>
                      {!student.active ? <p className="text-xs text-error">Đã khóa</p> : null}
                    </td>
                    <td className="px-4 py-3">{student.studentCode}</td>
                    <td className="px-4 py-3">{student.email}</td>
                    <td className="px-4 py-3">{number.format(student.totalXp)}</td>
                    <td className="px-4 py-3">{student.currentLevel}</td>
                    <td className="px-4 py-3">{student.currentStreak}</td>
                    <td className="px-4 py-3">{formatDate(student.lastActivityDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {rows.map((student) => (
              <Link key={student.studentId} to={`/teacher/classes/${classId}/students/${student.studentId}`} className="block rounded-2xl border border-outline-variant p-4">
                <p className="font-semibold text-primary">{student.fullName}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{student.studentCode} · {student.email}</p>
                <p className="mt-2 text-sm">{number.format(student.totalXp)} XP · Level {student.currentLevel} · Streak {student.currentStreak}</p>
                <p className="mt-1 text-xs text-on-surface-variant">Hoạt động: {formatDate(student.lastActivityDate)}{student.active ? '' : ' · Đã khóa'}</p>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="rounded-xl border border-outline-variant px-3 py-2 disabled:opacity-40" disabled={!students?.hasPrevious} onClick={() => setPage((value) => value - 1)}>Trước</button>
            <span>Trang {students?.page || page}/{students?.totalPages || 1}</span>
            <button type="button" className="rounded-xl border border-outline-variant px-3 py-2 disabled:opacity-40" disabled={!students?.hasNext} onClick={() => setPage((value) => value + 1)}>Sau</button>
          </div>
        </>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-on-surface">Đề đã phát hành</h2>
        {!loading && quizzes.length === 0 ? <p className="text-sm text-on-surface-variant">Chưa có đề nào được phát hành cho lớp này.</p> : null}
        <div className="grid gap-3 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <article key={quiz.id} className="rounded-2xl border border-outline-variant p-4">
              <h3 className="font-semibold text-on-surface">{quiz.title}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                {subjectLabel(quiz.subject)} · {quiz.questionCount} câu · {quiz.attemptCount} lượt làm · {quiz.timeLimitMinutes} phút · {formatQuizWindow(quiz.availableFrom, quiz.availableUntil)}
              </p>
              <Link className="mt-3 inline-block text-sm font-semibold text-primary" to={`/teacher/quizzes/${quiz.id}/statistics`}>Xem thống kê</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

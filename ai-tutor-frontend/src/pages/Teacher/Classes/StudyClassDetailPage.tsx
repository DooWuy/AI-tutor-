import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { actOnStudyRequest, dissolveStudyClass, getStudyClass, listStudyClassQuizzes, listStudyClassStudents, listStudyRequests, updateStudyClass } from '../../../services/studyClassApi';
import type { AdminStudentListItem, PageResponse, SortDirection, StudentSortField } from '../../../types/adminStudent';
import { formatQuizWindow, subjectLabel } from '../../../types/assessment';
import type { TeacherClassQuiz } from '../../../types/teacherClass';
import type { StudyClass, StudyMember } from '../../../types/studyClass';

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

export default function StudyClassDetailPage() {
  const { classId = '' } = useParams();
  const [studyClass, setStudyClass] = useState<StudyClass | null>(null);
  const [requests, setRequests] = useState<StudyMember[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState('40');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDissolve, setConfirmDissolve] = useState(false);
  const [reload, setReload] = useState(0);
  const [students, setStudents] = useState<PageResponse<AdminStudentListItem> | null>(null);
  const [quizzes, setQuizzes] = useState<TeacherClassQuiz[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(sorts[0]);

  useEffect(() => {
    let disposed = false;
    setError('');
    Promise.all([getStudyClass(classId), listStudyRequests(classId)])
      .then(([detail, pending]) => {
        if (disposed) return;
        setStudyClass(detail);
        setRequests(pending);
        setName(detail.name);
        setDescription(detail.description ?? '');
        setMaxStudents(String(detail.maxStudents));
        setEndDate(detail.endDate ?? '');
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được lớp');
      });
    return () => {
      disposed = true;
    };
  }, [classId, reload]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let disposed = false;
    Promise.all([
      listStudyClassStudents(classId, { search, page, size: 20, sort: sort.sort, direction: sort.direction }),
      listStudyClassQuizzes(classId),
    ])
      .then(([roster, published]) => {
        if (disposed) return;
        setStudents(roster);
        setQuizzes(published);
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được sĩ số');
      });
    return () => {
      disposed = true;
    };
  }, [classId, search, page, sort, reload]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const updated = await updateStudyClass(classId, {
        name: name.trim(),
        description: description.trim(),
        maxStudents: Number(maxStudents),
        endDate: endDate || null,
      });
      setStudyClass(updated);
      setNotice('Đã lưu thông tin lớp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không lưu được lớp');
    }
  }

  async function dissolve() {
    setError('');
    try {
      const updated = await dissolveStudyClass(classId);
      setStudyClass(updated);
      setConfirmDissolve(false);
      setNotice('Đã giải tán lớp');
      setReload((value) => value + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không giải tán được lớp');
    }
  }

  async function decide(requestId: string, action: 'approve' | 'reject') {
    setError('');
    try {
      await actOnStudyRequest(classId, requestId, action);
      setReload((value) => value + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không xử lý được yêu cầu');
    }
  }

  const active = studyClass?.status === 'ACTIVE';
  const rows = students?.content || [];

  return (
    <section className="space-y-6">
      <Link to="/teacher/classes" className="text-sm font-semibold text-primary">← Lớp học của tôi</Link>
      {error ? <p className="text-sm text-error" role="alert">{error}</p> : null}
      {notice ? <p className="text-sm text-primary">{notice}</p> : null}
      {!studyClass && !error ? <p className="text-sm text-on-surface-variant">Đang tải lớp...</p> : null}
      {studyClass ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">{studyClass.name}</h1>
              <p className="mt-1 text-sm text-on-surface-variant">Mã lớp {studyClass.classCode} · {studyClass.approvedCount}/{studyClass.maxStudents} học sinh</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/teacher/analytics?classId=${classId}`} className="rounded-xl border border-outline-variant px-4 py-2 text-sm font-semibold">
                Xem phân tích lớp
              </Link>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                {active ? 'Đang hoạt động' : 'Đã giải tán'}
              </span>
            </div>
          </div>
          <form className="space-y-3 rounded-2xl border border-outline-variant bg-surface p-4" onSubmit={save}>
            <label className="block text-sm font-semibold text-on-surface">
              Tên lớp
              <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} disabled={!active} required maxLength={64} />
            </label>
            <label className="block text-sm font-semibold text-on-surface">
              Mô tả
              <textarea className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} disabled={!active} rows={3} maxLength={1000} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-on-surface">
                Sĩ số tối đa
                <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" type="number" min={1} max={200} value={maxStudents} onChange={(event) => setMaxStudents(event.target.value)} disabled={!active} required />
              </label>
              <label className="block text-sm font-semibold text-on-surface">
                Hạn kết thúc
                <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={!active} />
              </label>
            </div>
            {active ? (
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Lưu</button>
                <button type="button" className="rounded-xl border border-error px-4 py-2 text-sm font-semibold text-error" onClick={() => setConfirmDissolve(true)}>Giải tán lớp</button>
              </div>
            ) : null}
          </form>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Học sinh đã duyệt</h2>
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
            {rows.length === 0 ? (
              <p className="text-sm text-on-surface-variant">{search ? 'Không có học sinh phù hợp.' : 'Chưa có học sinh nào.'}</p>
            ) : (
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
                            <Link className="font-semibold text-primary hover:underline" to={`/teacher/study-classes/${classId}/students/${student.studentId}`}>
                              {student.fullName}
                            </Link>
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
                    <Link key={student.studentId} to={`/teacher/study-classes/${classId}/students/${student.studentId}`} className="block rounded-2xl border border-outline-variant p-4">
                      <p className="font-semibold text-primary">{student.fullName}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{student.studentCode} · {student.email}</p>
                      <p className="mt-2 text-sm">{number.format(student.totalXp)} XP · Level {student.currentLevel} · Streak {student.currentStreak}</p>
                    </Link>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" className="rounded-xl border border-outline-variant px-3 py-2 disabled:opacity-40" disabled={!students?.hasPrevious} onClick={() => setPage((value) => value - 1)}>Trước</button>
                  <span>Trang {students?.page || page}/{students?.totalPages || 1}</span>
                  <button type="button" className="rounded-xl border border-outline-variant px-3 py-2 disabled:opacity-40" disabled={!students?.hasNext} onClick={() => setPage((value) => value + 1)}>Sau</button>
                </div>
              </>
            )}
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">Đề đã phát hành</h2>
            {quizzes.length === 0 ? <p className="text-sm text-on-surface-variant">Chưa có đề nào được phát hành cho lớp này.</p> : null}
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
          <div>
            <h2 className="text-lg font-bold text-on-surface">Yêu cầu gia nhập</h2>
            {requests.length === 0 ? <p className="mt-2 text-sm text-on-surface-variant">Không có yêu cầu đang chờ.</p> : (
              <ul className="mt-2 space-y-2">
                {requests.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-outline-variant px-3 py-2">
                    <div className="text-sm">
                      <p className="font-semibold text-on-surface">{item.fullName}</p>
                      <p className="text-on-surface-variant">{item.studentCode} · {item.email}</p>
                    </div>
                    {active ? (
                      <div className="flex gap-2">
                        <button type="button" className="rounded-xl bg-primary px-3 py-1 text-sm font-semibold text-on-primary" onClick={() => decide(item.id, 'approve')}>Chấp nhận</button>
                        <button type="button" className="rounded-xl border border-outline-variant px-3 py-1 text-sm font-semibold" onClick={() => decide(item.id, 'reject')}>Từ chối</button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
      {confirmDissolve ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation" onClick={() => setConfirmDissolve(false)}>
          <div className="w-full max-w-md rounded-2xl bg-surface p-5" role="dialog" aria-labelledby="dissolve-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="dissolve-title" className="text-lg font-bold text-on-surface">Giải tán lớp này?</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Lớp đã giải tán không nhận học sinh mới và không sửa lại được.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold" onClick={() => setConfirmDissolve(false)}>Hủy</button>
              <button type="button" className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-on-error" onClick={dissolve}>Giải tán</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

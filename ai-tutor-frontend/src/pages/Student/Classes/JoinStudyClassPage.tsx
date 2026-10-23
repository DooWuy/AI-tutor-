import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, FileText, CheckCircle2, Calendar, Eye, AlertCircle } from 'lucide-react';
import { formatQuizWindow, subjectLabel } from '../../../types/assessment';
import { joinStudyClass, listMyClassQuizzes, listMySchoolClass, listMyStudyClasses } from '../../../services/studyClassApi';
import { getStoredSession } from '../../../services/authApi';
import { studentQuizApi } from '../../../services/studentQuizApi';
import type { StudentPublishedQuiz, StudentSchoolClass, StudentStudyClassCard } from '../../../types/studyClass';

const enrollmentLabel: Record<string, string> = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã tham gia',
  REJECTED: 'Bị từ chối',
};

const classLabel: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  DISSOLVED: 'Đã giải tán',
};

function formatDate(value: string | null) {
  if (!value) return 'Không giới hạn';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('vi-VN');
}

export default function JoinStudyClassPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'quizzes' ? 'quizzes' : 'classes';
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [classes, setClasses] = useState<StudentStudyClassCard[]>([]);
  const [schoolClass, setSchoolClass] = useState<StudentSchoolClass | null>(null);
  const [quizzes, setQuizzes] = useState<StudentPublishedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);

  // Modal and starting state for quizzes (reused from PracticeTopicPage)
  const [selectedQuiz, setSelectedQuiz] = useState<StudentPublishedQuiz | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setLoadError('');
    Promise.all([listMyStudyClasses(), listMySchoolClass(), listMyClassQuizzes()])
      .then(([rows, school, published]) => {
        if (disposed) return;
        setClasses(rows || []);
        setSchoolClass(school);
        setQuizzes(published || []);
      })
      .catch((err: unknown) => {
        if (!disposed) setLoadError(err instanceof Error ? err.message : 'Không tải được lớp học');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, [reload]);

  function selectTab(next: 'classes' | 'quizzes') {
    setParams(next === 'quizzes' ? { tab: 'quizzes' } : {});
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError('');
    setMessage('');
    try {
      const result = await joinStudyClass(code.trim().toUpperCase());
      setMessage(`Đã gửi yêu cầu vào lớp ${result.className}. Giáo viên sẽ duyệt yêu cầu này.`);
      setCode('');
      setReload((value) => value + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không gửi được yêu cầu');
    } finally {
      setSending(false);
    }
  }

  function handleStartQuiz(quiz: StudentPublishedQuiz) {
    if (!quiz.canStart) return;
    setSelectedQuiz(quiz);
    setShowConfirmModal(true);
  }

  async function confirmStart() {
    if (!selectedQuiz || starting) return;
    setStarting(true);
    setError('');
    try {
      const draft = await studentQuizApi.saveDraft(selectedQuiz.id, []);
      sessionStorage.setItem(`quiz-draft:${getStoredSession()?.user.userId}:${selectedQuiz.id}`, draft.draftId);
      if (draft.attemptId) {
        navigate(`/student/quiz-results/${draft.attemptId}?from=classes`);
      } else {
        navigate(`/student/quiz-attempt/${selectedQuiz.id}`, { state: { draftId: draft.draftId, from: 'classes' } });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không mở được đề thi';
      setError(msg.includes('incomplete') ? 'Đề thi chưa hoàn thiện câu hỏi hoặc đang được giáo viên cập nhật. Vui lòng liên hệ giáo viên.' : msg);
      setShowConfirmModal(false);
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Lớp học</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Xem lớp đang học và đề thi giáo viên đã phát hành.
        </p>
      </div>
      <div className="flex gap-2 border-b border-outline-variant/40">
        <button
          type="button"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'classes' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => selectTab('classes')}
        >
          Lớp học
        </button>
        <button
          type="button"
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'quizzes' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => selectTab('quizzes')}
        >
          Đề thi
        </button>
      </div>

      {loadError ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 text-error text-sm" role="alert">
          <AlertCircle size={18} />
          <span>{loadError}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 text-error text-sm" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? <p className="text-sm text-on-surface-variant">Đang tải...</p> : null}

      {!loading && tab === 'classes' ? (
        <div className="space-y-4 max-w-3xl">
          <form className="space-y-3 rounded-2xl border border-outline-variant bg-surface p-4" onSubmit={submit}>
            <h2 className="text-lg font-bold text-on-surface">Xin vào lớp mới</h2>
            <p className="text-sm text-on-surface-variant">Nhập mã 6 ký tự giáo viên cung cấp. Yêu cầu chờ giáo viên chấp nhận.</p>
            <label className="block text-sm font-semibold text-on-surface">
              Mã lớp
              <input
                className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 uppercase tracking-widest"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                minLength={6}
                maxLength={6}
                required
                autoCapitalize="characters"
              />
            </label>
            {message ? <p className="text-sm text-primary">{message}</p> : null}
            <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60" disabled={sending}>
              {sending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>

          {schoolClass ? (
            <article className="space-y-2 rounded-2xl border border-outline-variant bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Lớp đang học</p>
                  <h2 className="text-lg font-bold text-on-surface">{schoolClass.name}</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Lớp nhà trường</span>
              </div>
              <p className="text-sm text-on-surface-variant">
                Khối {schoolClass.gradeLevel}
                {schoolClass.schoolName ? ` · ${schoolClass.schoolName}` : ''}
                {` · Năm học ${schoolClass.academicYear}`}
              </p>
            </article>
          ) : null}

          {classes.length === 0 && !schoolClass ? (
            <p className="text-sm text-on-surface-variant">Bạn chưa có lớp đang học.</p>
          ) : null}
          {classes.map((item) => (
            <article key={item.enrollmentId} className="space-y-2 rounded-2xl border border-outline-variant bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-on-surface">{item.name}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Mã {item.classCode}
                    {item.teacherName ? ` · Giáo viên ${item.teacherName}` : ''}
                    {` · ${item.approvedCount}/${item.maxStudents} học sinh`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {enrollmentLabel[item.enrollmentStatus] || item.enrollmentStatus}
                  </span>
                  <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                    {classLabel[item.classStatus] || item.classStatus}
                  </span>
                </div>
              </div>
              {item.description ? <p className="text-sm text-on-surface">{item.description}</p> : null}
              <p className="text-xs text-on-surface-variant">
                Bắt đầu {formatDate(item.startDate)} · Kết thúc {formatDate(item.endDate)}
              </p>
              {item.enrollmentStatus === 'PENDING' ? (
                <p className="text-sm text-on-surface-variant">Đề thi hiện sau khi giáo viên chấp nhận yêu cầu.</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {!loading && tab === 'quizzes' ? (
        <div>
          {quizzes.length === 0 ? (
            <div className="py-12 text-center text-outline border border-dashed border-outline-variant/60 rounded-2xl">
              Giáo viên chưa phát hành đề cho lớp của bạn.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-2xl hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-on-surface line-clamp-1">{quiz.title}</h3>
                      {quiz.canReview ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={14} /> Đã làm {quiz.score != null ? `(${quiz.score.toFixed(1)}/10)` : ''}
                        </span>
                      ) : quiz.phase === 'UPCOMING' ? (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-md font-medium shrink-0">
                          Sắp mở
                        </span>
                      ) : quiz.phase === 'CLOSED' ? (
                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium shrink-0">
                          Đã kết thúc
                        </span>
                      ) : (
                        <span className="bg-primary-fixed text-on-primary-fixed text-xs px-2.5 py-1 rounded-md font-medium shrink-0">
                          Đang phát hành
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mb-3">
                      {subjectLabel(quiz.subject)}
                      {quiz.teacherName ? ` · GV ${quiz.teacherName}` : ''}
                      {quiz.classNames ? ` · ${quiz.classNames}` : ''}
                    </p>
                  </div>

                  <div className="mt-auto pt-3 border-t border-outline-variant/20 flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-outline">
                      <div className="flex items-center gap-1.5">
                        <Clock size={16} /> {quiz.timeLimitMinutes} phút
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText size={16} /> {quiz.questionCount} câu hỏi
                      </div>
                    </div>
                    {(quiz.availableFrom || quiz.availableUntil) && (
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Calendar size={14} /> {formatQuizWindow(quiz.availableFrom, quiz.availableUntil)}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {quiz.canReview && quiz.attemptId && (
                        <Link
                          to={`/student/quiz-results/${quiz.attemptId}?from=classes`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <Eye size={16} /> Xem bài làm
                        </Link>
                      )}
                      {quiz.canStart && (
                        <button
                          type="button"
                          onClick={() => handleStartQuiz(quiz)}
                          className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                          {quiz.canReview ? 'Làm lại' : 'Làm bài'}
                        </button>
                      )}
                      {!quiz.canStart && !quiz.canReview && (
                        <span className="text-xs text-outline italic">
                          {quiz.phase === 'UPCOMING' ? 'Chưa đến thời gian mở đề' : 'Đã hết thời gian làm bài'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Confirmation Modal reused from PracticeTopicPage */}
      {showConfirmModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-on-surface mb-2">{selectedQuiz.title}</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              {subjectLabel(selectedQuiz.subject)}
              {selectedQuiz.teacherName ? ` · GV ${selectedQuiz.teacherName}` : ''}
              {selectedQuiz.classNames ? ` · ${selectedQuiz.classNames}` : ''}
            </p>
            <div className="flex gap-4 text-sm text-on-surface-variant mb-4 bg-surface-container-low p-3 rounded-lg">
              <span className="flex items-center gap-1.5"><Clock size={16} className="text-primary"/> {selectedQuiz.timeLimitMinutes} phút</span>
              <span className="flex items-center gap-1.5"><FileText size={16} className="text-primary"/> {selectedQuiz.questionCount} câu hỏi</span>
            </div>
            {(selectedQuiz.availableFrom || selectedQuiz.availableUntil) && (
              <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" /> {formatQuizWindow(selectedQuiz.availableFrom, selectedQuiz.availableUntil)}
              </p>
            )}
            <p className="text-sm text-on-surface mb-6">
              Bạn có chắc chắn muốn bắt đầu làm bài ngay bây giờ? Thời gian sẽ được đếm ngược ngay khi bạn xác nhận.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg font-medium hover:bg-surface-container transition-colors"
                disabled={starting}
              >
                Hủy
              </button>
              <button 
                onClick={() => void confirmStart()}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                disabled={starting}
              >
                {starting ? 'Đang mở đề...' : 'Bắt đầu làm bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


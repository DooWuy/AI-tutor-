import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, CheckCircle2, ArrowLeft, ArrowRight, Cloud } from 'lucide-react';
import { studentQuizApi, QuizApiError, type QuizContent, type QuizDraft, type QuizAnswer } from '../../../services/studentQuizApi';
import { getStoredSession } from '../../../services/authApi';
import './Quiz.css';

const valuesOf = (values: Record<string, string>): QuizAnswer[] => Object.entries(values).map(([questionId, value]) => ({ questionId, value }));
const timeText = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

export function QuizAttemptPage() {
  const { quizId = '' } = useParams();
  return <QuizAttemptSession key={quizId} quizId={quizId} />;
}

function QuizAttemptSession({ quizId }: { quizId: string }) {
  const draftKey = `quiz-draft:${getStoredSession()?.user.userId}:${quizId}`;
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizContent | null>(null);
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('Đã lưu');
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [retryLoad, setRetryLoad] = useState(0);
  const latest = useRef(values);
  const activeDraft = useRef<QuizDraft | null>(null);
  const deadline = useRef(0);
  const inFlight = useRef<Promise<unknown>>(Promise.resolve());
  const submitLock = useRef(false);
  const automatic = useRef(false);
  const mounted = useRef(true);
  const revision = useRef(0);
  const persistedRevision = useRef(-1);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    async function load() {
      try {
        const content = await studentQuizApi.getQuiz(quizId);
        const storedId = location.state?.draftId || sessionStorage.getItem(draftKey);
        const started = storedId ? await studentQuizApi.getDraft(storedId) : await studentQuizApi.saveDraft(quizId, []);
        if (cancelled) return;
        if (started.attemptId) { navigate(`/student/quiz-results/${started.attemptId}`, { replace: true }); return; }
        if (started.quizId !== quizId) throw new Error('Bài làm không thuộc đề này.');
        sessionStorage.setItem(draftKey, started.draftId);
        let cached: Record<string, string> = {};
        try { cached = JSON.parse(sessionStorage.getItem(`quiz-answers:${started.draftId}`) || '{}'); } catch { /* use server snapshot */ }
        const validCache = Object.fromEntries(Object.entries(cached || {}).filter(([id, value]) => content.questions.some(q => q.id === id) && typeof value === 'string'));
        const merged = { ...Object.fromEntries(started.answers.map(a => [a.questionId, a.value || ''])), ...validCache };
        deadline.current = performance.now() + new Date(started.expiresAt).getTime() - new Date(started.serverTime).getTime();
        activeDraft.current = started; latest.current = merged;
        setValues(merged); setDraft(started); setQuiz(content); setError('');
      } catch (ex) { if (!cancelled) setError(ex instanceof Error ? ex.message : 'Không tải được bài làm.'); }
    }
    void load();
    return () => { cancelled = true; mounted.current = false; };
  }, [quizId, draftKey, location.state, navigate, retryLoad]);

  const save = useCallback(() => {
    const current = activeDraft.current;
    if (!current || submitLock.current || performance.now() >= deadline.current) return inFlight.current;
    const snapshot = valuesOf(latest.current);
    const savingRevision = revision.current;
    setSaving('Đang lưu…');
    const operation = inFlight.current.catch(() => undefined).then(async () => {
      if (submitLock.current || performance.now() >= deadline.current) return;
      await studentQuizApi.saveDraft(quizId, snapshot, current.draftId);
      persistedRevision.current = Math.max(persistedRevision.current, savingRevision);
    });
    inFlight.current = operation;
    operation.then(() => { if (mounted.current && !submitLock.current && revision.current === savingRevision) setSaving('Đã lưu'); })
      .catch(async ex => {
        if (mounted.current) setSaving('Chưa lưu được — đang chờ kết nối');
        if (ex instanceof QuizApiError && ex.status === 409) {
          try {
            const state = await studentQuizApi.getDraft(current.draftId);
            if (state.attemptId) navigate(`/student/quiz-results/${state.attemptId}`, { replace: true });
            else if (mounted.current) { setExpired(true); setError('Bài đã hết giờ. Hãy nộp để xem kết quả.'); }
          } catch { /* preserve retry state */ }
        }
      });
    return operation;
  }, [quizId, navigate]);

  const submit = useCallback(async (timedOut = false) => {
    const current = activeDraft.current;
    if (!current || submitLock.current) return;
    submitLock.current = true; setSubmitting(true); setConfirm(false); setError('');
    if (timedOut) setExpired(true);
    try {
      await inFlight.current.catch(() => undefined);
      const result = await studentQuizApi.submit(current.draftId, valuesOf(latest.current));
      window.dispatchEvent(new Event('student-profile-updated'));
      sessionStorage.removeItem(`quiz-answers:${current.draftId}`);
      navigate(`/student/quiz-results/${result.id}`, { replace: true });
    } catch (ex) {
      submitLock.current = false;
      if (mounted.current) { setSubmitting(false); setError(ex instanceof Error ? ex.message : 'Không thể nộp bài. Hãy thử lại.'); }
    }
  }, [navigate]);

  useEffect(() => {
    if (!draft) return;
    const timeout = window.setTimeout(() => { void save().catch(() => undefined); }, 500);
    return () => window.clearTimeout(timeout);
  }, [values, draft, save]);

  useEffect(() => {
    const retry = window.setInterval(() => {
      if (revision.current > persistedRevision.current && !document.hidden) void save().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(retry);
  }, [save]);

  useEffect(() => {
    if (!draft) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0 && !automatic.current) { automatic.current = true; void submit(true); }
    };
    tick(); const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [draft, submit]);

  useEffect(() => {
    const online = async () => {
      const current = activeDraft.current;
      if (!current || submitLock.current) return;
      try {
        const state = await studentQuizApi.getDraft(current.draftId);
        if (!mounted.current) return;
        if (state.attemptId) { navigate(`/student/quiz-results/${state.attemptId}`, { replace: true }); return; }
        deadline.current = performance.now() + new Date(state.expiresAt).getTime() - new Date(state.serverTime).getTime();
        if (performance.now() >= deadline.current) void submit(true); else void save().catch(() => undefined);
      } catch { if (mounted.current) setSaving('Chưa lưu được — đang chờ kết nối'); }
    };
    const visible = () => { if (document.visibilityState === 'visible') online(); };
    window.addEventListener('online', online); document.addEventListener('visibilitychange', visible);
    return () => { window.removeEventListener('online', online); document.removeEventListener('visibilitychange', visible); };
  }, [save, submit, navigate]);

  const change = (questionId: string, value: string) => {
    // The handler checks the server-derived deadline again between timer ticks.
    // oxlint-disable-next-line react/purity -- Event handler, not a render-time clock read.
    if (submitLock.current || performance.now() >= deadline.current) return;
    revision.current += 1;
    const next = { ...latest.current, [questionId]: value }; latest.current = next; setValues(next); setSaving('Đang lưu…');
    if (activeDraft.current) sessionStorage.setItem(`quiz-answers:${activeDraft.current.draftId}`, JSON.stringify(next));
  };
  if (!quiz || !draft) return <div className="quiz-page"><p role="status">{error || 'Đang tải bài làm…'}</p>{error && <><button onClick={() => setRetryLoad(n => n + 1)}>Thử lại</button><Link to="/student/practice">Quay lại luyện tập</Link></>}</div>;
  const question = quiz.questions[index];
  const answered = Object.values(values).filter(value => value.trim()).length;
  const locked = expired || submitting;
  return <div className="quiz-page">
    <header className="quiz-heading"><div><p className="quiz-eyebrow">{quiz.subject} · Luyện tập</p><h1>{quiz.title}</h1></div><span className={`quiz-timer ${seconds < 60 ? 'quiz-urgent' : ''}`} role="timer"><Clock size={20} /> {timeText(seconds)}</span></header>
    {expired && <p className="quiz-notice" role="alert">Đã hết giờ làm bài. Hệ thống tự động nộp bài của bạn. Chỉ đáp án đã lưu trước hạn được chấm.</p>}
    {error && <p className="quiz-error" role="alert">{error} <button onClick={() => void submit(expired)} disabled={submitting}>Thử nộp lại</button></p>}
    <div className="quiz-workspace"><section className="quiz-card">
      <div className="quiz-progress"><span>Câu {index + 1}/{quiz.questions.length}</span><span><CheckCircle2 size={16} /> {answered} câu đã trả lời</span></div>
      <progress value={answered} max={quiz.questions.length} aria-label="Tiến trình trả lời" />
      <h2 className="quiz-question">{question.questionText}</h2>
      <fieldset disabled={locked} className="quiz-options"><legend className="sr-only">Đáp án câu {index + 1}</legend>
        {question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE' ? question.options.map(option => <label key={option.key} className={`quiz-option ${values[question.id] === option.key ? 'quiz-selected' : ''}`}><input type="radio" name={question.id} value={option.key} checked={values[question.id] === option.key} onChange={() => change(question.id, option.key)} /><strong>{option.key}</strong><span>{option.content}</span></label>)
          : <><label htmlFor="quiz-answer">{question.type === 'FILL_IN_BLANK' ? 'Điền câu trả lời' : 'Câu trả lời ngắn'}</label><textarea id="quiz-answer" rows={4} maxLength={200} value={values[question.id] || ''} onChange={event => change(question.id, event.target.value)} placeholder="Nhập câu trả lời…" /><small>{(values[question.id] || '').length}/200 ký tự · Chấm theo đáp án chuẩn, không phân biệt hoa thường.</small></>}
      </fieldset>
      <footer className="quiz-navigation"><button disabled={index === 0} onClick={() => setIndex(n => n - 1)}><ArrowLeft size={18} /> Quay lại</button>{index < quiz.questions.length - 1 ? <button onClick={() => setIndex(n => n + 1)}>Tiếp theo <ArrowRight size={18} /></button> : <button className="quiz-primary" disabled={locked} onClick={() => setConfirm(true)}>Nộp bài</button>}</footer>
    </section><aside className="quiz-card"><h2>Danh sách câu hỏi</h2><div className="quiz-grid">{quiz.questions.map((q, i) => <button key={q.id} aria-label={`Câu ${i + 1}${values[q.id]?.trim() ? ', đã trả lời' : ''}`} aria-current={i === index ? 'step' : undefined} className={`${values[q.id]?.trim() ? 'quiz-answered' : ''} ${i === index ? 'quiz-current' : ''}`} onClick={() => setIndex(i)}>{i + 1}</button>)}</div><p className="quiz-save" role="status"><Cloud size={18} />{saving}</p><button className="quiz-primary quiz-full" disabled={locked} onClick={() => setConfirm(true)}>{submitting ? 'Đang nộp…' : 'Nộp bài'}</button></aside></div>
    {confirm && <div className="quiz-backdrop"><section className="quiz-card quiz-dialog" role="dialog" aria-modal="true" aria-labelledby="submit-title"><h2 id="submit-title">Xác nhận nộp bài?</h2><p>Bạn còn {timeText(seconds)} và {quiz.questions.length - answered} câu chưa trả lời.</p><div className="quiz-navigation"><button autoFocus onClick={() => setConfirm(false)}>Tiếp tục làm</button><button className="quiz-primary" onClick={() => void submit()}>Xác nhận nộp</button></div></section></div>}
  </div>;
}

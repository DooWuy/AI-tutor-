import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { questionBankApi, quizAdminApi } from '../../services/assessmentApi';
import type { QuestionItem, QuizDraft, QuizItem, SkillItem } from '../../types/assessment';
import { questionTypeLabel, subjectLabel } from '../../types/assessment';
import { ErrorBanner, Field, Modal, PrimaryButton, inputClass, useAssessmentBase } from './assessmentUi';
import { GRADES, SUBJECTS } from '../../types/assessment';

const emptyQuiz = (): QuizDraft => ({
  title: '',
  description: '',
  subject: 'TOAN',
  gradeLevel: '12',
  lessonId: '',
  timeLimitMinutes: 30,
  maxAttempts: 3,
  passingScore: 70,
});

export default function QuizEditorPage() {
  const { quizId } = useParams();
  const base = useAssessmentBase();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<QuizDraft>(emptyQuiz());
  const [quiz, setQuiz] = useState<QuizItem | null>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSkill, setPickerSkill] = useState('');
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [minDifficulty, setMinDifficulty] = useState(2);
  const [maxDifficulty, setMaxDifficulty] = useState(4);
  const [multipleChoice, setMultipleChoice] = useState(3);
  const [trueFalse, setTrueFalse] = useState(1);
  const [fillBlank, setFillBlank] = useState(1);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    if (!quizId) return;
    quizAdminApi.get(quizId)
      .then((data) => {
        setQuiz(data);
        setDraft({
          title: data.title,
          description: data.description || '',
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          lessonId: data.lessonId || '',
          timeLimitMinutes: data.timeLimitMinutes,
          maxAttempts: data.maxAttempts,
          passingScore: Number(data.passingScore),
        });
        setTopic(data.lessonTitle || data.title);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được đề thi'));
  }, [quizId]);

  useEffect(() => {
    questionBankApi.listSkills(draft.subject, draft.gradeLevel)
      .then(setSkills)
      .catch(() => setSkills([]));
  }, [draft.subject, draft.gradeLevel]);

  useEffect(() => {
    if (!pickerSkill) {
      setBankQuestions([]);
      return;
    }
    questionBankApi.listQuestions(pickerSkill)
      .then(setBankQuestions)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được câu hỏi'));
  }, [pickerSkill]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (!quizId) {
        const created = await quizAdminApi.create(draft);
        navigate(`${base}/quizzes/${created.id}`);
        return;
      }
      const updated = await quizAdminApi.update(quizId, draft);
      setQuiz(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được đề thi');
    } finally {
      setSaving(false);
    }
  };

  const assign = async () => {
    if (!quizId) return;
    setSaving(true);
    setError('');
    try {
      const updated = await quizAdminApi.assign(quizId, picked);
      setQuiz(updated);
      setPickerOpen(false);
      setPicked([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gán được câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (!quizId) return;
    setSaving(true);
    setError('');
    setAiMessage('AI đang biên soạn câu hỏi và lời giải chi tiết cho bạn...');
    try {
      const updated = await quizAdminApi.generate(quizId, {
        topic,
        count,
        minDifficulty,
        maxDifficulty,
        multipleChoice,
        trueFalse,
        fillBlank,
      });
      setQuiz(updated);
      setAiMessage('');
    } catch (err) {
      setAiMessage('');
      setError(err instanceof Error ? err.message : 'Không sinh được đề');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (questionId: string) => {
    if (!quizId) return;
    setError('');
    try {
      setQuiz(await quizAdminApi.removeQuestion(quizId, questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gỡ được câu hỏi');
    }
  };

  const ratioSum = multipleChoice + trueFalse + fillBlank;

  return (
    <section className="space-y-5">
      <Link className="text-sm text-primary hover:underline" to={`${base}/quizzes`}>Quản lý đề thi</Link>
      <h1 className="text-2xl font-bold text-on-surface">{quizId ? 'Soạn đề thi' : 'Tạo đề thi'}</h1>
      <ErrorBanner message={error} />
      <div className="grid gap-3 rounded-2xl border border-outline-variant p-4 md:grid-cols-2">
        <Field label="Tiêu đề">
          <input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </Field>
        <Field label="Môn học">
          <select className={inputClass} value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value, lessonId: '' })}>
            {SUBJECTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Khối lớp">
          <select className={inputClass} value={draft.gradeLevel} onChange={(event) => setDraft({ ...draft, gradeLevel: event.target.value, lessonId: '' })}>
            {GRADES.map((item) => <option key={item} value={item}>Lớp {item}</option>)}
          </select>
        </Field>
        <Field label="Bài học liên kết">
          <select className={inputClass} value={draft.lessonId} onChange={(event) => setDraft({ ...draft, lessonId: event.target.value })}>
            <option value="">Không liên kết</option>
            {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.skillCode} — {skill.name}</option>)}
          </select>
        </Field>
        <Field label="Thời gian (phút)">
          <input className={inputClass} type="number" min={1} max={180} value={draft.timeLimitMinutes} onChange={(event) => setDraft({ ...draft, timeLimitMinutes: Number(event.target.value) })} />
        </Field>
        <Field label="Số lượt tối đa">
          <input className={inputClass} type="number" min={1} max={10} value={draft.maxAttempts} onChange={(event) => setDraft({ ...draft, maxAttempts: Number(event.target.value) })} />
        </Field>
        <Field label="Điểm đạt (%)">
          <input className={inputClass} type="number" min={0} max={100} step={0.1} value={draft.passingScore} onChange={(event) => setDraft({ ...draft, passingScore: Number(event.target.value) })} />
        </Field>
        <Field label="Mô tả">
          <textarea className={`${inputClass} min-h-20`} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <PrimaryButton disabled={saving} onClick={save}>{quizId ? 'Lưu thông tin đề' : 'Tạo đề và soạn câu'}</PrimaryButton>
        </div>
      </div>

      {quiz ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-on-surface">Bộ câu hỏi ({quiz.questions?.length || 0})</h2>
            <div className="flex gap-2">
              <button type="button" className="rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold" onClick={() => setPickerOpen(true)}>Chọn từ ngân hàng</button>
              {quiz.status !== 'PUBLISHED' ? (
                <PrimaryButton onClick={async () => {
                  try {
                    setQuiz(await quizAdminApi.publish(quiz.id));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Không phát hành được');
                  }
                }}>Phát hành</PrimaryButton>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            {(quiz.questions || []).map((question, index) => (
              <article key={question.id} className="rounded-2xl border border-outline-variant p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-on-surface-variant">Câu {index + 1} · {questionTypeLabel(question.questionType)} · Mức {question.difficulty}</p>
                    <p className="mt-1 font-medium">{question.stem}</p>
                  </div>
                  <button type="button" className="text-sm font-semibold text-error" onClick={() => removeQuestion(question.id)}>Gỡ</button>
                </div>
              </article>
            ))}
            {(quiz.questions || []).length === 0 ? <p className="text-sm text-on-surface-variant">Đề chưa có câu hỏi.</p> : null}
          </div>

          <div className="space-y-3 rounded-2xl border border-outline-variant p-4">
            <h2 className="font-bold text-on-surface">AI tự động sinh đề</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Chủ đề"><input className={inputClass} value={topic} onChange={(event) => setTopic(event.target.value)} /></Field>
              <Field label="Số câu"><input className={inputClass} type="number" min={1} max={20} value={count} onChange={(event) => setCount(Number(event.target.value))} /></Field>
              <Field label="Độ khó tối thiểu"><input className={inputClass} type="number" min={1} max={5} value={minDifficulty} onChange={(event) => setMinDifficulty(Number(event.target.value))} /></Field>
              <Field label="Độ khó tối đa"><input className={inputClass} type="number" min={1} max={5} value={maxDifficulty} onChange={(event) => setMaxDifficulty(Number(event.target.value))} /></Field>
              <Field label="Trắc nghiệm"><input className={inputClass} type="number" min={0} value={multipleChoice} onChange={(event) => setMultipleChoice(Number(event.target.value))} /></Field>
              <Field label="Đúng/Sai"><input className={inputClass} type="number" min={0} value={trueFalse} onChange={(event) => setTrueFalse(Number(event.target.value))} /></Field>
              <Field label="Điền từ"><input className={inputClass} type="number" min={0} value={fillBlank} onChange={(event) => setFillBlank(Number(event.target.value))} /></Field>
            </div>
            <p className={`text-sm ${ratioSum === count ? 'text-on-surface-variant' : 'text-error'}`}>Tổng loại câu: {ratioSum}. Cần bằng số câu ({count}).</p>
            {aiMessage ? <p className="text-sm font-medium text-primary">{aiMessage}</p> : null}
            <PrimaryButton disabled={saving || ratioSum !== count || !topic.trim()} onClick={generate}>Sinh bộ câu hỏi</PrimaryButton>
          </div>
        </>
      ) : null}

      {pickerOpen ? (
        <Modal title="Chọn câu từ ngân hàng" onClose={() => setPickerOpen(false)}>
          <Field label="Kỹ năng">
            <select className={inputClass} value={pickerSkill} onChange={(event) => setPickerSkill(event.target.value)}>
              <option value="">Chọn kỹ năng</option>
              {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} ({skill.questionCount})</option>)}
            </select>
          </Field>
          <p className="mt-2 text-xs text-on-surface-variant">Chỉ hiện câu cùng môn {subjectLabel(draft.subject)} và khối {draft.gradeLevel}.</p>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {bankQuestions.map((item) => (
              <label key={item.id} className="flex items-start gap-2 rounded-xl border border-outline-variant p-3 text-sm">
                <input
                  type="checkbox"
                  checked={picked.includes(item.id)}
                  onChange={() => setPicked((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                />
                <span>{item.stem}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <PrimaryButton disabled={saving || picked.length === 0} onClick={assign}>Gán {picked.length} câu</PrimaryButton>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

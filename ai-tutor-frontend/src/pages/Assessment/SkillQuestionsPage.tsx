import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questionBankApi } from '../../services/assessmentApi';
import type { GenerationJob, QuestionDraft, QuestionItem, SkillItem } from '../../types/assessment';
import { questionTypeLabel, subjectLabel } from '../../types/assessment';
import { DangerButton, ErrorBanner, Field, Modal, PrimaryButton, inputClass, useAssessmentBase } from './assessmentUi';
import { MathText, QuestionView } from './MathContent';

const emptyDraft = (): QuestionDraft => ({
  stem: '',
  explanation: '',
  difficulty: 3,
  questionType: 'MULTIPLE_CHOICE',
  tags: [],
  choices: ['A', 'B', 'C', 'D'].map((key, index) => ({ key, text: '', correct: index === 0 })),
  correctText: '',
});

function toDraft(item: QuestionItem): QuestionDraft {
  return {
    stem: item.stem,
    explanation: item.explanation,
    difficulty: item.difficulty,
    questionType: item.questionType,
    tags: item.tags || [],
    choices: (item.choices || []).map((choice) => ({ key: choice.key, text: choice.text, correct: choice.correct })),
    correctText: item.correctText || '',
  };
}

export default function SkillQuestionsPage() {
  const { skillId = '' } = useParams();
  const base = useAssessmentBase();
  const [skill, setSkill] = useState<SkillItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<QuestionDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagText, setTagText] = useState('');
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(4);
  const [aiCount, setAiCount] = useState(5);
  const [aiType, setAiType] = useState('MULTIPLE_CHOICE');
  const [aiLoading, setAiLoading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [preview, setPreview] = useState<QuestionItem[]>([]);
  const [warning, setWarning] = useState('');
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [pollNonce, setPollNonce] = useState(0);
  const jobEpoch = useRef(0);

  const reload = () => {
    setLoading(true);
    Promise.all([questionBankApi.listSkills(), questionBankApi.listQuestions(skillId)])
      .then(([skills, rows]) => {
        setSkill(skills.find((item) => item.id === skillId) || null);
        setQuestions(rows);
        setSelected([]);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được câu hỏi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // skillId is the only external trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId]);

  const applyJob = (next: GenerationJob | null) => {
    setJob(next);
    if (!next) return;
    if (next.status === 'RUNNING') {
      setAiLoading(true);
      return;
    }
    setAiLoading(false);
    if (next.status === 'DONE') {
      setBatchId(next.batchId || null);
      setPreview(next.questions || []);
      setWarning(next.message || '');
      return;
    }
    if (next.status === 'FAILED') {
      setError('');
    }
  };

  useEffect(() => {
    if (!skillId) return;
    let stop = false;
    let timer = 0;
    const tick = () => {
      const ticket = jobEpoch.current;
      questionBankApi.currentGeneration(skillId)
        .then((next) => {
          if (stop || ticket !== jobEpoch.current) return;
          applyJob(next);
          if (next?.status === 'RUNNING') timer = window.setTimeout(tick, 2000);
        })
        .catch(() => {
          if (!stop && ticket === jobEpoch.current) timer = window.setTimeout(tick, 4000);
        });
    };
    tick();
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
    // applyJob closes over the latest setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillId, pollNonce]);

  const allChecked = questions.length > 0 && selected.length === questions.length;
  const draftTags = useMemo(() => tagText.split(',').map((item) => item.trim()).filter(Boolean), [tagText]);

  const openCreate = () => {
    setEditingId(null);
    setEditor(emptyDraft());
    setTagText('');
    setError('');
  };

  const openEdit = (item: QuestionItem) => {
    setEditingId(item.id);
    setEditor(toDraft(item));
    setTagText((item.tags || []).join(', '));
    setError('');
  };

  const saveQuestion = async () => {
    if (!editor) return;
    setSaving(true);
    setError('');
    const body = { ...editor, tags: draftTags };
    try {
      if (editingId) await questionBankApi.updateQuestion(editingId, body);
      else await questionBankApi.createQuestion(skillId, body);
      setEditor(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const runBulkDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await questionBankApi.bulkDelete(selected);
      setConfirmBulk(false);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const startAi = async () => {
    setAiLoading(true);
    setError('');
    setWarning('');
    try {
      const started = await questionBankApi.startGeneration(skillId, aiDifficulty, aiCount, aiType);
      applyJob(started);
      setPollNonce((current) => current + 1);
    } catch (err) {
      setAiLoading(false);
      setError(err instanceof Error ? err.message : 'AI chưa soạn được câu hỏi');
    }
  };

  const updatePreview = (id: string, patch: Partial<QuestionItem>) => {
    setPreview((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const confirmAi = async () => {
    if (!batchId) return;
    setSaving(true);
    setError('');
    try {
      for (const item of preview) {
        await questionBankApi.updateDraft(batchId, item.id, toDraft(item));
      }
      await questionBankApi.confirmBatch(batchId);
      jobEpoch.current += 1;
      setJob(null);
      setAiOpen(false);
      setBatchId(null);
      setPreview([]);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không nạp được câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const closeAi = () => {
    setAiOpen(false);
  };

  const discardAi = async () => {
    setSaving(true);
    setError('');
    try {
      if (batchId) await questionBankApi.discardBatch(batchId);
      else if (job) await questionBankApi.acknowledgeGeneration(job.id);
      jobEpoch.current += 1;
      setJob(null);
      setAiOpen(false);
      setBatchId(null);
      setPreview([]);
      setWarning('');
      setAiLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy được bản nháp');
    } finally {
      setSaving(false);
    }
  };

  const dismissFailedJob = async () => {
    if (!job) return;
    try {
      await questionBankApi.acknowledgeGeneration(job.id);
    } catch {
      // The banner still closes locally. The next visit can show the same notice.
    }
    jobEpoch.current += 1;
    setJob(null);
    setError('');
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm text-primary hover:underline" to={`${base}/question-bank`}>Ngân hàng câu hỏi</Link>
          <h1 className="text-2xl font-bold text-on-surface">{skill?.name || 'Câu hỏi theo kỹ năng'}</h1>
          {skill ? (
            <p className="text-sm text-on-surface-variant">{skill.skillCode} · {subjectLabel(skill.subject)} · Lớp {skill.gradeLevel}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={openCreate}>+ Tạo câu hỏi</PrimaryButton>
          <PrimaryButton onClick={() => setAiOpen(true)}>Tạo câu hỏi bằng AI</PrimaryButton>
          <DangerButton disabled={selected.length === 0} onClick={() => setConfirmBulk(true)}>Xóa các câu hỏi đã chọn</DangerButton>
        </div>
      </div>
      <ErrorBanner message={error} />
      {!aiOpen && job?.status === 'RUNNING' ? (
        <div className="rounded-xl border border-primary/30 bg-primary-fixed px-4 py-3 text-sm">
          <p className="font-medium text-primary">AI đang biên soạn câu hỏi và lời giải chi tiết cho bạn...</p>
          <p className="mt-1 text-on-surface-variant">Bạn có thể đóng hộp thoại hoặc rời trang. Tiến trình vẫn tiếp tục.</p>
          <button type="button" className="mt-2 font-semibold text-primary" onClick={() => setAiOpen(true)}>Xem tiến trình</button>
        </div>
      ) : null}
      {!aiOpen && job?.status === 'DONE' ? (
        <div className="rounded-xl border border-primary/30 bg-primary-fixed px-4 py-3 text-sm">
          <p className="font-medium text-on-surface">AI đã soạn xong {preview.length} câu. Bản nháp vẫn chờ bạn xem trước.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className="font-semibold text-primary" onClick={() => setAiOpen(true)}>Xem bản nháp</button>
            <button type="button" className="font-semibold text-error" onClick={discardAi}>Hủy bản nháp</button>
          </div>
        </div>
      ) : null}
      {!aiOpen && job?.status === 'FAILED' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm">
          <p>{job.message || 'AI chưa soạn được câu hỏi'}</p>
          <button type="button" className="font-semibold" onClick={dismissFailedJob}>Đóng</button>
        </div>
      ) : null}
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải câu hỏi...</p> : null}
      {!loading && questions.length === 0 ? <p className="text-sm text-on-surface-variant">Kỹ năng này chưa có câu hỏi trong ngân hàng.</p> : null}

      {questions.length > 0 ? (
        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? [] : questions.map((item) => item.id))} aria-label="Chọn tất cả câu hỏi" />
          Chọn tất cả
        </label>
      ) : null}
      <div className="space-y-3">
        {questions.map((item) => (
          <article key={item.id} className="rounded-2xl border border-outline-variant p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                <input
                  type="checkbox"
                  aria-label={`Chọn câu ${item.stem.slice(0, 40)}`}
                  checked={selected.includes(item.id)}
                  onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                />
                {questionTypeLabel(item.questionType)} · Mức {item.difficulty}
                {(item.tags || []).length > 0 ? ` · ${item.tags.join(', ')}` : ''}
              </label>
              <div className="flex gap-3 text-sm">
                <button type="button" className="font-semibold text-primary" onClick={() => openEdit(item)}>Sửa</button>
                <button
                  type="button"
                  className="font-semibold text-error"
                  onClick={() => { setSelected([item.id]); setConfirmBulk(true); }}
                >
                  Xóa
                </button>
              </div>
            </div>
            <QuestionView
              stem={item.stem}
              choices={item.choices}
              correctText={item.correctText}
              explanation={item.explanation}
            />
          </article>
        ))}
      </div>

      {editor ? (
        <Modal title={editingId ? 'Sửa câu hỏi' : 'Tạo câu hỏi'} onClose={() => setEditor(null)}>
          <QuestionForm editor={editor} setEditor={setEditor} tagText={tagText} setTagText={setTagText} />
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setEditor(null)}>Hủy</button>
            <PrimaryButton disabled={saving} onClick={saveQuestion}>Lưu</PrimaryButton>
          </div>
        </Modal>
      ) : null}

      {confirmBulk ? (
        <Modal title="Xóa câu hỏi" onClose={() => setConfirmBulk(false)}>
          <p className="text-sm text-on-surface">Xóa vĩnh viễn {selected.length} câu hỏi và các phương án trả lời đi kèm?</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setConfirmBulk(false)}>Hủy</button>
            <DangerButton disabled={saving} onClick={runBulkDelete}>Xóa các câu hỏi đã chọn</DangerButton>
          </div>
        </Modal>
      ) : null}

      {aiOpen ? (
        <Modal title="Tạo câu hỏi bằng AI" onClose={closeAi}>
          <Field label="Kỹ năng">
            <input className={inputClass} value={skill ? `${skill.skillCode} — ${skill.name}` : skillId} readOnly />
          </Field>
          {preview.length === 0 ? (
            <div className="mt-4 space-y-3">
              <fieldset>
                <legend className="text-sm font-medium text-on-surface">Loại câu</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ['MULTIPLE_CHOICE', 'Trắc nghiệm'],
                    ['TRUE_FALSE', 'Đúng/Sai'],
                    ['FILL_BLANK', 'Điền từ'],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-semibold ${aiType === value ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant text-on-surface'}`}
                    >
                      <input className="sr-only" type="radio" name="ai-question-type" value={value} checked={aiType === value} onChange={() => setAiType(value)} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Độ khó">
                  <select className={inputClass} value={aiDifficulty} onChange={(event) => setAiDifficulty(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Mức {level}</option>)}
                  </select>
                </Field>
                <Field label="Số lượng (1-20)">
                  <input className={inputClass} type="number" min={1} max={20} value={aiCount} onChange={(event) => setAiCount(Number(event.target.value))} />
                </Field>
              </div>
            </div>
          ) : null}
          {aiLoading ? (
            <div className="mt-4 text-sm">
              <p className="font-medium text-primary">AI đang biên soạn câu hỏi và lời giải chi tiết cho bạn...</p>
              <p className="mt-1 text-on-surface-variant">Đóng hộp thoại hoặc rời trang không dừng tiến trình.</p>
            </div>
          ) : null}
          {job?.status === 'FAILED' ? <p className="mt-3 text-sm text-error">{job.message || 'AI chưa soạn được câu hỏi'}</p> : null}
          {preview.length > 0 || job?.status === 'DONE' ? (
            <p className="mt-3 text-sm text-on-surface-variant">Đóng hộp thoại không hủy bản nháp. Hủy bản nháp khi bạn muốn bỏ các câu này.</p>
          ) : null}
          {warning ? <p className="mt-3 text-sm text-on-surface-variant">{warning}</p> : null}
          <div className="mt-4 space-y-4">
            {preview.map((item, index) => (
              <article key={item.id} className="rounded-xl border border-outline-variant p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">Câu {index + 1} · Mức {item.difficulty}</p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-error"
                    onClick={async () => {
                      if (!batchId) return;
                      await questionBankApi.deleteDraft(batchId, item.id);
                      setPreview((current) => current.filter((row) => row.id !== item.id));
                    }}
                  >
                    Xóa
                  </button>
                </div>
                <QuestionView
                  stem={item.stem}
                  choices={item.choices}
                  correctText={item.correctText}
                  explanation={item.explanation}
                />
                <p className="mb-1 mt-3 text-xs font-semibold text-on-surface-variant">Chỉnh nội dung</p>
                <textarea className={`${inputClass} min-h-16 w-full`} value={item.stem} onChange={(event) => updatePreview(item.id, { stem: event.target.value })} />
                <div className="mt-2 space-y-2">
                  {item.questionType === 'FILL_BLANK' ? (
                    <div>
                      <p className="mb-1 text-xs font-semibold text-primary">Đáp án</p>
                      <div className="answer-frame mb-2 rounded-xl bg-primary-fixed px-3 py-2">
                        <MathText text={item.correctText} />
                      </div>
                      <input
                        className={`${inputClass} w-full`}
                        value={item.correctText || ''}
                        aria-label="Sửa đáp án điền từ"
                        onChange={(event) => updatePreview(item.id, { correctText: event.target.value })}
                      />
                    </div>
                  ) : item.choices.map((choice, choiceIndex) => (
                    <div key={choice.key} className={`answer-frame rounded-xl px-3 py-2 ${choice.correct ? 'bg-primary-fixed ring-1 ring-primary/25' : 'bg-surface-container/60'}`}>
                      <label className="mb-1 flex items-center gap-2 text-xs font-semibold">
                        <input
                          type="radio"
                          name={`correct-${item.id}`}
                          checked={choice.correct}
                          onChange={() => updatePreview(item.id, {
                            choices: item.choices.map((row, rowIndex) => ({ ...row, correct: rowIndex === choiceIndex })),
                          })}
                        />
                        {choice.key}. {choice.correct ? <span className="text-primary">Đáp án đúng</span> : null}
                      </label>
                      <MathText text={choice.text} />
                      <input
                        className={`${inputClass} mt-2 w-full`}
                        value={choice.text}
                        aria-label={`Sửa phương án ${choice.key}`}
                        onChange={(event) => updatePreview(item.id, {
                          choices: item.choices.map((row, rowIndex) => rowIndex === choiceIndex ? { ...row, text: event.target.value } : row),
                        })}
                      />
                    </div>
                  ))}
                </div>
                <textarea className={`${inputClass} mt-2 min-h-16 w-full`} value={item.explanation} onChange={(event) => updatePreview(item.id, { explanation: event.target.value })} />
              </article>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {preview.length === 0 ? (
              job?.status === 'DONE' ? (
                <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-error" onClick={discardAi}>Hủy bản nháp</button>
              ) : (
                <PrimaryButton disabled={aiLoading} onClick={startAi}>{aiLoading ? 'Đang soạn...' : 'Bắt đầu tạo câu hỏi'}</PrimaryButton>
              )
            ) : (
              <>
                <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-error" onClick={discardAi}>Hủy bản nháp</button>
                <PrimaryButton disabled={saving || preview.length === 0} onClick={confirmAi}>Xác nhận nạp vào Ngân hàng</PrimaryButton>
              </>
            )}
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function QuestionForm({
  editor,
  setEditor,
  tagText,
  setTagText,
}: {
  editor: QuestionDraft;
  setEditor: (value: QuestionDraft) => void;
  tagText: string;
  setTagText: (value: string) => void;
}) {
  const setType = (questionType: string) => {
    if (questionType === 'TRUE_FALSE') {
      setEditor({
        ...editor,
        questionType,
        choices: [
          { key: 'A', text: 'Đúng', correct: true },
          { key: 'B', text: 'Sai', correct: false },
        ],
      });
      return;
    }
    if (questionType === 'FILL_BLANK') {
      setEditor({ ...editor, questionType, choices: [] });
      return;
    }
    setEditor({ ...editor, questionType, choices: emptyDraft().choices });
  };

  return (
    <div className="space-y-3">
      <Field label="Loại câu">
        <select className={inputClass} value={editor.questionType} onChange={(event) => setType(event.target.value)}>
          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
          <option value="TRUE_FALSE">Đúng/Sai</option>
          <option value="FILL_BLANK">Điền từ</option>
        </select>
      </Field>
      <Field label="Nội dung câu hỏi">
        <textarea className={`${inputClass} min-h-24`} value={editor.stem} onChange={(event) => setEditor({ ...editor, stem: event.target.value })} />
      </Field>
      <Field label="Độ khó (1-5)">
        <select className={inputClass} value={editor.difficulty} onChange={(event) => setEditor({ ...editor, difficulty: Number(event.target.value) })}>
          {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Mức {level}</option>)}
        </select>
      </Field>
      {editor.questionType === 'FILL_BLANK' ? (
        <Field label="Đáp án đúng">
          <input className={inputClass} value={editor.correctText || ''} onChange={(event) => setEditor({ ...editor, correctText: event.target.value })} />
        </Field>
      ) : (
        <div className="space-y-2">
          {editor.choices.map((choice, index) => (
            <div key={choice.key} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct-choice"
                checked={choice.correct}
                aria-label={`Đáp án đúng ${choice.key}`}
                onChange={() => setEditor({ ...editor, choices: editor.choices.map((row, rowIndex) => ({ ...row, correct: rowIndex === index })) })}
              />
              <input
                className={`${inputClass} flex-1`}
                placeholder={`Phương án ${choice.key}`}
                value={choice.text}
                onChange={(event) => setEditor({
                  ...editor,
                  choices: editor.choices.map((row, rowIndex) => rowIndex === index ? { ...row, text: event.target.value } : row),
                })}
              />
            </div>
          ))}
          {editor.questionType === 'MULTIPLE_CHOICE' && editor.choices.length < 6 ? (
            <button
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={() => setEditor({
                ...editor,
                choices: [...editor.choices, { key: 'ABCDEF'[editor.choices.length], text: '', correct: false }],
              })}
            >
              Thêm phương án
            </button>
          ) : null}
        </div>
      )}
      <Field label="Lời giải thích">
        <textarea className={`${inputClass} min-h-24`} value={editor.explanation} onChange={(event) => setEditor({ ...editor, explanation: event.target.value })} />
      </Field>
      <Field label="Thẻ, cách nhau bởi dấu phẩy">
        <input className={inputClass} value={tagText} onChange={(event) => setTagText(event.target.value)} />
      </Field>
      {editor.stem.trim() ? (
        <div className="rounded-xl border border-outline-variant p-3">
          <p className="mb-2 text-xs font-semibold text-on-surface-variant">Xem trước</p>
          <QuestionView
            stem={editor.stem}
            choices={editor.choices}
            correctText={editor.correctText}
            explanation={editor.explanation}
          />
        </div>
      ) : null}
    </div>
  );
}

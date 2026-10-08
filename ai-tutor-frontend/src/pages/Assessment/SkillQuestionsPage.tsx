import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questionBankApi } from '../../services/assessmentApi';
import type { QuestionDraft, QuestionItem, SkillItem } from '../../types/assessment';
import { questionTypeLabel, subjectLabel } from '../../types/assessment';
import { DangerButton, ErrorBanner, Field, Modal, PrimaryButton, inputClass, useAssessmentBase } from './assessmentUi';

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
  const [aiLoading, setAiLoading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [preview, setPreview] = useState<QuestionItem[]>([]);
  const [warning, setWarning] = useState('');

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
      const batch = await questionBankApi.generate(skillId, aiDifficulty, aiCount);
      setBatchId(batch.batchId);
      setPreview(batch.questions);
      setWarning(batch.warning || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI chưa soạn được câu hỏi');
    } finally {
      setAiLoading(false);
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

  const closeAi = async () => {
    if (batchId) {
      try {
        await questionBankApi.discardBatch(batchId);
      } catch {
        // The modal still closes. Unconfirmed rows stay pending and out of the active list.
      }
    }
    setAiOpen(false);
    setBatchId(null);
    setPreview([]);
    setAiLoading(false);
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
          <PrimaryButton onClick={() => { setAiOpen(true); setPreview([]); setBatchId(null); }}>Tạo câu hỏi bằng AI</PrimaryButton>
          <DangerButton disabled={selected.length === 0} onClick={() => setConfirmBulk(true)}>Xóa các câu hỏi đã chọn</DangerButton>
        </div>
      </div>
      <ErrorBanner message={error} />
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải câu hỏi...</p> : null}
      {!loading && questions.length === 0 ? <p className="text-sm text-on-surface-variant">Kỹ năng này chưa có câu hỏi trong ngân hàng.</p> : null}

      <div className="hidden overflow-hidden rounded-2xl border border-outline-variant md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? [] : questions.map((item) => item.id))} aria-label="Chọn tất cả câu hỏi" />
              </th>
              <th className="px-4 py-3 font-semibold">Nội dung</th>
              <th className="px-4 py-3 font-semibold">Độ khó</th>
              <th className="px-4 py-3 font-semibold">Thẻ</th>
              <th className="px-4 py-3 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((item) => (
              <tr key={item.id} className="border-t border-outline-variant align-top">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    aria-label={`Chọn câu ${item.stem.slice(0, 40)}`}
                    onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-on-surface">{item.stem}</p>
                  <p className="text-xs text-on-surface-variant">{questionTypeLabel(item.questionType)}</p>
                </td>
                <td className="px-4 py-3">Mức {item.difficulty}</td>
                <td className="px-4 py-3">{(item.tags || []).join(', ') || '—'}</td>
                <td className="px-4 py-3">
                  <button type="button" className="font-semibold text-primary" onClick={() => openEdit(item)}>Sửa</button>
                  <button
                    type="button"
                    className="ml-3 font-semibold text-error"
                    onClick={() => { setSelected([item.id]); setConfirmBulk(true); }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {questions.map((item) => (
          <article key={item.id} className="rounded-2xl border border-outline-variant p-4">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.includes(item.id)}
                onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}
              />
              <span className="font-medium">{item.stem}</span>
            </label>
            <p className="mt-2 text-xs text-on-surface-variant">Mức {item.difficulty} · {(item.tags || []).join(', ') || 'Không có thẻ'}</p>
            <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => openEdit(item)}>Sửa</button>
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Độ khó">
                <select className={inputClass} value={aiDifficulty} onChange={(event) => setAiDifficulty(Number(event.target.value))}>
                  {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Mức {level}</option>)}
                </select>
              </Field>
              <Field label="Số lượng (1-20)">
                <input className={inputClass} type="number" min={1} max={20} value={aiCount} onChange={(event) => setAiCount(Number(event.target.value))} />
              </Field>
            </div>
          ) : null}
          {aiLoading ? <p className="mt-4 text-sm font-medium text-primary">AI đang biên soạn câu hỏi và lời giải chi tiết cho bạn...</p> : null}
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
                <textarea className={`${inputClass} min-h-16 w-full`} value={item.stem} onChange={(event) => updatePreview(item.id, { stem: event.target.value })} />
                <div className="mt-2 space-y-2">
                  {item.choices.map((choice, choiceIndex) => (
                    <label key={choice.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`correct-${item.id}`}
                        checked={choice.correct}
                        onChange={() => updatePreview(item.id, {
                          choices: item.choices.map((row, rowIndex) => ({ ...row, correct: rowIndex === choiceIndex })),
                        })}
                      />
                      <span className="w-5">{choice.key}</span>
                      <input
                        className={`${inputClass} flex-1`}
                        value={choice.text}
                        onChange={(event) => updatePreview(item.id, {
                          choices: item.choices.map((row, rowIndex) => rowIndex === choiceIndex ? { ...row, text: event.target.value } : row),
                        })}
                      />
                    </label>
                  ))}
                </div>
                <textarea className={`${inputClass} mt-2 min-h-16 w-full`} value={item.explanation} onChange={(event) => updatePreview(item.id, { explanation: event.target.value })} />
              </article>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {preview.length === 0 ? (
              <PrimaryButton disabled={aiLoading} onClick={startAi}>Bắt đầu tạo câu hỏi</PrimaryButton>
            ) : (
              <PrimaryButton disabled={saving || preview.length === 0} onClick={confirmAi}>Xác nhận nạp vào Ngân hàng</PrimaryButton>
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
    </div>
  );
}

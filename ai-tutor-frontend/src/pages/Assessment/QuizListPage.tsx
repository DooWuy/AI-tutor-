import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { quizAdminApi } from '../../services/assessmentApi';
import type { QuizItem } from '../../types/assessment';
import { statusLabel, subjectLabel } from '../../types/assessment';
import { DangerButton, ErrorBanner, Filters, Modal, useAssessmentBase } from './assessmentUi';

export default function QuizListPage() {
  const base = useAssessmentBase();
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<QuizItem | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = () => {
    setLoading(true);
    quizAdminApi.list(subject, grade, status)
      .then(setQuizzes)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được đề thi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // filters drive the query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, grade, status]);

  const changeStatus = async (quiz: QuizItem, action: 'publish' | 'archive' | 'draft') => {
    setError('');
    try {
      const updated = action === 'publish'
        ? await quizAdminApi.publish(quiz.id)
        : action === 'archive'
          ? await quizAdminApi.archive(quiz.id)
          : await quizAdminApi.draft(quiz.id);
      setQuizzes((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated, questions: item.questions } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đổi được trạng thái đề thi');
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    setDeleteError('');
    try {
      await quizAdminApi.remove(pendingDelete.id);
      setPendingDelete(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Không xóa được đề thi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Quản lý đề thi</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Đề đã phát hành là đề học sinh có thể nhìn thấy. Đề đã có bài làm không xóa được.</p>
        </div>
        <Link to={`${base}/quizzes/new`} className="rounded-xl bg-primary px-4 py-2 text-center text-sm font-semibold text-on-primary">+ Tạo đề thi</Link>
      </div>
      <Filters
        subject={subject}
        grade={grade}
        onSubject={setSubject}
        onGrade={setGrade}
        extra={(
          <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
            Trạng thái
            <select className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Tất cả</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Đã phát hành</option>
              <option value="ARCHIVED">Ngừng hoạt động</option>
            </select>
          </label>
        )}
      />
      <ErrorBanner message={error} />
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải đề thi...</p> : null}
      {!loading && quizzes.length === 0 ? <p className="text-sm text-on-surface-variant">Chưa có đề thi phù hợp.</p> : null}

      <div className="hidden overflow-hidden rounded-2xl border border-outline-variant md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-semibold">Tiêu đề</th>
              <th className="px-4 py-3 font-semibold">Môn / Khối</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Câu hỏi</th>
              <th className="px-4 py-3 font-semibold">Lượt làm</th>
              <th className="px-4 py-3 font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz.id} className="border-t border-outline-variant align-top">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-primary hover:underline" to={`${base}/quizzes/${quiz.id}`}>{quiz.title}</Link>
                  <p className="text-xs text-on-surface-variant">{quiz.createdByName}</p>
                </td>
                <td className="px-4 py-3">{subjectLabel(quiz.subject)} · Lớp {quiz.gradeLevel}</td>
                <td className="px-4 py-3">{statusLabel(quiz.status)}</td>
                <td className="px-4 py-3">{quiz.questionCount}</td>
                <td className="px-4 py-3">{quiz.attemptCount}</td>
                <td className="px-4 py-3">
                  <QuizActions base={base} quiz={quiz} onStatus={changeStatus} onDelete={() => { setDeleteError(''); setPendingDelete(quiz); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {quizzes.map((quiz) => (
          <article key={quiz.id} className="rounded-2xl border border-outline-variant p-4">
            <Link className="font-semibold text-primary" to={`${base}/quizzes/${quiz.id}`}>{quiz.title}</Link>
            <p className="mt-1 text-xs text-on-surface-variant">{subjectLabel(quiz.subject)} · Lớp {quiz.gradeLevel} · {statusLabel(quiz.status)}</p>
            <p className="mt-2 text-sm">{quiz.questionCount} câu · {quiz.attemptCount} lượt làm</p>
            <div className="mt-3">
              <QuizActions base={base} quiz={quiz} onStatus={changeStatus} onDelete={() => { setDeleteError(''); setPendingDelete(quiz); }} />
            </div>
          </article>
        ))}
      </div>

      {pendingDelete ? (
        <Modal title="Xóa đề thi" onClose={() => setPendingDelete(null)}>
          <p className="text-sm">Xóa đề "{pendingDelete.title}"?</p>
          {deleteError ? <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm font-medium text-error">{deleteError}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={() => setPendingDelete(null)}>Hủy</button>
            <DangerButton disabled={busy} onClick={remove}>Xóa đề thi</DangerButton>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function QuizActions({
  base,
  quiz,
  onStatus,
  onDelete,
}: {
  base: string;
  quiz: QuizItem;
  onStatus: (quiz: QuizItem, action: 'publish' | 'archive' | 'draft') => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-semibold">
      <Link className="text-primary" to={`${base}/quizzes/${quiz.id}/statistics`}>Xem thống kê</Link>
      {quiz.status !== 'PUBLISHED' ? <button type="button" className="text-primary" onClick={() => onStatus(quiz, 'publish')}>Phát hành</button> : null}
      {quiz.status !== 'ARCHIVED' ? <button type="button" className="text-on-surface-variant" onClick={() => onStatus(quiz, 'archive')}>Lưu trữ</button> : null}
      {quiz.status !== 'DRAFT' ? <button type="button" className="text-on-surface-variant" onClick={() => onStatus(quiz, 'draft')}>Về nháp</button> : null}
      <button type="button" className="text-error" onClick={onDelete}>Xóa</button>
    </div>
  );
}

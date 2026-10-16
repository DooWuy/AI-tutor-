import { useEffect, useMemo, useState } from 'react';
import { quizAdminApi } from '../../services/assessmentApi';
import { listTeacherClasses } from '../../services/teacherClassApi';
import type { QuizItem } from '../../types/assessment';
import type { TeacherClass } from '../../types/teacherClass';
import { ErrorBanner, Modal, PrimaryButton } from './assessmentUi';

function gradeKey(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

export function PublishQuizModal({
  quiz,
  onClose,
  onPublished,
}: {
  quiz: QuizItem;
  onClose: () => void;
  onPublished: (quiz: QuizItem) => void;
}) {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selected, setSelected] = useState<string[]>(() => (quiz.classes || []).map((item) => item.id));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const questionCount = quiz.questions ? quiz.questions.length : quiz.questionCount || 0;
  const options = useMemo(
    () => classes.filter((item) => gradeKey(item.gradeLevel) === gradeKey(quiz.gradeLevel)),
    [classes, quiz.gradeLevel],
  );

  useEffect(() => {
    let disposed = false;
    listTeacherClasses()
      .then((rows) => {
        if (!disposed) setClasses(rows);
      })
      .catch((err: unknown) => {
        if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được danh sách lớp');
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    if (options.length === 0) return;
    const allowed = new Set(options.map((item) => item.id));
    setSelected((current) => current.filter((id) => allowed.has(id)));
  }, [options]);

  const toggle = (classId: string) => {
    setSelected((current) => (
      current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId]
    ));
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      onPublished(await quizAdminApi.publish(quiz.id, selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không phát hành được đề thi');
    } finally {
      setBusy(false);
    }
  };

  const chosen = selected.filter((id) => options.some((item) => item.id === id));
  const title = quiz.status === 'PUBLISHED' ? 'Đổi lớp phát hành' : 'Phát hành đề thi';

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-on-surface-variant">
        Đề “{quiz.title}” sẽ hiện với học sinh của các lớp được chọn. Chỉ lớp khối {quiz.gradeLevel} mới nhận đề này.
      </p>
      {questionCount < 1 ? (
        <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm font-medium text-error">
          Đề thi cần ít nhất một câu hỏi trước khi phát hành.
        </p>
      ) : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mt-4 text-sm text-on-surface-variant">Đang tải lớp...</p> : null}
      {!loading && options.length === 0 ? (
        <p className="mt-4 text-sm text-on-surface-variant">Không có lớp cùng khối với đề này.</p>
      ) : null}
      <div className="mt-4 space-y-2">
        {options.map((item) => (
          <label key={item.id} className="flex items-start gap-3 rounded-xl border border-outline-variant px-3 py-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
            />
            <span>
              <span className="font-semibold text-on-surface">{item.name}</span>
              <span className="mt-0.5 block text-xs text-on-surface-variant">
                Khối {item.gradeLevel}
                {item.subject ? ` · ${item.subject}` : ''}
                {item.isHomeroom ? ' · Chủ nhiệm' : ''}
                {` · ${item.studentCount} học sinh`}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={onClose}>Hủy</button>
        <PrimaryButton disabled={busy || questionCount < 1 || chosen.length === 0} onClick={submit}>
          {busy ? 'Đang phát hành...' : 'Xác nhận'}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

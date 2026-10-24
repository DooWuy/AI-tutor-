import { useEffect, useMemo, useState } from 'react';
import { quizAdminApi } from '../../services/assessmentApi';
import { listTeacherClasses } from '../../services/teacherClassApi';
import type { QuizClassRef, QuizItem } from '../../types/assessment';
import type { TeacherClass } from '../../types/teacherClass';
import { ErrorBanner, Modal, PrimaryButton } from './assessmentUi';

function gradeKey(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
  const [studyClasses, setStudyClasses] = useState<QuizClassRef[]>([]);
  const [schoolSelected, setSchoolSelected] = useState<string[]>(() => (quiz.classes || []).map((item) => item.id));
  const [studySelected, setStudySelected] = useState<string[]>(() => (quiz.studyClasses || []).map((item) => item.id));
  const [opensAt, setOpensAt] = useState(() => toLocalInput(quiz.availableFrom));
  const [closesAt, setClosesAt] = useState(() => toLocalInput(quiz.availableUntil));
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
    Promise.all([listTeacherClasses(), quizAdminApi.listStudyPublishTargets()])
      .then(([rows, studyRows]) => {
        if (disposed) return;
        setClasses(rows);
        setStudyClasses(studyRows || []);
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
    setSchoolSelected((current) => current.filter((id) => allowed.has(id)));
  }, [options]);

  const toggleSchool = (classId: string) => {
    setSchoolSelected((current) => (
      current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId]
    ));
  };

  const toggleStudy = (classId: string) => {
    setStudySelected((current) => (
      current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId]
    ));
  };

  const schoolChosen = schoolSelected.filter((id) => options.some((item) => item.id === id));
  const studyChosen = studySelected.filter((id) => studyClasses.some((item) => item.id === id));

  const submit = async () => {
    const availableFrom = toIso(opensAt);
    const availableUntil = toIso(closesAt);
    if (availableFrom && availableUntil && new Date(availableUntil).getTime() <= new Date(availableFrom).getTime()) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return;
    }
    setBusy(true);
    setError('');
    try {
      onPublished(await quizAdminApi.publish(quiz.id, schoolChosen, studyChosen, availableFrom, availableUntil));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không phát hành được đề thi');
    } finally {
      setBusy(false);
    }
  };

  const title = quiz.status === 'PUBLISHED' ? 'Đổi lớp phát hành' : 'Phát hành đề thi';

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-on-surface-variant">
        Đề “{quiz.title}” hiện với học sinh của lớp được chọn. Lớp nhà trường phải cùng khối {quiz.gradeLevel}. Lớp học thêm nhận đề khi giáo viên của lớp đó phát hành.
      </p>
      {questionCount < 1 ? (
        <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-sm font-medium text-error">
          Đề thi cần ít nhất một câu hỏi trước khi phát hành.
        </p>
      ) : null}
      <ErrorBanner message={error} />
      {loading ? <p className="mt-4 text-sm text-on-surface-variant">Đang tải lớp...</p> : null}
      {!loading && options.length === 0 && studyClasses.length === 0 ? (
        <p className="mt-4 text-sm text-on-surface-variant">Không có lớp cùng khối hoặc lớp học thêm đang hoạt động.</p>
      ) : null}
      {options.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-on-surface">Lớp được phân công</p>
          {options.map((item) => (
            <label key={item.id} className="flex items-start gap-3 rounded-xl border border-outline-variant px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={schoolSelected.includes(item.id)}
                onChange={() => toggleSchool(item.id)}
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
      ) : null}
      {studyClasses.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-on-surface">Lớp học thêm</p>
          {studyClasses.map((item) => (
            <label key={item.id} className="flex items-start gap-3 rounded-xl border border-outline-variant px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={studySelected.includes(item.id)}
                onChange={() => toggleStudy(item.id)}
              />
              <span>
                <span className="font-semibold text-on-surface">{item.name}</span>
                <span className="mt-0.5 block text-xs text-on-surface-variant">
                  Mã {item.classCode || '—'} · Không lọc theo khối
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-on-surface">
          Bắt đầu làm bài
          <input
            className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm font-normal"
            type="datetime-local"
            value={opensAt}
            onChange={(event) => setOpensAt(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-on-surface">
          Kết thúc làm bài
          <input
            className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm font-normal"
            type="datetime-local"
            value={closesAt}
            onChange={(event) => setClosesAt(event.target.value)}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">
        Để trống nếu đề mở ngay và không giới hạn giờ đóng. Học sinh chỉ bắt đầu làm bài trong khoảng này.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="rounded-xl px-4 py-2 text-sm" onClick={onClose}>Hủy</button>
        <PrimaryButton disabled={busy || questionCount < 1 || (schoolChosen.length === 0 && studyChosen.length === 0)} onClick={submit}>
          {busy ? 'Đang phát hành...' : 'Xác nhận'}
        </PrimaryButton>
      </div>
    </Modal>
  );
}

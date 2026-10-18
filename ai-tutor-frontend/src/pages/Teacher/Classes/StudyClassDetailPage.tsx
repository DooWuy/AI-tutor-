import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { actOnStudyRequest, dissolveStudyClass, getStudyClass, listStudyRequests, updateStudyClass } from '../../../services/studyClassApi';
import type { StudyClass, StudyMember } from '../../../types/studyClass';

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
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
              {active ? 'Đang hoạt động' : 'Đã giải tán'}
            </span>
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
          <div>
            <h2 className="text-lg font-bold text-on-surface">Học sinh đã duyệt</h2>
            {(studyClass.members ?? []).length === 0 ? <p className="mt-2 text-sm text-on-surface-variant">Chưa có học sinh nào.</p> : (
              <ul className="mt-2 space-y-2">
                {(studyClass.members ?? []).map((member) => (
                  <li key={member.id} className="rounded-xl border border-outline-variant px-3 py-2 text-sm">
                    <span className="font-semibold text-on-surface">{member.fullName}</span>
                    <span className="text-on-surface-variant"> · {member.studentCode} · {member.email}</span>
                  </li>
                ))}
              </ul>
            )}
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

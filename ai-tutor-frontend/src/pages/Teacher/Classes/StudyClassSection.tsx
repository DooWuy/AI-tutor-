import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listStudyClasses } from '../../../services/studyClassApi';
import type { StudyClass, StudyClassStatus } from '../../../types/studyClass';
import { CreateStudyClassModal } from './CreateStudyClassModal';

const FILTERS: { value: '' | StudyClassStatus; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'DISSOLVED', label: 'Đã giải tán' },
];

export function StudyClassSection() {
  const [classes, setClasses] = useState<StudyClass[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [filter, setFilter] = useState<'' | StudyClassStatus>('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError('');
    const handle = window.setTimeout(() => {
      listStudyClasses({ status: filter || undefined, keyword: keyword.trim() || undefined })
        .then((data) => {
          if (!disposed) {
            setClasses(data.classes);
            setActiveCount(data.activeCount);
          }
        })
        .catch((err: unknown) => {
          if (!disposed) setError(err instanceof Error ? err.message : 'Không tải được lớp học thêm');
        })
        .finally(() => {
          if (!disposed) setLoading(false);
        });
    }, 300);
    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [filter, keyword, reload]);

  const full = activeCount >= 4;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Lớp học thêm của tôi</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Tối đa 4 lớp đang hoạt động. Đang có {activeCount}/4.</p>
        </div>
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={full}
          title={full ? 'Bạn đã có 4 lớp đang hoạt động' : undefined}
          onClick={() => setCreating(true)}
        >
          Tạo lớp mới
        </button>
      </div>
      {full ? <p className="text-sm text-on-surface-variant">Bạn đã có 4 lớp đang hoạt động. Hãy giải tán một lớp trước khi tạo lớp mới.</p> : null}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button key={item.label} type="button" className={`rounded-full px-3 py-1 text-sm ${filter === item.value ? 'bg-primary text-on-primary' : 'border border-outline-variant'}`} onClick={() => setFilter(item.value)}>{item.label}</button>
        ))}
        <input className="min-w-40 flex-1 rounded-xl border border-outline-variant bg-surface px-3 py-1 text-sm" placeholder="Tìm theo tên hoặc mã lớp" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
      </div>
      {error ? <p className="text-sm text-error" role="alert">{error}</p> : null}
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải lớp học thêm...</p> : null}
      {!loading && !error && classes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-on-surface-variant">Chưa có lớp học thêm nào.</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <Link key={item.id} to={`/teacher/study-classes/${item.id}`} className="rounded-2xl border border-outline-variant bg-surface p-4 transition hover:border-primary">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-on-surface">{item.name}</h3>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                {item.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã giải tán'}
              </span>
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">Mã lớp {item.classCode}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{item.endDate ? `Hạn ${item.endDate}` : 'Không đặt hạn'}</p>
            <p className="mt-3 text-sm font-semibold text-on-surface">{item.approvedCount}/{item.maxStudents} học sinh · {item.pendingCount} yêu cầu chờ</p>
          </Link>
        ))}
      </div>
      {creating ? <CreateStudyClassModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setReload((value) => value + 1); }} /> : null}
    </section>
  );
}

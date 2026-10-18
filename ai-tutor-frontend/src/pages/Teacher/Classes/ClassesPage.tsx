import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTeacherClasses } from '../../../services/teacherClassApi';
import type { TeacherClass } from '../../../types/teacherClass';
import { StudyClassSection } from './StudyClassSection';

export default function ClassesPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError('');
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
  }, [retry]);

  return (
    <section className="space-y-8">
      <StudyClassSection />
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Lớp được phân công</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Sĩ số và đề đã phát hành của các lớp nhà trường bạn được phân công. Các lớp này không tính vào giới hạn 4 lớp học thêm.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm" role="alert">
          <p>{error}</p>
          <button type="button" className="mt-2 font-semibold text-primary" onClick={() => setRetry((value) => value + 1)}>Thử lại</button>
        </div>
      ) : null}
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải lớp...</p> : null}
      {!loading && !error && classes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant px-4 py-8 text-center text-sm text-on-surface-variant">
          Bạn chưa được phân công lớp nào.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((item) => (
          <Link
            key={item.id}
            to={`/teacher/classes/${item.id}`}
            className="rounded-2xl border border-outline-variant bg-surface p-4 transition hover:border-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-on-surface">{item.name}</h2>
              {item.isHomeroom ? (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Chủ nhiệm</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-on-surface-variant">
              Khối {item.gradeLevel}
              {item.subject ? ` · ${item.subject}` : ''}
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {item.schoolName || 'Chưa có trường'} · {item.academicYear}
            </p>
            <p className="mt-3 text-sm font-semibold text-on-surface">{item.studentCount} học sinh</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

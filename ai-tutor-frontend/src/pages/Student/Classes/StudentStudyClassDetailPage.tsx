import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, UserRound } from 'lucide-react';
import { getMyStudyClass, StudyClassApiError } from '../../../services/studyClassApi';
import { useStudyClassUpdates } from '../../../hooks/useStudyClassUpdates';
import type { StudentStudyClass } from '../../../types/studyClass';

const labels = { APPROVED: 'Đã tham gia', PENDING: 'Đang chờ duyệt', REJECTED: 'Đã từ chối' };
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : 'Không giới hạn';
export default function StudentStudyClassDetailPage() {
  const { classId = '' } = useParams();
  const revision = useStudyClassUpdates(classId);
  const [item, setItem] = useState<StudentStudyClass | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setItem(null);
    setLoading(true);
    setError('');
    getMyStudyClass(classId).then(data => { if (active) setItem(data); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof StudyClassApiError && cause.status === 404
        ? 'Không tìm thấy lớp học thuộc tài khoản của bạn.' : cause instanceof Error ? cause.message : 'Không tải được lớp học.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [classId, revision, retry]);
  return <section className="mx-auto max-w-4xl space-y-6 px-4 py-6 text-on-surface" aria-busy={loading}>
    <Link to="/student/classes" className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft size={18} /> Danh sách lớp</Link>
    {loading ? <p role="status" className="animate-pulse text-on-surface-variant">Đang tải thông tin lớp...</p> : null}
    {error ? <div role="alert" className="space-y-3 rounded-2xl border border-error/30 bg-error/10 p-5 text-error"><p>{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="rounded-lg px-3 py-2 font-semibold underline focus-visible:outline-2">Thử lại</button></div> : null}
    {item ? <>
      <header className="space-y-4 rounded-3xl border border-outline-variant bg-surface p-6 sm:p-8">
        <BookOpen className="text-primary" size={32} aria-hidden="true" />
        <p className="text-sm font-semibold text-primary">Lớp học thêm · {item.classStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Đã giải tán'}</p>
        <h1 className="break-words text-2xl font-bold sm:text-3xl">{item.className}</h1>
        <p className="whitespace-pre-wrap text-on-surface-variant">{item.description || 'Lớp chưa có mô tả.'}</p>
        <p role="status" className="rounded-xl bg-primary/10 p-4 text-sm text-on-surface"><strong>{labels[item.enrollmentStatus]}</strong><br />
          {item.enrollmentStatus === 'APPROVED' ? 'Bạn đã là thành viên. Đây là trang tổng quan của lớp.' : item.enrollmentStatus === 'PENDING' ? 'Giáo viên đang xem xét yêu cầu. Bạn chưa được cấp quyền thành viên.' : 'Giáo viên đã từ chối yêu cầu. Bạn có thể quay lại danh sách và nhập mã lớp để xin lại.'}
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="space-y-3 rounded-2xl border border-outline-variant bg-surface p-5"><h2 className="flex items-center gap-2 font-bold"><UserRound size={20} aria-hidden="true" /> Giáo viên</h2><p>{item.teacherName}</p><p className="text-sm text-on-surface-variant">Mã lớp: {item.classCode}</p></article>
        <article className="space-y-3 rounded-2xl border border-outline-variant bg-surface p-5"><h2 className="flex items-center gap-2 font-bold"><CalendarDays size={20} aria-hidden="true" /> Thời gian</h2><dl className="space-y-2 text-sm"><div><dt className="text-on-surface-variant">Bắt đầu</dt><dd>{date(item.startDate)}</dd></div><div><dt className="text-on-surface-variant">Kết thúc</dt><dd>{date(item.endDate)}</dd></div><div><dt className="text-on-surface-variant">Gửi yêu cầu</dt><dd>{date(item.requestedAt)}</dd></div>{item.reviewedAt ? <div><dt className="text-on-surface-variant">Đã xét duyệt</dt><dd>{date(item.reviewedAt)}</dd></div> : null}</dl></article>
      </div>
    </> : null}
  </section>;
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, MessagesSquare, CheckSquare, RefreshCw } from 'lucide-react';
import { fetchAdminDashboard, type AdminDashboard } from '../../services/adminDashboardApi';
const control = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';
const metrics = [
  { key: 'totalUsers', label: 'Tài khoản người dùng', detail: 'Mọi vai trò, gồm tài khoản khóa; loại tài khoản đã xóa.', icon: Users, to: '/admin/users' },
  { key: 'totalDocuments', label: 'Tài liệu', detail: 'Tất cả trạng thái xử lý tài liệu.', icon: BookOpen },
  { key: 'totalQuizzes', label: 'Quiz', detail: 'Tất cả chủ sở hữu và trạng thái phát hành.', icon: ClipboardList, to: '/admin/quizzes' },
  { key: 'chatCount', label: 'Phiên chat', detail: 'Số phiên, bao gồm phiên chưa có tin nhắn.', icon: MessagesSquare },
  { key: 'attemptCount', label: 'Lượt làm quiz đã nộp', detail: 'Bao gồm lịch sử bị ẩn; không tính bài nháp.', icon: CheckSquare },
] as const;
export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    const abort = new AbortController(); busy.current = true;
    setLoading(true); setError('');
    fetchAdminDashboard(abort.signal).then(value => { if (!abort.signal.aborted) setData(value); })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Không thể kết nối. Vui lòng thử lại.'); })
      .finally(() => { if (!abort.signal.aborted) { busy.current = false; setLoading(false); } });
    return () => abort.abort();
  }, [revision]);
  const refresh = () => { if (!busy.current) { busy.current = true; setLoading(true); setRevision(v => v+1); } };
  return <section aria-labelledby="admin-dashboard-title" className="space-y-6 pb-12 text-on-surface">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-sm text-on-surface-variant">Toàn hệ thống · Toàn thời gian</p><h1 id="admin-dashboard-title" className="text-2xl font-bold sm:text-3xl">Tổng quan quản trị</h1><p className="mt-2 text-on-surface-variant">Số liệu được truy vấn mới mỗi lần tải. Nhấn làm mới để cập nhật.</p></div><button className={control} disabled={loading} onClick={refresh}><RefreshCw size={18} aria-hidden="true" />{loading ? 'Đang tải…' : 'Làm mới'}</button></header>
    {error && <div role="alert" className="space-y-3 rounded-xl border border-error p-4"><p>{error}</p>{data && <p>Dữ liệu bên dưới là lần tải thành công trước, chưa cập nhật.</p>}<button className={control} disabled={loading} onClick={refresh}>Thử lại</button></div>}
    {loading && <p role="status">{data ? 'Đang làm mới tổng quan…' : 'Đang tải tổng quan…'}</p>}
    {data && <><p role="status" className="text-sm text-on-surface-variant">{error ? 'Lần tải thành công trước' : 'Dữ liệu lúc'}: <time dateTime={data.updatedAt}>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(data.updatedAt))}</time> (giờ Việt Nam)</p>
      <dl aria-busy={loading} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(m => <div key={m.key} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6"><dt className="flex items-center gap-3 font-semibold"><m.icon size={22} aria-hidden="true" className="text-primary" />{m.label}</dt><dd className="my-4 text-4xl font-bold tabular-nums">{data[m.key].toLocaleString('vi-VN')}</dd><dd className="text-sm text-on-surface-variant">{m.detail}</dd>{'to' in m && <dd className="mt-4"><Link className="text-primary underline focus-visible:outline-2" to={m.to}>Quản lý {m.label.toLowerCase()}</Link></dd>}</div>)}</dl>
      {metrics.every(m => data[m.key] === 0) && <p className="rounded-xl border border-dashed border-outline-variant p-6">Chưa có dữ liệu trong hệ thống.</p>}
    </>}
    <nav aria-label="Tác vụ quản trị" className="flex flex-wrap gap-3"><Link className={control} to="/admin/users">Tài khoản</Link><Link className={control} to="/admin/students">Học sinh</Link><Link className={control} to="/admin/quizzes">Quiz</Link><Link className={control} to="/admin/settings">Cấu hình</Link></nav>
  </section>;
}

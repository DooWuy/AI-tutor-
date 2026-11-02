import { useEffect, useRef, useState } from 'react';
import { searchAccounts, setAccountStatus, type Account, type AccountFilters, type AccountPage } from '../../../services/adminUserApi';
import { useAuth } from '../../../context/AuthContext';

const initial: AccountFilters = { search: '', role: '', active: '', page: 1, size: 20, sort: 'createdAt', direction: 'desc' };
const roleNames = { ADMIN: 'Quản trị viên', TEACHER: 'Giáo viên', STUDENT: 'Học sinh' };
const control = 'min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';

export function UserManagementPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(initial);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<AccountPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [target, setTarget] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setFilters(old => ({ ...old, search: search.trim(), page: 1 })), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setError('');
    searchAccounts(filters, abort.signal).then(result => { if (!abort.signal.aborted) setData(result); })
      .catch(reason => { if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [filters, revision]);
  const change = (patch: Partial<AccountFilters>) => setFilters(old => ({ ...old, ...patch, page: 1 }));
  const close = () => { if (!pending.current) { dialog.current?.close(); setTarget(null); } };
  const confirm = async () => {
    if (!target || pending.current) return;
    pending.current = true; setSaving(true); setActionError('');
    try {
      await setAccountStatus(target.userId, !target.active);
      setNotice(`Đã ${target.active ? 'khóa' : 'mở khóa'} tài khoản ${target.fullName}.`);
      dialog.current?.close(); setTarget(null); setRevision(old => old + 1);
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Không thể cập nhật trạng thái.'); }
    finally { pending.current = false; setSaving(false); }
  };
  return <section className="space-y-6 pb-12 text-on-surface" aria-labelledby="users-title">
    <div><h1 id="users-title" className="text-2xl font-bold">Tài khoản người dùng</h1>
      <p className="mt-2 text-on-surface-variant">Tìm kiếm và kiểm soát truy cập của học sinh, giáo viên và quản trị viên.</p></div>
    {notice && <p role="status" className="rounded-lg border border-outline-variant p-3">{notice}</p>}
    <div className="grid gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-2">Tìm kiếm<input className={control} value={search} maxLength={255} placeholder="Tên, email hoặc username" onChange={e => setSearch(e.target.value)} /></label>
      <label className="grid gap-2">Vai trò<select className={control} value={filters.role} onChange={e => change({ role: e.target.value })}><option value="">Tất cả</option>{Object.entries(roleNames).map(([role, name]) => <option key={role} value={role}>{name}</option>)}</select></label>
      <label className="grid gap-2">Trạng thái<select className={control} value={filters.active} onChange={e => change({ active: e.target.value })}><option value="">Tất cả</option><option value="true">Đang hoạt động</option><option value="false">Đang khóa</option></select></label>
      <label className="grid gap-2">Sắp xếp<select className={control} value={`${filters.sort}:${filters.direction}`} onChange={e => { const [sort, direction] = e.target.value.split(':'); change({ sort, direction }); }}><option value="createdAt:desc">Mới nhất</option><option value="fullName:asc">Tên A–Z</option><option value="username:asc">Username A–Z</option></select></label>
      <button type="button" className={control} onClick={() => { setSearch(''); setFilters(initial); }}>Xóa bộ lọc</button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-error p-4"><p>{error}</p><button type="button" className={control} onClick={() => setRevision(old => old + 1)}>Thử lại</button></div>}
    <div aria-busy={loading} className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      {loading ? <p role="status" className="p-6">Đang tải tài khoản…</p> : !error && data && <>
        {data.content.length === 0 ? <p className="p-6">{search || filters.role || filters.active ? 'Không tìm thấy tài khoản phù hợp. Hãy thử xóa bộ lọc.' : 'Chưa có tài khoản.'}</p> :
          <ul className="divide-y divide-outline-variant">{data.content.map(account => <li key={account.userId} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="font-semibold break-words">{account.fullName} {account.userId === user?.userId && '(Bạn)'}</p><p className="break-all text-sm text-on-surface-variant">{account.email}</p><p className="break-all text-sm">{account.username} · {roleNames[account.role]}</p></div>
            <div className="flex shrink-0 items-center gap-4"><span className="text-sm">{account.active ? 'Đang hoạt động' : 'Đang khóa'}</span><button type="button" className={control} onClick={() => { setTarget(account); setActionError(''); dialog.current?.showModal(); }}>{account.active ? 'Khóa' : 'Mở khóa'}<span className="sr-only"> {account.fullName}</span></button></div>
          </li>)}</ul>}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant p-4">
          <p>{data.totalElements} tài khoản · Trang {data.page}/{Math.max(1, data.totalPages)}</p>
          <label>Hiển thị <select className={control} value={filters.size} onChange={e => change({ size: Number(e.target.value) })}>{[10, 20, 50].map(size => <option key={size}>{size}</option>)}</select></label>
          <div className="flex gap-2"><button className={control} disabled={filters.page <= 1} onClick={() => setFilters(old => ({ ...old, page: old.page - 1 }))}>Trước</button><button className={control} disabled={filters.page >= data.totalPages} onClick={() => setFilters(old => ({ ...old, page: old.page + 1 }))}>Sau</button></div>
        </div>
      </>}
    </div>
    <dialog ref={dialog} aria-labelledby="account-confirm-title" onCancel={e => { if (pending.current) e.preventDefault(); else setTarget(null); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-on-surface backdrop:bg-black/60">
      <h2 id="account-confirm-title" className="text-lg font-bold">{target?.active ? 'Khóa' : 'Mở khóa'} tài khoản?</h2>
      <p className="my-4 break-words">{target?.fullName}: {target?.active ? 'Tài khoản sẽ không thể tiếp tục truy cập. Dữ liệu học tập được giữ nguyên.' : 'Tài khoản có thể đăng nhập lại.'}</p>
      {actionError && <p role="alert" className="my-3 text-error">{actionError}</p>}
      <div className="flex justify-end gap-3"><button autoFocus className={control} disabled={saving} onClick={close}>Hủy</button><button className={control} disabled={saving} onClick={confirm}>{saving ? 'Đang lưu…' : 'Xác nhận'}</button></div>
    </dialog>
  </section>;
}

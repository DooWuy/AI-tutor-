import { useEffect, useRef, useState } from 'react';
import { AccountError, createTeacher, getAccount, resendInvitation, updateTeacher, type Account, type TeacherInput } from '../../../services/adminUserApi';

const control = 'min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';
export const invitationLabels = { QUEUED: 'Đang chờ gửi email', SENT: 'Đã gửi email · Chờ thiết lập', FAILED: 'Gửi email thất bại · Cần gửi lại', COMPLETED: 'Đã thiết lập mật khẩu' };
export function TeacherForm({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: (message: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(id !== 'new');
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({ username: '', email: '', fullName: '', department: '', subjectTaught: '', schoolName: '', dateOfBirth: '', gender: 'OTHER', phoneNumber: '' });
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    if (id === 'new') return;
    const abort = new AbortController();
    setLoading(true); setError('');
    getAccount(id, abort.signal).then(a => {
      if (abort.signal.aborted) return;
      setAccount(a); setValues({ username: a.username, email: a.email, fullName: a.fullName, department: a.department || '', subjectTaught: a.subjectTaught || '', schoolName: a.schoolName || '', dateOfBirth: a.dateOfBirth || '', gender: a.gender || 'OTHER', phoneNumber: a.phoneNumber || '' });
    }).catch(e => { if (!abort.signal.aborted) setError(e.message); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [id, revision]);
  const validate = (key: string, value: string) => {
    if (['username', 'email', 'fullName', 'department', 'subjectTaught'].includes(key) && !value.trim()) return 'Không được để trống';
    if (key === 'username' && !/^[a-zA-Z0-9_]+$/.test(value)) return 'Chỉ dùng chữ, số và dấu gạch dưới';
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email không hợp lệ';
    if (key === 'phoneNumber' && value && !/^0[356789]\d{8}$/.test(value)) return 'Số điện thoại không hợp lệ';
    if (key === 'dateOfBirth' && value && value >= new Date().toISOString().slice(0, 10)) return 'Ngày sinh phải trong quá khứ';
    return '';
  };
  const fail = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Không thể thực hiện thao tác');
    if (e instanceof AccountError) setFields(e.fields);
    window.setTimeout(() => summary.current?.focus(), 0);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (pending.current) return;
    const errors = Object.fromEntries(Object.entries(values).map(([k,v]) => [k, validate(k,v)]).filter(([,v]) => v));
    setFields(errors);
    if (Object.keys(errors).length) { fail(new Error('Vui lòng kiểm tra các trường bên dưới.')); return; }
    pending.current = true; setSaving(true); setError('');
    try {
      const { username, email, fullName, department, subjectTaught, schoolName, ...personal } = values;
      if (id === 'new') {
        await createTeacher({ username, email, fullName, department, subjectTaught, schoolName } as TeacherInput);
        onSaved('Đã tạo giáo viên. Email thiết lập đang chờ gửi; có thể theo dõi hoặc gửi lại từ hồ sơ.');
      } else {
        await updateTeacher(id, { fullName, department, subjectTaught, schoolName, gender: personal.gender, phoneNumber: personal.phoneNumber, ...(personal.dateOfBirth ? { dateOfBirth: personal.dateOfBirth } : {}) });
        onSaved('Đã cập nhật hồ sơ giáo viên.');
      }
      onClose();
    } catch (e) { fail(e); } finally { pending.current = false; setSaving(false); }
  };
  const resend = async () => {
    if (pending.current) return; pending.current = true; setSaving(true); setError('');
    try { const a = await resendInvitation(id); setAccount(a); onSaved('Đã xếp hàng gửi lại email. Link cũ đã bị vô hiệu hóa.'); }
    catch (e) { fail(e); } finally { pending.current = false; setSaving(false); }
  };
  const labels: Record<string, string> = { username: 'Tên đăng nhập', email: 'Email', fullName: 'Họ và tên', department: 'Khoa / Bộ môn', subjectTaught: 'Môn giảng dạy', schoolName: 'Trường (tùy chọn)', dateOfBirth: 'Ngày sinh', gender: 'Giới tính', phoneNumber: 'Số điện thoại' };
  return <dialog ref={dialog} aria-labelledby="teacher-title" onCancel={e => { if (pending.current) e.preventDefault(); else onClose(); }} className="m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-on-surface backdrop:bg-black/60">
    <h2 id="teacher-title" className="text-xl font-bold">{id === 'new' ? 'Thêm giáo viên' : 'Hồ sơ giáo viên'}</h2>
    {error && <div ref={summary} tabIndex={-1} role="alert" className="my-4 text-error"><p>{error}</p>{Object.entries(fields).filter(([,v]) => v).map(([k,v]) => <a className="block underline" href={`#teacher-${k}`} key={k}>{labels[k] || k}: {v}</a>)}{!account && id !== 'new' && <button className={control} onClick={() => setRevision(x => x+1)}>Thử lại</button>}</div>}
    {loading ? <p role="status">Đang tải hồ sơ…</p> : (id === 'new' || account) && <form onSubmit={submit} noValidate>
      {account && <div className="my-4 space-y-2"><p>Mã giáo viên: {account.teacherCode}</p><p>{account.active ? 'Đang hoạt động' : 'Đang khóa'}</p><p role="status">{account.invitationStatus ? invitationLabels[account.invitationStatus] : 'Đã có tài khoản'}</p>{account.invitationStatus && account.invitationStatus !== 'COMPLETED' && <button type="button" className={control} disabled={saving} onClick={resend}>Gửi lại email thiết lập</button>}<button type="button" className={control} disabled={saving} onClick={() => setRevision(x => x+1)}>Cập nhật trạng thái hồ sơ</button></div>}
      <div className="my-5 grid gap-4 sm:grid-cols-2">{Object.keys(labels).filter(k => id !== 'new' || !['dateOfBirth','gender','phoneNumber'].includes(k)).map(k => <label className="grid gap-1" key={k} htmlFor={`teacher-${k}`}>{labels[k]}
        {k === 'gender' ? <select id={`teacher-${k}`} className={control} value={values[k]} disabled={saving} onChange={e => setValues(v => ({ ...v, [k]: e.target.value }))}><option value="OTHER">Khác</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select> : <input id={`teacher-${k}`} autoFocus={k === 'username'} className={control} type={k === 'dateOfBirth' ? 'date' : k === 'email' ? 'email' : 'text'} readOnly={id !== 'new' && ['username','email'].includes(k)} disabled={saving} maxLength={['department','subjectTaught'].includes(k) ? 128 : k === 'phoneNumber' ? 32 : 255} value={values[k]} aria-invalid={!!fields[k]} aria-describedby={fields[k] ? `teacher-${k}-error` : undefined} onChange={e => setValues(v => ({ ...v, [k]: e.target.value }))} onBlur={() => setFields(f => ({ ...f, [k]: validate(k, values[k]) }))} />}
        {fields[k] && <span id={`teacher-${k}-error`} className="text-sm text-error">{fields[k]}</span>}
      </label>)}</div>
      <p className="mb-4 text-sm text-on-surface-variant">Giáo viên tự thiết lập mật khẩu qua email. Mã và vai trò do hệ thống quản lý; giáo viên mới chưa được phân công lớp.</p>
      <button className={control} disabled={saving} type="submit">{saving ? 'Đang xử lý…' : 'Lưu giáo viên'}</button>
    </form>}
    <button type="button" className={`${control} mt-4`} disabled={saving} onClick={onClose}>Đóng</button>
  </dialog>;
}

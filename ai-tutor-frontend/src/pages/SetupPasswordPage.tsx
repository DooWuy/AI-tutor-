import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
export default function SetupPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const pending = useRef(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (pending.current) return;
    if (password.length < 8 || password !== confirm) { setError('Mật khẩu cần ít nhất 8 ký tự và xác nhận phải khớp.'); return; }
    pending.current = true; setSaving(true); setError('');
    try {
      const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');
      const response = await fetch(`${base}/auth/setup-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Không thể thiết lập mật khẩu.');
      setPassword(''); setConfirm(''); setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể kết nối. Vui lòng thử lại.'); }
    finally { pending.current = false; setSaving(false); }
  };
  const control = 'min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50';
  return <main className="flex min-h-screen items-center justify-center bg-surface p-4 text-on-surface"><section className="w-full max-w-md space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"><h1 className="text-2xl font-bold">Thiết lập mật khẩu</h1>
    {!token ? <p role="alert">Link không hợp lệ. Vui lòng liên hệ Admin để gửi lại email thiết lập.</p> : done ? <p role="status">Đã thiết lập mật khẩu. Bạn có thể đăng nhập nếu tài khoản không bị khóa.</p> : <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-2">Mật khẩu mới<input className={control} type="password" autoComplete="new-password" minLength={8} required value={password} disabled={saving} onChange={e => setPassword(e.target.value)} /></label>
      <label className="grid gap-2">Xác nhận mật khẩu<input className={control} type="password" autoComplete="new-password" required value={confirm} disabled={saving} onChange={e => setConfirm(e.target.value)} /></label>
      {error && <p role="alert" className="text-error">{error} Nếu link hết hạn, hãy nhờ Admin gửi lại.</p>}
      <button className={control} disabled={saving}>{saving ? 'Đang lưu…' : 'Đặt mật khẩu'}</button>
    </form>}<Link className="inline-block underline" to="/login">Đăng nhập</Link>
  </section></main>;
}

import { useState, type FormEvent } from 'react';
import { joinStudyClass } from '../../../services/studyClassApi';

export default function JoinStudyClassPage() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError('');
    setMessage('');
    try {
      const result = await joinStudyClass(code.trim().toUpperCase());
      setMessage(`Đã gửi yêu cầu vào lớp ${result.className}. Giáo viên sẽ duyệt yêu cầu này.`);
      setCode('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không gửi được yêu cầu');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-on-surface">Xin vào lớp học thêm</h1>
      <p className="text-sm text-on-surface-variant">Nhập mã 6 ký tự giáo viên cung cấp. Yêu cầu chờ giáo viên chấp nhận.</p>
      <form className="space-y-3 rounded-2xl border border-outline-variant bg-surface p-4" onSubmit={submit}>
        <label className="block text-sm font-semibold text-on-surface">
          Mã lớp
          <input
            className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 uppercase tracking-widest"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            minLength={6}
            maxLength={6}
            required
            autoCapitalize="characters"
          />
        </label>
        {error ? <p className="text-sm text-error" role="alert">{error}</p> : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60" disabled={sending}>
          {sending ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </form>
    </section>
  );
}

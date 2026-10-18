import { useState, type FormEvent } from 'react';
import { createStudyClass } from '../../../services/studyClassApi';
import type { StudyClassCreateInput } from '../../../types/studyClass';

type DeadlineMode = 'none' | 'date' | 'weeks' | 'months';

export function CreateStudyClassModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxStudents, setMaxStudents] = useState('40');
  const [mode, setMode] = useState<DeadlineMode>('none');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState('4');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const input: StudyClassCreateInput = {
      name: name.trim(),
      description: description.trim(),
      maxStudents: Number(maxStudents),
    };
    if (mode === 'date') input.endDate = endDate;
    if (mode === 'weeks' || mode === 'months') {
      input.durationAmount = Number(amount);
      input.durationUnit = mode === 'weeks' ? 'WEEKS' : 'MONTHS';
    }
    try {
      await createStudyClass(input);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tạo được lớp');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation" onClick={onClose}>
      <form
        className="w-full max-w-lg rounded-2xl bg-surface p-5 shadow-xl"
        role="dialog"
        aria-labelledby="create-study-class-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <h2 id="create-study-class-title" className="text-lg font-bold text-on-surface">Tạo lớp học thêm</h2>
        <label className="mt-4 block text-sm font-semibold text-on-surface">
          Tên lớp
          <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required maxLength={64} />
        </label>
        <label className="mt-3 block text-sm font-semibold text-on-surface">
          Mô tả
          <textarea className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={1000} />
        </label>
        <label className="mt-3 block text-sm font-semibold text-on-surface">
          Sĩ số tối đa
          <input className="mt-1 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" type="number" min={1} max={200} value={maxStudents} onChange={(event) => setMaxStudents(event.target.value)} required />
        </label>
        <fieldset className="mt-3">
          <legend className="text-sm font-semibold text-on-surface">Hạn hoạt động</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {([['none', 'Không hạn'], ['date', 'Theo ngày'], ['weeks', 'Theo tuần'], ['months', 'Theo tháng']] as const).map(([value, label]) => (
              <button key={value} type="button" className={`rounded-full px-3 py-1 text-sm ${mode === value ? 'bg-primary text-on-primary' : 'border border-outline-variant'}`} onClick={() => setMode(value)}>{label}</button>
            ))}
          </div>
          {mode === 'date' ? (
            <input className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
          ) : null}
          {mode === 'weeks' || mode === 'months' ? (
            <input className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-3 py-2" type="number" min={1} max={mode === 'weeks' ? 104 : 24} value={amount} onChange={(event) => setAmount(event.target.value)} required />
          ) : null}
        </fieldset>
        {error ? <p className="mt-3 text-sm text-error" role="alert">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold" onClick={onClose}>Hủy</button>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60" disabled={saving}>{saving ? 'Đang tạo...' : 'Tạo lớp'}</button>
        </div>
      </form>
    </div>
  );
}

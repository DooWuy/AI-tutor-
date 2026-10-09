import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { GRADES, SUBJECTS } from '../../types/assessment';

export function useAssessmentBase() {
  const { pathname } = useLocation();
  return pathname.startsWith('/teacher') ? '/teacher' : '/admin';
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-error/30 bg-error-container px-4 py-3 text-sm font-medium text-on-error-container" role="alert">
      {message}
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="scroll-x max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl bg-surface-container-lowest p-4 shadow-xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button type="button" className="rounded-lg px-2 py-1 text-sm text-on-surface-variant hover:bg-surface-container" onClick={onClose}>
            Đóng
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-on-surface">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  'rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary';

export function Filters({
  subject,
  grade,
  onSubject,
  onGrade,
  extra,
}: {
  subject: string;
  grade: string;
  onSubject: (value: string) => void;
  onGrade: (value: string) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Field label="Môn học">
        <select className={inputClass} value={subject} onChange={(event) => onSubject(event.target.value)}>
          <option value="">Tất cả</option>
          {SUBJECTS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Khối lớp">
        <select className={inputClass} value={grade} onChange={(event) => onGrade(event.target.value)}>
          <option value="">Tất cả</option>
          {GRADES.map((item) => (
            <option key={item} value={item}>Lớp {item}</option>
          ))}
        </select>
      </Field>
      {extra}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-on-error disabled:opacity-50">
      {children}
    </button>
  );
}

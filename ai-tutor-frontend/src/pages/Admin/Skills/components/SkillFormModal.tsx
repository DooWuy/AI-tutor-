import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, X, Zap } from 'lucide-react';
import { skillApi, SkillApiError } from '../../../../services/skillApi';
import { useToast } from '../../../../context/ToastContext';
import type { SkillCreatePayload, SkillItem, SkillUpdatePayload } from '../../../../types/skills';

interface SkillFormModalProps {
  isOpen: boolean;
  skill: SkillItem | null;
  onClose: () => void;
  onSuccess: (saved: SkillItem) => void;
}

const SUBJECT_OPTIONS = ['Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Tin học', 'Lịch sử', 'Địa lí'];
const GRADE_OPTIONS = ['10', '11', '12'];

export function SkillFormModal({ isOpen, skill, onClose, onSuccess }: SkillFormModalProps) {
  const { toast } = useToast();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Toán');
  const [gradeLevel, setGradeLevel] = useState('12');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(5);
  const [masteryThreshold, setMasteryThreshold] = useState(0.85);
  const [minAttempts, setMinAttempts] = useState(3);
  const [canSkip, setCanSkip] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
    setSubmitting(false);

    if (skill) {
      setCode(skill.skillCode || '');
      setName(skill.name || '');
      setSubject(skill.subject || 'Toán');
      setGradeLevel(skill.gradeLevel || '12');
      setDescription(skill.description || '');
      setImportance(skill.importance ?? 5);
      setMasteryThreshold(skill.masteryThreshold ?? 0.85);
      setMinAttempts(skill.minAttempts ?? 3);
      setCanSkip(Boolean(skill.canSkip));
    } else {
      setCode('');
      setName('');
      setSubject('Toán');
      setGradeLevel('12');
      setDescription('');
      setImportance(5);
      setMasteryThreshold(0.85);
      setMinAttempts(3);
      setCanSkip(false);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, skill, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setFormError('Mã kỹ năng không được để trống.');
      return;
    }
    if (!/^[A-Za-z0-9_]{2,20}$/.test(trimmedCode)) {
      setFormError('Mã kỹ năng phải từ 2-20 ký tự, chỉ gồm chữ cái, chữ số hoặc gạch dưới (_).');
      return;
    }
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Tên kỹ năng phải từ 2 ký tự trở lên.');
      return;
    }

    try {
      setSubmitting(true);
      let saved: SkillItem;
      if (skill) {
        const payload: SkillUpdatePayload = {
          code: trimmedCode,
          name: trimmedName,
          subject,
          gradeLevel,
          description: description.trim(),
          importance,
          masteryThreshold,
          minAttempts,
          canSkip,
        };
        saved = await skillApi.updateSkill(skill.id, payload);
        toast.success(`Cập nhật kỹ năng "${trimmedCode}" thành công!`);
      } else {
        const payload: SkillCreatePayload = {
          code: trimmedCode,
          name: trimmedName,
          subject,
          gradeLevel,
          description: description.trim(),
          importance,
          masteryThreshold,
          minAttempts,
          canSkip,
        };
        saved = await skillApi.createSkill(payload);
        toast.success(`Tạo kỹ năng mới "${trimmedCode}" thành công!`);
      }
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      if (err instanceof SkillApiError) {
        setFormError(err.message);
      } else {
        setFormError('Đã có lỗi xảy ra khi lưu kỹ năng. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181c22]/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-2xl bg-surface border border-outline-variant shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                {skill ? 'Chỉnh sửa Kỹ năng thích ứng' : 'Thêm Kỹ năng thích ứng mới'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                Định nghĩa kỹ năng và các tham số thuật toán học tập thích ứng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs text-red-500">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Mã kỹ năng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: MATH_DER_01"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs font-mono text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-on-surface mb-1">
                Tên kỹ năng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Tính đạo hàm hàm đa thức"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Row 2: Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Môn học</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Khối lớp</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    Lớp {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">Mô tả kỹ năng</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Mô tả tóm tắt mục tiêu rèn luyện và yêu cầu nắm vững của kỹ năng..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Algorithm Parameters Box */}
          <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest/50 p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Sparkles size={16} />
              <span>Tham số thuật toán thích ứng (Adaptive Parameters)</span>
            </div>

            {/* Importance Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-on-surface">Độ quan trọng (Importance):</span>
                <span className="font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                  {importance} / 10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full accent-[#004bb5] h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-on-surface-variant">
                Trọng số ưu tiên xuất hiện trong đề thi (1 = cơ bản/phụ, 10 = trọng tâm thi THPT).
              </span>
            </div>

            {/* Mastery Threshold Slider */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-on-surface">Ngưỡng thành thạo (Mastery Threshold):</span>
                <span className="font-bold text-emerald-600 px-2 py-0.5 rounded-md bg-emerald-500/10">
                  {Math.round(masteryThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.05}
                value={masteryThreshold}
                onChange={(e) => setMasteryThreshold(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-surface-container rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-on-surface-variant">
                Tỷ lệ làm đúng cần đạt để được công nhận đã làm chủ kỹ năng này.
              </span>
            </div>

            {/* Min attempts & Can skip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Lượt thử tối thiểu (Min Attempts)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={minAttempts}
                  onChange={(e) => setMinAttempts(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container px-3 py-1.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  Số câu cần làm trước khi xét thành thạo.
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={canSkip}
                    onChange={(e) => setCanSkip(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-[#004bb5] focus:ring-primary"
                  />
                  <span className="text-xs font-semibold text-on-surface">Cho phép bỏ qua (Can Skip)</span>
                </label>
                <span className="text-[10px] text-on-surface-variant mt-0.5">
                  Học sinh làm tốt bài khảo sát có thể bỏ qua kỹ năng này.
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004bb5] to-[#2575fc] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-[#004bb5]/25 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting && <RefreshCw size={14} className="animate-spin" />}
              <span>{skill ? 'Cập nhật kỹ năng' : 'Tạo kỹ năng mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

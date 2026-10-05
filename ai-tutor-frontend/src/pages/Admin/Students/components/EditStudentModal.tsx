import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Lock, RefreshCw, X } from 'lucide-react';
import { updateStudent, AdminStudentApiError } from '../../../../services/adminStudentApi';
import type {
  AdminStudentDetail,
  AdminStudentListItem,
  StudentGender,
  UpdateAdminStudentPayload,
} from '../../../../types/adminStudent';

interface EditStudentModalProps {
  isOpen: boolean;
  student: AdminStudentListItem | AdminStudentDetail | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function EditStudentModal({ isOpen, student, onClose, onSuccess }: EditStudentModalProps) {
  const [form, setForm] = useState<UpdateAdminStudentPayload>({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    schoolName: '',
    gradeLevel: '10',
    className: '',
    address: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fullNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !student) return;

    setForm({
      fullName: student.fullName || '',
      phoneNumber: student.phoneNumber || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
      gender: student.gender || 'MALE',
      schoolName: student.schoolName || '',
      gradeLevel: student.gradeLevel || '10',
      className: student.className || '',
      address: ('address' in student && typeof student.address === 'string' ? student.address : '') || '',
      parentName: ('parentName' in student && typeof student.parentName === 'string' ? student.parentName : '') || '',
      parentEmail: ('parentEmail' in student && typeof student.parentEmail === 'string' ? student.parentEmail : '') || '',
      parentPhone: ('parentPhone' in student && typeof student.parentPhone === 'string' ? student.parentPhone : '') || '',
    });

    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, student, onClose]);

  if (!isOpen || !student) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
      fullNameRef.current?.focus();
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    try {
      setSubmitting(true);
      await updateStudent(student.studentId, {
        ...form,
        fullName: form.fullName.trim(),
        schoolName: form.schoolName?.trim() || undefined,
        className: form.className?.trim() || undefined,
        phoneNumber: form.phoneNumber?.trim() || undefined,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address?.trim() || undefined,
        parentName: form.parentName?.trim() || undefined,
        parentEmail: form.parentEmail?.trim() || undefined,
        parentPhone: form.parentPhone?.trim() || undefined,
      });

      onSuccess('Đã cập nhật hồ sơ học sinh.');
      onClose();
    } catch (err: unknown) {
      if (err instanceof AdminStudentApiError) {
        setFieldErrors(err.fieldErrors || {});
        setGeneralError(err.message || 'Không thể cập nhật hồ sơ học sinh.');
      } else {
        setGeneralError('Đã có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.');
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
      aria-labelledby="edit-student-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#c1c6d5]/70 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c1c6d5]/40 bg-[#f9f9ff]">
          <div>
            <h2 id="edit-student-modal-title" className="text-lg font-bold text-[#181c22]">
              Chỉnh sửa học sinh
            </h2>
            <p className="text-xs text-[#414753] mt-0.5">
              Cập nhật thông tin học tập và liên lạc của học sinh
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#717785] hover:bg-[#ebedf7] hover:text-[#181c22] transition-colors"
            aria-label="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-6">
            {generalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-xs font-medium" role="alert">
                <AlertCircle size={16} className="shrink-0 text-[#ba1a1a]" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Readonly Identity Section */}
            <div className="p-4 rounded-xl bg-[#f1f3fc] border border-[#c1c6d5]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#414753] flex items-center gap-1.5">
                  <Lock size={13} className="text-[#717785]" /> Thông tin định danh
                </span>
                <span className="text-[11px] text-[#717785] italic">
                  Thông tin định danh không chỉnh sửa tại đây.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#717785] block">Mã học sinh</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={student.studentCode}
                    className="w-full h-8 px-2.5 mt-1 text-xs bg-white/70 border border-[#c1c6d5]/60 rounded-md text-[#414753] font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#717785] block">Username</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={student.username}
                    className="w-full h-8 px-2.5 mt-1 text-xs bg-white/70 border border-[#c1c6d5]/60 rounded-md text-[#414753] font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#717785] block">Email</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={student.email}
                    className="w-full h-8 px-2.5 mt-1 text-xs bg-white/70 border border-[#c1c6d5]/60 rounded-md text-[#414753] font-medium truncate cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Editable Group 1: Thông tin cá nhân */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] flex items-center gap-1.5 pb-1 border-b border-[#c1c6d5]/30">
                Thông tin cá nhân & Liên hệ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-fullname">
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    ref={fullNameRef}
                    id="edit-fullname"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm({ ...form, fullName: e.target.value });
                      if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
                    }}
                    className={`w-full h-9 px-3 text-xs bg-[#f9f9ff] border rounded-lg text-[#181c22] font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 ${
                      fieldErrors.fullName
                        ? 'border-[#ba1a1a] bg-[#ffdad6]/20 focus:border-[#ba1a1a]'
                        : 'border-[#c1c6d5] focus:border-[#005cb8]'
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-[#ba1a1a] mt-0.5">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-phone">
                    Số điện thoại
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    value={form.phoneNumber || ''}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                {/* Birthday */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-dob">
                    Ngày sinh
                  </label>
                  <input
                    id="edit-dob"
                    type="date"
                    value={form.dateOfBirth || ''}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-gender">
                    Giới tính
                  </label>
                  <select
                    id="edit-gender"
                    value={form.gender || 'MALE'}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as StudentGender })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8] cursor-pointer"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-address">
                    Địa chỉ
                  </label>
                  <input
                    id="edit-address"
                    type="text"
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Quận/Huyện, Tỉnh/TP"
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>
              </div>
            </div>

            {/* Editable Group 2: Lớp học */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] flex items-center gap-1.5 pb-1 border-b border-[#c1c6d5]/30">
                Trường học & Phân lớp
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* School */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-school">
                    Trường
                  </label>
                  <input
                    id="edit-school"
                    type="text"
                    value={form.schoolName || ''}
                    onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                {/* Grade */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-grade">
                    Khối
                  </label>
                  <select
                    id="edit-grade"
                    value={form.gradeLevel || '10'}
                    onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8] cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-class">
                    Lớp
                  </label>
                  <input
                    id="edit-class"
                    type="text"
                    value={form.className || ''}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>
              </div>
            </div>

            {/* Editable Group 3: Thông tin phụ huynh */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] flex items-center gap-1.5 pb-1 border-b border-[#c1c6d5]/30">
                Thông tin phụ huynh (Tùy chọn)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-parent-name">
                    Họ tên cha/mẹ
                  </label>
                  <input
                    id="edit-parent-name"
                    type="text"
                    value={form.parentName || ''}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    placeholder="Nguyễn Văn B"
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-parent-phone">
                    SĐT phụ huynh
                  </label>
                  <input
                    id="edit-parent-phone"
                    type="tel"
                    value={form.parentPhone || ''}
                    onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="edit-parent-email">
                    Email phụ huynh
                  </label>
                  <input
                    id="edit-parent-email"
                    type="email"
                    value={form.parentEmail || ''}
                    onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                    placeholder="phuhuynh@example.com"
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#c1c6d5]/40 bg-[#f9f9ff]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-[#414753] hover:bg-[#ebedf7] hover:text-[#181c22] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#005cb8] hover:bg-[#1275e2] rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {submitting && <RefreshCw size={14} className="animate-spin" />}
              <span>{submitting ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

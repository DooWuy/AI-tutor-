import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, RefreshCw, X } from 'lucide-react';
import { createStudent, AdminStudentApiError } from '../../../../services/adminStudentApi';
import type { CreateAdminStudentPayload, StudentGender } from '../../../../types/adminStudent';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [form, setForm] = useState<CreateAdminStudentPayload>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    schoolName: '',
    gradeLevel: '10',
    className: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);

  // Refs for focusing on error
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      username: '',
      email: '',
      password: '',
      fullName: '',
      schoolName: '',
      gradeLevel: '10',
      className: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: 'MALE',
    });
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(false);
    setShowTempPassword(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.username.trim()) {
      errors.username = 'Vui lòng nhập username.';
    }
    if (!form.email.trim()) {
      errors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Email không hợp lệ.';
    }
    if (!form.password) {
      errors.password = 'Vui lòng nhập mật khẩu tạm.';
    } else if (form.password.length < 6) {
      errors.password = 'Mật khẩu tạm phải có ít nhất 6 ký tự.';
    }
    if (!form.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
    }

    setFieldErrors(errors);

    // Focus on the first error
    if (errors.username) {
      usernameInputRef.current?.focus();
    } else if (errors.email) {
      emailInputRef.current?.focus();
    } else if (errors.password) {
      passwordInputRef.current?.focus();
    } else if (errors.fullName) {
      fullNameInputRef.current?.focus();
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    try {
      setSubmitting(true);
      await createStudent({
        ...form,
        username: form.username.trim(),
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        schoolName: form.schoolName?.trim() || '',
        className: form.className?.trim() || undefined,
        phoneNumber: form.phoneNumber?.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
      });

      onSuccess('Đã tạo học sinh và gửi email thiết lập mật khẩu.');
      onClose();
    } catch (err: unknown) {
      if (err instanceof AdminStudentApiError) {
        const errors = { ...err.fieldErrors };
        const msg = err.message || '';

        // Check duplicate email / username
        if (msg.toLowerCase().includes('email') || errors.email) {
          errors.email = 'Email này đã được sử dụng.';
          emailInputRef.current?.focus();
        }
        if (msg.toLowerCase().includes('username') || errors.username) {
          errors.username = 'Username này đã tồn tại.';
          usernameInputRef.current?.focus();
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length === 0) {
          setGeneralError(msg || 'Không thể tạo học sinh. Vui lòng thử lại.');
        }
      } else {
        setGeneralError('Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối mạng và thử lại.');
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
      aria-labelledby="add-student-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#c1c6d5]/70 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c1c6d5]/40 bg-[#f9f9ff]">
          <div>
            <h2 id="add-student-modal-title" className="text-lg font-bold text-[#181c22]">
              Thêm học sinh
            </h2>
            <p className="text-xs text-[#414753] mt-0.5">
              Tạo tài khoản học sinh thủ công và gửi email kích hoạt
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

            {/* Group 1: Thông tin tài khoản */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] flex items-center gap-1.5 pb-1 border-b border-[#c1c6d5]/30">
                1. Thông tin tài khoản
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-username">
                    Username <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    ref={usernameInputRef}
                    id="add-username"
                    type="text"
                    value={form.username}
                    onChange={(e) => {
                      setForm({ ...form, username: e.target.value });
                      if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: '' });
                    }}
                    placeholder="vd: nguyenvana"
                    className={`w-full h-9 px-3 text-xs bg-[#f9f9ff] border rounded-lg text-[#181c22] font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 ${
                      fieldErrors.username
                        ? 'border-[#ba1a1a] bg-[#ffdad6]/20 focus:border-[#ba1a1a]'
                        : 'border-[#c1c6d5] focus:border-[#005cb8]'
                    }`}
                  />
                  {fieldErrors.username && (
                    <p className="text-[11px] text-[#ba1a1a] mt-0.5">{fieldErrors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-email">
                    Email <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    ref={emailInputRef}
                    id="add-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    placeholder="vd: a@example.com"
                    className={`w-full h-9 px-3 text-xs bg-[#f9f9ff] border rounded-lg text-[#181c22] font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 ${
                      fieldErrors.email
                        ? 'border-[#ba1a1a] bg-[#ffdad6]/20 focus:border-[#ba1a1a]'
                        : 'border-[#c1c6d5] focus:border-[#005cb8]'
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-[#ba1a1a] mt-0.5">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-password">
                    Mật khẩu tạm <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      id="add-password"
                      type={showTempPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                      }}
                      placeholder="Tối thiểu 6 ký tự"
                      className={`w-full h-9 px-3 pr-10 text-xs bg-[#f9f9ff] border rounded-lg text-[#181c22] font-medium transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 ${
                        fieldErrors.password
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 focus:border-[#ba1a1a]'
                          : 'border-[#c1c6d5] focus:border-[#005cb8]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTempPassword((current) => !current)}
                      className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#717785] hover:bg-[#ebedf7] hover:text-[#181c22] transition-colors"
                      aria-label={showTempPassword ? 'Ẩn mật khẩu tạm' : 'Hiện mật khẩu tạm'}
                      aria-pressed={showTempPassword}
                    >
                      {showTempPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[11px] text-[#ba1a1a] mt-0.5">{fieldErrors.password}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Group 2: Thông tin cá nhân */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] flex items-center gap-1.5 pb-1 border-b border-[#c1c6d5]/30">
                2. Thông tin cá nhân
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-fullname">
                    Họ và tên <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    ref={fullNameInputRef}
                    id="add-fullname"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm({ ...form, fullName: e.target.value });
                      if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: '' });
                    }}
                    placeholder="vd: Nguyễn Văn A"
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
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-phone">
                    Số điện thoại
                  </label>
                  <input
                    id="add-phone"
                    type="tel"
                    value={form.phoneNumber || ''}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="vd: 0900000000"
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                {/* Birthday */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-dob">
                    Ngày sinh
                  </label>
                  <input
                    id="add-dob"
                    type="date"
                    value={form.dateOfBirth || ''}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-gender">
                    Giới tính
                  </label>
                  <select
                    id="add-gender"
                    value={form.gender || 'MALE'}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as StudentGender })}
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8] cursor-pointer"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Group 3: Lớp học */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#005cb8] flex items-center gap-1.5 pb-1 border-b border-[#c1c6d5]/30">
                3. Lớp học & Trường
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* School */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-school">
                    Trường
                  </label>
                  <input
                    id="add-school"
                    type="text"
                    value={form.schoolName || ''}
                    onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                    placeholder="vd: THCS Lê Lợi"
                    className="w-full h-9 px-3 text-xs bg-[#f9f9ff] border border-[#c1c6d5] rounded-lg text-[#181c22] font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005cb8]/20 focus:border-[#005cb8]"
                  />
                </div>

                {/* Grade */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-grade">
                    Khối
                  </label>
                  <select
                    id="add-grade"
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
                  <label className="text-xs font-bold text-[#414753]" htmlFor="add-class">
                    Lớp
                  </label>
                  <input
                    id="add-class"
                    type="text"
                    value={form.className || ''}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    placeholder="vd: 8A1"
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
              <span>{submitting ? 'Đang tạo...' : 'Tạo học sinh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

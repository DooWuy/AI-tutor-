import { useState, useMemo, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/authApi';
import type { RegisterData } from '../../types/auth';
import { styles } from './RegisterPage.styles';

const ACCESS_TOKEN_KEY = 'ai-tutor.access-token';
const USER_KEY = 'ai-tutor.user';

function persistSession(session: any) {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(USER_KEY);
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export default function RegisterPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterData>({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    schoolName: '',
    gradeLevel: '1',
    className: '',
    password: '',
    confirmPassword: ''
  });
  
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterData | 'terms', string>>>({});

  // Password strength logic
  const passwordScore = useMemo(() => {
    let score = 0;
    const val = formData.password;
    if (val.length >= 6) score++;
    if (val.length >= 8 && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(val)) score++;
    return score;
  }, [formData.password]);

  const strengthLevels = [
    { label: 'Rất yếu', color: 'bg-error', text: 'text-error' },
    { label: 'Yếu', color: 'bg-tertiary', text: 'text-tertiary' },
    { label: 'Khá tốt', color: 'bg-secondary', text: 'text-secondary' },
    { label: 'Mạnh mẽ', color: 'bg-primary', text: 'text-primary' }
  ];

  const currentStrength = formData.password.length === 0 ? null : strengthLevels[Math.max(0, passwordScore - 1)];

  function handleChange(field: keyof RegisterData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const errors: Partial<Record<keyof RegisterData | 'terms', string>> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.';
    if (!formData.username.trim()) errors.username = 'Vui lòng nhập tên đăng nhập.';
    if (!formData.email.trim()) errors.email = 'Vui lòng nhập email.';
    if (!formData.schoolName.trim()) errors.schoolName = 'Vui lòng nhập tên trường.';
    if (!formData.password) errors.password = 'Vui lòng nhập mật khẩu.';
    else if (formData.password.length < 8) errors.password = 'Mật khẩu phải từ 8 ký tự.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Mật khẩu không khớp.';
    if (!termsAgreed) errors.terms = 'Bạn cần đồng ý với điều khoản dịch vụ.';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      const nextSession = await register(formData);
      persistSession(nextSession);
      navigate('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.layout.container}>
      <header className={styles.header.wrapper}>
        <div className={styles.header.inner}>
          <Link className={styles.header.logoLink} to="/">
            <img alt="AI Tutor Logo" className={styles.header.logoImg} src="https://lh3.googleusercontent.com/aida/AEtjO1UkI5g-Uaqq8t2YJYNnyTlK2zqgw03-kkPdwv0OvUyqdVq7fWLfwNIzKUFf7n2hRe6E-pufaaXyYZBqZNh0hziW3Dk1IAa_MrHhLT038MCUNWwrAi8S059jHaTtOQYgnCoG32UzRCFKXNcrbXPQ61iQeXffVraTfLNc6kygG4Nard6nM2jvdCkc6EZtjYAiv5djqccxHtxr1Senx0iFeEB40Hj8QtnPcaLu-141g2IQ9BaqHomSN8PSTF0" />
            <span className={styles.header.logoText}>
              AI Tutor<span className={styles.header.logoDot}></span>
            </span>
          </Link>
          <nav className={styles.header.nav}>
            <Link className={styles.header.navLink} to="/">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Về trang chủ</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className={styles.layout.main}>
        <div className={styles.layout.mainInner}>
          <section 
            className={styles.layout.contentWrapper}
            style={{ backgroundImage: "linear-gradient(rgba(249, 249, 255, 0.9), rgba(249, 249, 255, 0.9)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMz2NUoLlni8Gj29Ws144xyiNkOAdivoN1bmcX9uvmuK2mkkaAdJl7Lyhc3ChJfl2e1StcdolfSPd4HO8wbo35s5URWo_Fn_H3vO3uViozqOSH3jSVz6V-LDO6M3Jlu24D2GxGziEFndDeo5ykO0vhWv6WUs7S6ZkS-f_B1ahv9T1Tdf478B_erQ-kIJaUEa6ErCqpmRAQxxFIQYjhANbwDMsY3Kqy7k2Fgt8hwA-6lk76enOf9ZuB')", backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className={styles.layout.card}>
              <div>
                <div className={styles.auth.taglineWrapper}>
                  <span className={styles.auth.tagline}>
                    <span className={styles.auth.taglineIcon}>bolt</span>
                    Khởi đầu thông minh
                  </span>
                </div>
                <h1 className={styles.auth.title}>Tạo tài khoản AI Tutor miễn phí</h1>
                <p className={styles.auth.subtitle}>Bắt đầu hành trình chinh phục điểm 9+ cùng gia sư AI thông minh đồng hành 24/7.</p>

                {message && (
                  <div className={styles.auth.alertError}>
                    {message}
                  </div>
                )}
                
                <form className={styles.form.wrapper} onSubmit={handleSubmit} noValidate>
                  <div className={styles.form.grid}>
                    <div>
                      <label className={styles.form.field} htmlFor="fullName">Họ và tên học sinh *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>person</span>
                        <input className={styles.form.input(!!fieldErrors.fullName)} id="fullName" value={formData.fullName} onChange={handleChange('fullName')} placeholder="Nguyễn Văn An" type="text" />
                      </div>
                      {fieldErrors.fullName && <p className={styles.form.errorText}>{fieldErrors.fullName}</p>}
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="username">Tên đăng nhập *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>badge</span>
                        <input className={styles.form.input(!!fieldErrors.username)} id="username" value={formData.username} onChange={handleChange('username')} placeholder="nguyenvanan123" type="text" />
                      </div>
                      {fieldErrors.username && <p className={styles.form.errorText}>{fieldErrors.username}</p>}
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="email">Email *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>mail</span>
                        <input className={styles.form.input(!!fieldErrors.email)} id="email" value={formData.email} onChange={handleChange('email')} placeholder="hocsinh@example.com" type="email" />
                      </div>
                      {fieldErrors.email && <p className={styles.form.errorText}>{fieldErrors.email}</p>}
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="phoneNumber">Số điện thoại</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>call</span>
                        <input className={styles.form.input(!!fieldErrors.phoneNumber)} id="phoneNumber" value={formData.phoneNumber} onChange={handleChange('phoneNumber')} placeholder="0912345678" type="tel" />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={styles.form.field} htmlFor="schoolName">Tên trường *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>school</span>
                        <input className={styles.form.input(!!fieldErrors.schoolName)} id="schoolName" value={formData.schoolName} onChange={handleChange('schoolName')} placeholder="THPT Chuyên..." type="text" />
                      </div>
                      {fieldErrors.schoolName && <p className={styles.form.errorText}>{fieldErrors.schoolName}</p>}
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="gradeLevel">Khối lớp *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>auto_stories</span>
                        <select className={styles.form.input(!!fieldErrors.gradeLevel)} id="gradeLevel" value={formData.gradeLevel} onChange={handleChange('gradeLevel') as any}>
                          <option value="1">Lớp 1</option>
                          <option value="2">Lớp 2</option>
                          <option value="3">Lớp 3</option>
                          <option value="4">Lớp 4</option>
                          <option value="5">Lớp 5</option>
                          <option value="6">Lớp 6</option>
                          <option value="7">Lớp 7</option>
                          <option value="8">Lớp 8</option>
                          <option value="9">Lớp 9</option>
                          <option value="10">Lớp 10</option>
                          <option value="11">Lớp 11</option>
                          <option value="12">Lớp 12</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="className">Tên lớp</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>class</span>
                        <input className={styles.form.input(!!fieldErrors.className)} id="className" value={formData.className} onChange={handleChange('className')} placeholder="10A1" type="text" />
                      </div>
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="password">Mật khẩu *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>lock</span>
                        <input className={styles.form.inputPassword(!!fieldErrors.password)} id="password" value={formData.password} onChange={handleChange('password')} placeholder="Mật khẩu" type={showPassword ? 'text' : 'password'} />
                        <button type="button" className={styles.form.togglePasswordBtn} onClick={() => setShowPassword(!showPassword)}>
                          <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      <div className={styles.form.strengthWrapper}>
                        {[1, 2, 3, 4].map((level) => (
                          <div key={level} className={styles.form.strengthBar(passwordScore >= level, currentStrength?.color || '')}></div>
                        ))}
                        <span className={`${styles.form.strengthText} ${currentStrength?.text || 'text-outline'}`}>
                          {currentStrength?.label || 'Bảo mật'}
                        </span>
                      </div>
                      {fieldErrors.password && <p className={styles.form.errorText}>{fieldErrors.password}</p>}
                    </div>

                    <div>
                      <label className={styles.form.field} htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>lock</span>
                        <input className={styles.form.inputPassword(!!fieldErrors.confirmPassword)} id="confirmPassword" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} placeholder="Nhập lại mật khẩu" type={showPassword ? 'text' : 'password'} />
                      </div>
                      {fieldErrors.confirmPassword && <p className={styles.form.errorText}>{fieldErrors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div className={styles.form.termsWrapper}>
                    <label className={styles.form.termsLabel}>
                      <input className={styles.form.checkbox} id="terms" type="checkbox" checked={termsAgreed} onChange={(e) => { setTermsAgreed(e.target.checked); setFieldErrors(prev => ({ ...prev, terms: undefined })); }} />
                      <span className={styles.form.termsText}>
                        Tôi đồng ý với <a className={styles.form.termsLink} href="#">Điều khoản dịch vụ</a> và <a className={styles.form.termsLink} href="#">Chính sách bảo mật</a> của AI Tutor.
                      </span>
                    </label>
                    {fieldErrors.terms && <p className={styles.form.errorText}>{fieldErrors.terms}</p>}
                  </div>

                  <div className={styles.form.submitWrapper}>
                    <button disabled={isSubmitting} className={styles.form.submitBtn} type="submit">
                      <span>{isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}</span>
                      {!isSubmitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                    </button>
                  </div>
                </form>
              </div>

              <div className={styles.auth.footer}>
                <p className={styles.auth.footerText}>
                  Đã có tài khoản AI Tutor? 
                  <Link className={styles.auth.loginLink} to="/login">Đăng nhập ngay</Link>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

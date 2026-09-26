import { useMemo, useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, logout, getStoredSession, persistSession } from '../../services/authApi'
import type { AuthSession } from '../../types/auth'
import { LoginBackground } from './components/LoginBackground'
import { styles } from './LoginPage.styles'

// session functions imported from authApi

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  
  const firstName = useMemo(() => session?.user.fullName?.trim().split(/\s+/).at(-1), [session])

  const navigate = useNavigate()

  // Redirect automatically if session exists
  useEffect(() => {
    if (session) {
      let target = '/student/dashboard'
      if (session.user.role === 'ADMIN') target = '/admin/dashboard'
      else if (session.user.role === 'TEACHER') target = '/teacher/dashboard'
      navigate(target, { replace: true })
    }
  }, [session, navigate])

  function validate() {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = 'Vui lòng nhập email hoặc tên đăng nhập.'
    if (!password) errors.password = 'Vui lòng nhập mật khẩu.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(null)
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const nextSession = await login({ email: email.trim(), password })
      persistSession(nextSession, remember); setSession(nextSession); setPassword('')
      let target = '/student/dashboard'
      if (nextSession.user.role === 'ADMIN') target = '/admin/dashboard'
      else if (nextSession.user.role === 'TEACHER') target = '/teacher/dashboard'
      navigate(target, { replace: true })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.')
    } finally { setIsSubmitting(false) }
  }

  async function handleLogout() {
    if (!session) return
    setIsSubmitting(true)
    await logout()
    setSession(null); setMessage(null); setIsSubmitting(false)
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
          <div className={styles.layout.contentWrapper}>
            <LoginBackground />

            <div className={styles.layout.card}>
              {session ? (
                <>
                  <div className={styles.auth.titleWrapper}>
                    <div className={styles.auth.successIconWrapper}>
                      <span className="material-symbols-outlined text-[28px]">check_circle</span>
                    </div>
                    <h1 className={styles.auth.title}>Đăng nhập thành công!</h1>
                    <p className={styles.auth.subtitle}>Chào {firstName || 'bạn'}, phiên đăng nhập đã được lưu.</p>
                  </div>
                  <div className={styles.session.infoBox}>
                    <div className={styles.session.infoRow}><span className={styles.session.infoLabel}>Họ và tên</span><span className={styles.session.infoValue}>{session.user.fullName}</span></div>
                    <div className={styles.session.infoRow}><span className={styles.session.infoLabel}>Email</span><span className={styles.session.infoValue}>{session.user.email}</span></div>
                    <div className={styles.session.infoRow}><span className={styles.session.infoLabel}>Vai trò</span><span className={styles.session.infoValue}>{session.user.role}</span></div>
                  </div>
                  <button onClick={handleLogout} disabled={isSubmitting} className={styles.session.logoutBtn}>
                    {isSubmitting ? 'Đang xử lý...' : 'Đăng xuất để thử lại'}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.auth.titleWrapper}>
                    <div className={styles.auth.iconWrapper}>
                      <span className="material-symbols-outlined text-[28px]">psychology</span>
                    </div>
                    <h1 className={styles.auth.title}>Chào mừng bạn trở lại!</h1>
                    <p className={styles.auth.subtitle}>Đăng nhập để tiếp tục chuỗi học tập cùng gia sư AI cá nhân hóa.</p>
                  </div>

                  <form className={styles.form.wrapper} onSubmit={handleSubmit} noValidate>
                    <div>
                      <label className={styles.form.field} htmlFor="identifier">Email hoặc Tên đăng nhập</label>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>mail</span>
                        <input 
                          className={styles.form.input(!!fieldErrors.email)}
                          id="identifier" 
                          placeholder="name@example.com hoặc username" 
                          type="text"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setFieldErrors(cur => ({ ...cur, email: undefined })) }}
                        />
                      </div>
                      {fieldErrors.email && <p className={styles.form.errorText}>{fieldErrors.email}</p>}
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={styles.form.field} htmlFor="password">Mật khẩu</label>
                        <a className={styles.form.forgotPassword} href="/forgot-password">Quên mật khẩu?</a>
                      </div>
                      <div className={styles.form.inputWrapper}>
                        <span className={styles.form.inputIcon}>lock</span>
                        <input 
                          className={styles.form.inputPassword(!!fieldErrors.password)}
                          id="password" 
                          placeholder="Nhập ít nhất 8 ký tự" 
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFieldErrors(cur => ({ ...cur, password: undefined })) }}
                        />
                        <button 
                          type="button"
                          className={styles.form.togglePasswordBtn}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                      {fieldErrors.password && <p className={styles.form.errorText}>{fieldErrors.password}</p>}
                    </div>
                    
                    <div className="flex items-center justify-between pt-1">
                      <label className={styles.form.rememberWrapper}>
                        <input 
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className={styles.form.checkbox}
                          type="checkbox"
                        />
                        <span className={styles.form.rememberText}>Ghi nhớ đăng nhập trên thiết bị này</span>
                      </label>
                    </div>
                    
                    {message && (
                      <div className={styles.auth.alertError}>
                        {message}
                      </div>
                    )}
                    
                    <button 
                      disabled={isSubmitting}
                      className={styles.form.submitBtn}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <span>Đang xử lý...</span>
                      ) : (
                        <>
                          <span>Đăng nhập</span>
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                  
                  <div className={styles.auth.footer}>
                    <p className={styles.auth.footerText}>
                      Chưa có tài khoản? <Link to="/register" className={styles.auth.registerLink}>Đăng ký ngay →</Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

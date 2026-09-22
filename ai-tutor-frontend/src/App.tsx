import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'
import { login, logout } from './services/authApi'
import type { AuthSession, User } from './types/auth'

const ACCESS_TOKEN_KEY = 'ai-tutor.access-token'
const USER_KEY = 'ai-tutor.user'

type IconName = 'arrow-left' | 'arrow-right' | 'brain' | 'eye' | 'eye-off' | 'lock' | 'mail'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    'arrow-left': <><path d="m15 18-6-6 6-6" /><path d="M9 12h10" /></>,
    'arrow-right': <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    brain: <><path d="M9.5 4.5A3 3 0 0 0 4 6.2a3.2 3.2 0 0 0 .6 5.7A3 3 0 0 0 9.5 15" /><path d="M14.5 4.5A3 3 0 0 1 20 6.2a3.2 3.2 0 0 1-.6 5.7 3 3 0 0 1-4.9 3.1" /><path d="M9.5 4.5V19a2.5 2.5 0 0 0 5 0V4.5" /><path d="M6 9h3.5M14.5 9H18M7 15h2.5m5 0H17" /></>,
    eye: <><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.5" /></>,
    'eye-off': <><path d="m3 3 18 18" /><path d="M10.7 7.1A10.6 10.6 0 0 1 12 7c6 0 9.5 5 9.5 5a16 16 0 0 1-2.2 2.6M6.1 6.1C3.8 7.6 2.5 12 2.5 12s3.5 5 9.5 5c1.2 0 2.3-.2 3.3-.5" /><path d="M10 10a2.8 2.8 0 0 0 4 4" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  }

  return (
    <svg aria-hidden="true" className="icon" fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name]}</g>
    </svg>
  )
}

function Brand() {
  return (
    <a aria-label="AI Tutor" className="brand" href="/">
      <span aria-hidden="true" className="brand__mark"><Icon name="brain" size={18} /></span>
      <span>AI Tutor</span><span aria-hidden="true" className="brand__dot" />
    </a>
  )
}

function LearningIllustration() {
  return (
    <svg aria-hidden="true" className="scene scene--left" viewBox="0 0 440 360">
      <ellipse cx="190" cy="345" fill="#dbeafe" opacity=".75" rx="160" ry="18" />
      <rect fill="#3b82f6" height="20" rx="5" width="75" x="40" y="290" /><rect fill="#fbbf24" height="18" rx="4" width="65" x="45" y="272" /><rect fill="#10b981" height="16" rx="4" width="58" x="48" y="256" />
      <rect fill="#f97316" height="85" rx="18" width="70" x="80" y="210" /><circle cx="115" cy="238" fill="#ea580c" r="16" /><rect fill="#ffedd5" height="22" rx="6" width="46" x="92" y="260" />
      <ellipse cx="210" cy="315" fill="#2563eb" rx="42" ry="35" /><circle cx="210" cy="200" fill="#fed7aa" r="34" /><path d="M178 195c2-40 62-40 64 0-12-15-52-15-64 0Z" fill="#1e293b" />
      <circle cx="198" cy="198" fill="#1e293b" r="4" /><circle cx="222" cy="198" fill="#1e293b" r="4" /><path d="M204 212q6 7 12 0" fill="none" stroke="#9a3412" strokeLinecap="round" strokeWidth="2.5" />
      <path d="m176 250-36-35m100 35 35 10" stroke="#fed7aa" strokeLinecap="round" strokeWidth="12" /><rect fill="#fff" height="30" rx="4" stroke="#93c5fd" strokeWidth="2" transform="rotate(15 260 240)" width="40" x="260" y="240" />
      <circle cx="325" cy="180" fill="#60a5fa" r="32" /><rect fill="#eff6ff" height="28" rx="8" width="40" x="305" y="165" /><circle cx="318" cy="179" fill="#2563eb" r="4" /><circle cx="332" cy="179" fill="#2563eb" r="4" />
      <path d="M321 187q4 4 8 0" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="2" /><circle cx="325" cy="142" fill="#f59e0b" r="5" /><path d="M325 147v13" stroke="#60a5fa" strokeLinecap="round" strokeWidth="3" /><path d="m60 160 4 12h12l-10 8 4 12-10-8-10 8 4-12-10-8h12Z" fill="#fbbf24" />
    </svg>
  )
}

function AchievementIllustration() {
  return (
    <svg aria-hidden="true" className="scene scene--right" viewBox="0 0 440 360">
      <ellipse cx="240" cy="345" fill="#fbcfe8" opacity=".6" rx="160" ry="18" /><rect fill="#f97316" height="40" rx="6" width="46" x="300" y="295" /><path d="M304 295h38l-7-48h-24Z" fill="#ea580c" />
      <circle cx="323" cy="240" fill="#fde68a" r="14" /><path d="m323 226 5 9 10 1-7 7 2 10-10-5-9 5 2-10-7-7 10-1Z" fill="#f59e0b" />
      <rect fill="#fff" height="100" rx="8" stroke="#c7d2fe" strokeWidth="3" width="76" x="115" y="230" /><path d="M132 250h42m-42 16h30m-30 16h38" stroke="#93c5fd" strokeLinecap="round" strokeWidth="4" />
      <circle cx="248" cy="215" fill="#86efac" r="34" /><path d="M225 210q23-28 46 0v36h-46Z" fill="#16a34a" /><circle cx="248" cy="205" fill="#fed7aa" r="24" /><path d="M226 201q5-30 44-4-17-7-44 4Z" fill="#334155" />
      <circle cx="240" cy="205" fill="#334155" r="3" /><circle cx="256" cy="205" fill="#334155" r="3" /><path d="M242 216q6 5 12 0" fill="none" stroke="#9a3412" strokeLinecap="round" strokeWidth="2" /><path d="m226 252-32 28m76-28 24 22" stroke="#fed7aa" strokeLinecap="round" strokeWidth="11" />
      <circle cx="68" cy="285" fill="#60a5fa" r="25" /><path d="m55 284 9 9 17-20" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="6" /><path d="m376 165 4 12h13l-10 8 4 12-11-8-10 8 4-12-10-8h12Z" fill="#ec4899" opacity=".75" />
    </svg>
  )
}

function readStoredSession(): AuthSession | null {
  for (const storage of [localStorage, sessionStorage]) {
    const accessToken = storage.getItem(ACCESS_TOKEN_KEY)
    const rawUser = storage.getItem(USER_KEY)
    if (!accessToken || !rawUser) continue
    try { return { accessToken, user: JSON.parse(rawUser) as User } }
    catch { storage.removeItem(ACCESS_TOKEN_KEY); storage.removeItem(USER_KEY) }
  }
  return null
}

function persistSession(session: AuthSession, remember: boolean) {
  clearSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  storage.setItem(USER_KEY, JSON.stringify(session.user))
}

function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(ACCESS_TOKEN_KEY)
    storage.removeItem(USER_KEY)
  }
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())
  const firstName = useMemo(() => session?.user.fullName?.trim().split(/\s+/).at(-1), [session])

  function validate() {
    const errors: { email?: string; password?: string } = {}
    if (!email.trim()) errors.email = 'Vui lòng nhập email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Email chưa đúng định dạng.'
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.')
    } finally { setIsSubmitting(false) }
  }

  async function handleLogout() {
    if (!session) return
    setIsSubmitting(true)
    try { await logout(session.accessToken) } catch { /* Clear stale local sessions even if the API is unavailable. */ }
    finally { clearSession(); setSession(null); setMessage(null); setIsSubmitting(false) }
  }

  return (
    <div className="app-shell">
      <header className="site-header"><div className="site-header__inner"><Brand /><a className="back-link" href="/"><Icon name="arrow-left" size={18} /><span>Về trang chủ</span></a></div></header>
      <main className="login-page">
        <div className="login-page__backdrop" /><LearningIllustration /><AchievementIllustration />
        {session ? (
          <section aria-labelledby="success-title" className="login-card login-card--success">
            <div className="success-mark" aria-hidden="true">✓</div><h1 id="success-title">Đăng nhập thành công!</h1>
            <p>Chào {firstName || 'bạn'}, phiên đăng nhập đã được lưu và sẵn sàng cho các màn hình tiếp theo.</p>
            <dl className="session-summary"><div><dt>Họ và tên</dt><dd>{session.user.fullName}</dd></div><div><dt>Email</dt><dd>{session.user.email}</dd></div><div><dt>Vai trò</dt><dd>{session.user.role}</dd></div></dl>
            <button className="primary-button" disabled={isSubmitting} onClick={handleLogout} type="button">{isSubmitting ? <span className="spinner" /> : 'Đăng xuất để thử lại'}</button>
          </section>
        ) : (
          <section aria-labelledby="login-title" className="login-card">
            <div className="login-intro"><span aria-hidden="true" className="hero-icon"><Icon name="brain" size={28} /></span><h1 id="login-title">Chào mừng bạn trở lại!</h1><p>Đăng nhập để tiếp tục chuỗi học tập cùng gia sư AI cá nhân hóa.</p></div>
            <button className="google-button" onClick={() => setMessage('Đăng nhập Google chưa khả dụng trong phiên bản MVP.')} type="button"><span aria-hidden="true" className="google-mark">G</span>Đăng nhập nhanh với Google</button>
            <div className="divider"><span>Hoặc đăng nhập với email</span></div>
            <form noValidate onSubmit={handleSubmit}>
              <div className="field-group"><label htmlFor="email">Email</label><div className={`input-wrap${fieldErrors.email ? ' input-wrap--error' : ''}`}><span className="input-icon"><Icon name="mail" /></span><input aria-describedby={fieldErrors.email ? 'email-error' : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" id="email" onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: undefined })) }} placeholder="name@example.com" type="email" value={email} /></div>{fieldErrors.email && <span className="field-error" id="email-error">{fieldErrors.email}</span>}</div>
              <div className="field-group"><div className="field-label-row"><label htmlFor="password">Mật khẩu</label><a href="/forgot-password">Quên mật khẩu?</a></div><div className={`input-wrap${fieldErrors.password ? ' input-wrap--error' : ''}`}><span className="input-icon"><Icon name="lock" /></span><input aria-describedby={fieldErrors.password ? 'password-error' : undefined} aria-invalid={Boolean(fieldErrors.password)} autoComplete="current-password" id="password" onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: undefined })) }} placeholder="Nhập mật khẩu của bạn" type={showPassword ? 'text' : 'password'} value={password} /><button aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="password-toggle" onClick={() => setShowPassword((current) => !current)} type="button"><Icon name={showPassword ? 'eye-off' : 'eye'} /></button></div>{fieldErrors.password && <span className="field-error" id="password-error">{fieldErrors.password}</span>}</div>
              <label className="remember-row"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /><span aria-hidden="true" className="custom-checkbox">✓</span><span>Ghi nhớ đăng nhập trên thiết bị này</span></label>
              {message && <div aria-live="polite" className="form-message" role="status">{message}</div>}
              <button className="primary-button" disabled={isSubmitting} type="submit">{isSubmitting ? <><span className="spinner" />Đang đăng nhập...</> : <>Đăng nhập<Icon name="arrow-right" /></>}</button>
            </form>
            <p className="register-prompt">Chưa có tài khoản? <a href="/register">Đăng ký ngay <span aria-hidden="true">→</span></a></p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App

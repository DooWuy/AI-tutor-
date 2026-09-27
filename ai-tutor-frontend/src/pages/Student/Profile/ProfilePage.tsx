import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { changePassword, getMyStudentProfile, updateMyStudentProfile, uploadMyAvatar } from '../../../services/studentProfileApi'
import type { Gender, StudentProfile } from '../../../types/studentProfile'

const emptyProfile: StudentProfile = {
  userId: '', studentId: '', studentCode: '', username: '', email: '', fullName: '', dateOfBirth: null,
  gender: 'OTHER', phoneNumber: null, avatarUrl: null, gradeLevel: null, className: null, schoolName: null,
  studyPreferences: {}, totalXp: 0, currentLevel: 1, currentStreak: 0,
}

const inputClass = 'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15'
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-primary-container disabled:cursor-wait disabled:opacity-60'
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low'

function preferencesOf(profile: StudentProfile) {
  const preferences = profile.studyPreferences || {}
  return {
    dailyGoalMinutes: typeof preferences.dailyGoalMinutes === 'number' ? preferences.dailyGoalMinutes : 45,
    favoriteSubjects: Array.isArray(preferences.favoriteSubjects)
      ? preferences.favoriteSubjects.filter((value): value is string => typeof value === 'string') : [],
  }
}

export const ProfilePage = () => {
  const [profile, setProfile] = useState(emptyProfile)
  const [draft, setDraft] = useState<StudentProfile>(emptyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({ old: false, next: false, confirm: false })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMyStudentProfile().then((data) => { setProfile(data); setDraft(data) })
      .catch((error: unknown) => setPageError(error instanceof Error ? error.message : 'Không thể tải hồ sơ.'))
      .finally(() => setLoading(false))
  }, [])

  const preferences = useMemo(() => preferencesOf(profile), [profile])
  const draftPreferences = useMemo(() => preferencesOf({ ...profile, ...draft }), [draft, profile])
  const avatar = profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=005cb8&color=fff&bold=true`

  function beginEditing() {
    setDraft({ ...profile, studyPreferences: { ...profile.studyPreferences } }); setIsEditing(true); setIsSecurityOpen(true); setNotice(null); setPageError(null)
  }

  function cancelEditing() { setDraft(profile); setIsEditing(false); setIsSecurityOpen(false) }

  function setPreference(key: string, value: unknown) {
    setDraft((current) => ({ ...current, studyPreferences: { ...(current.studyPreferences || {}), [key]: value } }))
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setSaving(true); setPageError(null); setNotice(null)
    try {
      const data = await updateMyStudentProfile({
        fullName: draft.fullName?.trim(), dateOfBirth: draft.dateOfBirth || null, gender: draft.gender,
        phoneNumber: draft.phoneNumber?.trim() || null, gradeLevel: draft.gradeLevel?.trim(),
        className: draft.className?.trim() || null, studyPreferences: draft.studyPreferences || {},
      })
      setProfile(data); setDraft(data); setIsEditing(false); setNotice('Hồ sơ đã được cập nhật.')
    } catch (error: unknown) { setPageError(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.') }
    finally { setSaving(false) }
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''
    if (!file) return
    setUploading(true); setPageError(null); setNotice(null)
    try { setProfile(await uploadMyAvatar(file)); setNotice('Ảnh đại diện đã được cập nhật.') }
    catch (error: unknown) { setPageError(error instanceof Error ? error.message : 'Không thể tải ảnh đại diện.') }
    finally { setUploading(false) }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault(); setPasswordError(null); setPasswordNotice(null)
    if (password.newPassword.length < 8) { setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.'); return }
    if (password.newPassword !== password.confirmPassword) { setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp.'); return }
    setPasswordSaving(true)
    try {
      await changePassword(password.oldPassword, password.newPassword, password.confirmPassword)
      setPassword({ oldPassword: '', newPassword: '', confirmPassword: '' }); setPasswordNotice('Mật khẩu đã được thay đổi.')
    } catch (error: unknown) { setPasswordError(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.') }
    finally { setPasswordSaving(false) }
  }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center text-sm text-on-surface-variant"><span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>Đang tải hồ sơ...</div>
  if (pageError && !profile.userId) return <div className="rounded-xl border border-error/20 bg-error-container p-6 text-sm text-on-error-container"><strong>Không thể tải hồ sơ.</strong><p className="mt-1">{pageError}</p><button className={`${secondaryButton} mt-4`} onClick={() => window.location.reload()}>Thử lại</button></div>

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 border-b border-outline-variant/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hồ sơ học tập</p><h1 className="text-2xl font-semibold text-on-surface sm:text-3xl">Hồ sơ của mình</h1><p className="mt-1 text-sm text-on-surface-variant">Thông tin cá nhân, tiến độ và thiết lập học tập.</p></div>
        {!isEditing && <button className={primaryButton} onClick={beginEditing}><span className="material-symbols-outlined text-[18px]">edit</span>Chỉnh sửa hồ sơ</button>}
      </div>
      {pageError && <div className="rounded-lg border border-error/20 bg-error-container px-4 py-3 text-sm text-on-error-container">{pageError}</div>}
      {notice && <div className="rounded-lg border border-primary/20 bg-primary-fixed px-4 py-3 text-sm text-on-primary-fixed-variant">{notice}</div>}

      <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0"><img src={avatar} alt={`Ảnh đại diện của ${profile.fullName}`} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-primary-fixed sm:h-28 sm:w-28" /><button type="button" aria-label="Đổi ảnh đại diện" title="Đổi ảnh đại diện" onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-primary text-on-primary shadow-md transition hover:bg-primary-container disabled:opacity-60"><span className="material-symbols-outlined text-[18px]">photo_camera</span></button><input ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} /></div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-on-surface">{profile.fullName}</h2><span className="rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-semibold text-on-primary-fixed-variant">Học sinh</span></div><p className="mt-1 text-sm text-on-surface-variant">{profile.schoolName || 'Chưa cập nhật trường'} {profile.className ? `• ${profile.className}` : ''}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant"><span><strong className="text-on-surface">Mã học sinh:</strong> {profile.studentCode}</span><span><strong className="text-on-surface">Email:</strong> {profile.email}</span></div></div>
          <div className="rounded-lg bg-surface-container-low px-4 py-3 text-center sm:min-w-[132px]"><p className="text-xs text-on-surface-variant">Mục tiêu hôm nay</p><p className="mt-1 text-lg font-semibold text-primary">{preferences.dailyGoalMinutes} phút</p></div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[["bolt", 'Tổng XP', profile.totalXp.toLocaleString('vi-VN'), 'Điểm tích lũy'], ['military_tech', 'Cấp độ', `Cấp ${profile.currentLevel}`, 'Tiến bộ của bạn'], ['local_fire_department', 'Chuỗi ngày học', `${profile.currentStreak} ngày`, 'Duy trì thói quen']].map(([icon, label, value, hint]) => <div key={label} className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-on-surface-variant">{label}</span><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-fixed text-primary"><span className="material-symbols-outlined text-[18px]">{icon}</span></span></div><p className="mt-3 text-2xl font-semibold text-on-surface">{value}</p><p className="mt-1 text-xs text-on-surface-variant">{hint}</p></div>)}</section>

      {isEditing ? <form onSubmit={saveProfile} className="rounded-xl border border-primary/20 bg-surface-container-lowest p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-on-surface">Chỉnh sửa thông tin</h2><p className="mt-1 text-sm text-on-surface-variant">Email, mã học sinh và chỉ số học tập được bảo vệ.</p></div><span className="material-symbols-outlined text-primary">edit_note</span></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><label className="text-sm font-medium text-on-surface">Họ và tên<input className={`${inputClass} mt-1.5`} value={draft.fullName || ''} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} required maxLength={255} /></label><label className="text-sm font-medium text-on-surface">Ngày sinh<input className={`${inputClass} mt-1.5`} type="date" value={draft.dateOfBirth || ''} onChange={(event) => setDraft({ ...draft, dateOfBirth: event.target.value || null })} /></label><label className="text-sm font-medium text-on-surface">Giới tính<select className={`${inputClass} mt-1.5`} value={draft.gender || 'OTHER'} onChange={(event) => setDraft({ ...draft, gender: event.target.value as Gender })}><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label><label className="text-sm font-medium text-on-surface">Số điện thoại<input className={`${inputClass} mt-1.5`} value={draft.phoneNumber || ''} onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })} placeholder="0912345678" /></label><label className="text-sm font-medium text-on-surface">Khối lớp<input className={`${inputClass} mt-1.5`} value={draft.gradeLevel || ''} onChange={(event) => setDraft({ ...draft, gradeLevel: event.target.value })} maxLength={32} /></label><label className="text-sm font-medium text-on-surface">Tên lớp<input className={`${inputClass} mt-1.5`} value={draft.className || ''} onChange={(event) => setDraft({ ...draft, className: event.target.value })} maxLength={64} /></label></div><div className="mt-5 rounded-lg bg-surface-container-low p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-on-surface">Tùy chọn học tập</h3><p className="mt-1 text-xs text-on-surface-variant">Thiết lập để AI Tutor điều chỉnh nhịp học.</p></div><label className="text-sm font-medium text-on-surface">Mục tiêu mỗi ngày<input className={`${inputClass} mt-1.5 w-36`} type="number" min="15" max="180" step="5" value={draftPreferences.dailyGoalMinutes} onChange={(event) => setPreference('dailyGoalMinutes', Number(event.target.value))} /></label></div><div className="mt-4 flex flex-wrap gap-2">{['MATH', 'PHYSICS', 'CHEMISTRY', 'ENGLISH'].map((subject) => { const selected = draftPreferences.favoriteSubjects.includes(subject); return <button type="button" key={subject} onClick={() => setPreference('favoriteSubjects', selected ? draftPreferences.favoriteSubjects.filter((item) => item !== subject) : [...draftPreferences.favoriteSubjects, subject])} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? 'border-primary bg-primary text-on-primary' : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary'}`}>{subject}</button> })}</div></div><div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row"><button type="button" className={secondaryButton} onClick={cancelEditing}>Hủy</button><button type="submit" className={primaryButton} disabled={saving}>{saving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">save</span>}{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div></form> : <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm"><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-fixed text-primary"><span className="material-symbols-outlined">badge</span></span><div><h2 className="font-semibold text-on-surface">Thông tin cá nhân</h2><p className="text-xs text-on-surface-variant">Thông tin dùng trong hồ sơ học tập</p></div></div><dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">{[['Họ và tên', profile.fullName], ['Ngày sinh', profile.dateOfBirth || 'Chưa cập nhật'], ['Giới tính', profile.gender || 'Chưa cập nhật'], ['Số điện thoại', profile.phoneNumber || 'Chưa cập nhật'], ['Khối lớp', profile.gradeLevel || 'Chưa cập nhật'], ['Tên lớp', profile.className || 'Chưa cập nhật']].map(([label, value]) => <div key={label} className="rounded-lg bg-surface-container-low p-3"><dt className="text-xs text-on-surface-variant">{label}</dt><dd className="mt-1 text-sm font-semibold text-on-surface">{value}</dd></div>)}</dl><div className="mt-4 flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 text-xs text-on-surface-variant"><span className="material-symbols-outlined text-[17px] text-secondary">lock</span>Email đăng nhập cố định: <strong className="text-on-surface">{profile.email}</strong></div></section><section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary-container text-on-secondary-container"><span className="material-symbols-outlined">psychology</span></span><div><h2 className="font-semibold text-on-surface">Tùy chọn học tập</h2><p className="text-xs text-on-surface-variant">Cá nhân hóa nhịp học cùng AI</p></div></div><span className="rounded-full bg-secondary-container px-2.5 py-1 text-[11px] font-semibold text-on-secondary-container">AI Tutor</span></div><div className="rounded-lg bg-surface-container-low p-4"><p className="text-xs text-on-surface-variant">Môn học ưu tiên</p><div className="mt-2 flex flex-wrap gap-2">{preferences.favoriteSubjects.length ? preferences.favoriteSubjects.map((subject) => <span key={subject} className="rounded-full bg-primary-fixed px-3 py-1.5 text-xs font-semibold text-on-primary-fixed-variant">{subject}</span>) : <span className="text-sm text-on-surface-variant">Chưa chọn môn học</span>}</div></div><div className="mt-3 flex items-center justify-between rounded-lg bg-tertiary-fixed/60 p-4"><div><p className="text-xs text-on-tertiary-fixed-variant">Mục tiêu học mỗi ngày</p><p className="mt-1 text-xl font-semibold text-on-tertiary-fixed">{preferences.dailyGoalMinutes} phút</p></div><span className="material-symbols-outlined text-tertiary">hourglass_top</span></div></section></div>}

      <section className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <button type="button" className="flex w-full items-center justify-between gap-4 text-left" onClick={() => setIsSecurityOpen((open) => !open)} aria-expanded={isSecurityOpen}>
          <span className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary-container text-on-secondary-container"><span className="material-symbols-outlined">shield_lock</span></span><span><span className="block font-semibold text-on-surface">Bảo mật tài khoản</span><span className="mt-1 block text-sm text-on-surface-variant">Đổi mật khẩu và bảo vệ tài khoản học tập.</span></span></span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">{isSecurityOpen ? 'expand_less' : 'expand_more'}</span></span>
        </button>
        {isSecurityOpen && <form onSubmit={submitPassword} className="mt-5 border-t border-outline-variant/50 pt-5"><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {([['oldPassword', 'Mật khẩu hiện tại', 'old'], ['newPassword', 'Mật khẩu mới', 'next'], ['confirmPassword', 'Xác nhận mật khẩu', 'confirm']] as const).map(([field, label, visibility]) => <label key={field} className="text-sm font-medium text-on-surface">{label}<span className="relative mt-1.5 block"><input className={`${inputClass} pr-11`} type={visiblePasswords[visibility] ? 'text' : 'password'} value={password[field]} onChange={(event) => setPassword({ ...password, [field]: event.target.value })} minLength={field !== 'oldPassword' ? 8 : undefined} required /><button type="button" aria-label={visiblePasswords[visibility] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} title={visiblePasswords[visibility] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisiblePasswords({ ...visiblePasswords, [visibility]: !visiblePasswords[visibility] })} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary"><span className="material-symbols-outlined text-[19px]">{visiblePasswords[visibility] ? 'visibility_off' : 'visibility'}</span></button></span></label>)}
        </div><div className="mt-5 flex flex-col gap-3 rounded-lg bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm">{passwordError && <span className="text-error">{passwordError}</span>}{passwordNotice && <span className="text-primary">{passwordNotice}</span>}{!passwordError && !passwordNotice && <span className="text-xs text-on-surface-variant">Dùng tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</span>}</div><button className={secondaryButton} disabled={passwordSaving}><span className="material-symbols-outlined text-[18px]">lock_reset</span>{passwordSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</button></div></form>}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary-fixed/50 px-5 py-4"><div className="flex items-center gap-3"><span className="material-symbols-outlined text-primary">insights</span><div><p className="text-sm font-semibold text-on-primary-fixed">Muốn xem chi tiết tiến độ?</p><p className="text-xs text-on-primary-fixed-variant">Theo dõi lộ trình học tập tại trang tổng quan.</p></div></div><Link className={primaryButton} to="/student/dashboard">Mở tổng quan<span className="material-symbols-outlined text-[18px]">arrow_forward</span></Link></div>
    </div>
  )
}

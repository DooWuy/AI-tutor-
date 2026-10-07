import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  changePassword,
  getMyStudentProfile,
  updateMyStudentProfile,
  uploadMyAvatar,
} from '../../../services/studentProfileApi'
import type { Gender, StudentProfile } from '../../../types/studentProfile'
import { styles } from './ProfilePage.styles'
import { StudentStudyAnalyticsChart } from './components/StudentStudyAnalyticsChart'

const emptyProfile: StudentProfile = {
  userId: '',
  studentId: '',
  studentCode: '',
  username: '',
  email: '',
  fullName: '',
  dateOfBirth: null,
  gender: 'OTHER',
  phoneNumber: null,
  avatarUrl: null,
  gradeLevel: null,
  className: null,
  schoolName: null,
  studyPreferences: {},
  totalXp: 0,
  currentLevel: 1,
  currentStreak: 0,
}

type PasswordFieldErrors = {
  oldPassword?: string
  newPassword?: string
  confirmPassword?: string
}

function preferencesOf(profile: StudentProfile) {
  const preferences = profile.studyPreferences || {}
  return {
    dailyGoalMinutes:
      typeof preferences.dailyGoalMinutes === 'number' ? preferences.dailyGoalMinutes : 45,
    favoriteSubjects: Array.isArray(preferences.favoriteSubjects)
      ? preferences.favoriteSubjects.filter((value): value is string => typeof value === 'string')
      : ['Toán', 'Tiếng Anh'],
  }
}

export const ProfilePage = () => {
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile)
  const [draft, setDraft] = useState<StudentProfile>(emptyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSecurityOpen, setIsSecurityOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Password state
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({})
  const [visiblePasswords, setVisiblePasswords] = useState({ old: false, next: false, confirm: false })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMyStudentProfile()
      .then((data) => {
        setProfile(data)
        setDraft(data)
      })
      .catch((error: unknown) => {
        setPageError(error instanceof Error ? error.message : 'Không thể tải hồ sơ.')
      })
      .finally(() => setLoading(false))
  }, [])

  const preferences = useMemo(() => preferencesOf(profile), [profile])
  const draftPreferences = useMemo(() => preferencesOf({ ...profile, ...draft }), [draft, profile])

  const avatar =
    profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || 'Học sinh')}&background=004bb5&color=fff&bold=true`

  const passwordChecks = {
    minLength: password.newPassword.length >= 8,
    lowercase: /[a-z]/.test(password.newPassword),
    uppercase: /[A-Z]/.test(password.newPassword),
    number: /\d/.test(password.newPassword),
    special: /[!@#$%^&*()_+=-]/.test(password.newPassword),
  }
  const passwordIsStrong = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch =
    password.confirmPassword.length > 0 && password.newPassword === password.confirmPassword

  function validatePasswordForm(): PasswordFieldErrors {
    const errors: PasswordFieldErrors = {}
    const currentPassword = password.oldPassword
    const newPassword = password.newPassword
    const confirmPassword = password.confirmPassword

    if (!currentPassword.trim()) errors.oldPassword = 'Nhập mật khẩu hiện tại để tiếp tục.'
    if (currentPassword !== currentPassword.trim())
      errors.oldPassword = 'Mật khẩu hiện tại không được có khoảng trắng ở đầu hoặc cuối.'

    if (!newPassword.trim()) errors.newPassword = 'Nhập mật khẩu mới.'
    else if (/\s/.test(newPassword)) errors.newPassword = 'Mật khẩu mới không được chứa khoảng trắng.'
    else if (!passwordIsStrong) errors.newPassword = 'Mật khẩu mới chưa đạt đủ tiêu chí bên dưới.'
    else if (newPassword === currentPassword) errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'

    if (!confirmPassword.trim()) errors.confirmPassword = 'Nhập lại mật khẩu mới.'
    else if (confirmPassword !== confirmPassword.trim())
      errors.confirmPassword = 'Xác nhận mật khẩu không được có khoảng trắng ở đầu hoặc cuối.'
    else if (newPassword !== confirmPassword) errors.confirmPassword = 'Mật khẩu không khớp. Hãy nhập lại.'

    return errors
  }

  function beginEditing() {
    setDraft({ ...profile, studyPreferences: { ...profile.studyPreferences } })
    setIsEditing(true)
    setNotice(null)
    setPageError(null)
  }

  function cancelEditing() {
    setDraft(profile)
    setIsEditing(false)
  }

  function setPreference(key: string, value: unknown) {
    setDraft((current) => ({
      ...current,
      studyPreferences: { ...(current.studyPreferences || {}), [key]: value },
    }))
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setPageError(null)
    setNotice(null)
    try {
      const data = await updateMyStudentProfile({
        fullName: draft.fullName?.trim(),
        dateOfBirth: draft.dateOfBirth || null,
        gender: draft.gender,
        phoneNumber: draft.phoneNumber?.trim() || null,
        gradeLevel: draft.gradeLevel?.trim(),
        className: draft.className?.trim() || null,
        studyPreferences: draft.studyPreferences || {},
      })
      setProfile(data)
      setDraft(data)
      setIsEditing(false)
      setNotice('Hồ sơ đã được cập nhật thành công.')
    } catch (error: unknown) {
      setPageError(error instanceof Error ? error.message : 'Không thể lưu hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setPageError(null)
    setNotice(null)
    try {
      const updated = await uploadMyAvatar(file)
      setProfile(updated)
      setDraft(updated)
      setNotice('Ảnh đại diện đã được cập nhật thành công.')
    } catch (error: unknown) {
      setPageError(error instanceof Error ? error.message : 'Không thể tải ảnh đại diện.')
    } finally {
      setUploading(false)
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault()
    setPasswordError(null)
    setPasswordNotice(null)
    setPasswordFieldErrors({})
    const errors = validatePasswordForm()
    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors)
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(password.oldPassword, password.newPassword, password.confirmPassword)
      setPassword({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordFieldErrors({})
      setPasswordNotice('Mật khẩu của bạn đã được thay đổi thành công.')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể đổi mật khẩu.'
      if (message.toLowerCase().includes('mật khẩu cũ') || message.toLowerCase().includes('hiện tại')) {
        setPasswordFieldErrors({ oldPassword: message })
      } else if (message.toLowerCase().includes('xác nhận') || message.toLowerCase().includes('khớp')) {
        setPasswordFieldErrors({ confirmPassword: message })
      } else if (message.toLowerCase().includes('mật khẩu mới')) {
        setPasswordFieldErrors({ newPassword: message })
      }
      setPasswordError(message)
    } finally {
      setPasswordSaving(false)
    }
  }

  function updatePasswordField(field: keyof typeof password, value: string) {
    setPassword((current) => ({ ...current, [field]: value }))
    setPasswordFieldErrors((current) => ({ ...current, [field]: undefined }))
    setPasswordError(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-on-surface-variant">
        <span className="material-symbols-outlined mr-2.5 animate-spin text-primary text-[24px]">
          progress_activity
        </span>
        Đang tải hồ sơ học sinh...
      </div>
    )
  }

  if (pageError && !profile.userId) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error-container p-6 text-sm text-on-error-container">
        <strong className="text-base">Không thể tải hồ sơ.</strong>
        <p className="mt-1">{pageError}</p>
        <button
          className={`${styles.btnSecondary} mt-4`}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    )
  }

  const subjectsList = ['Toán', 'Vật lý', 'Hóa học', 'Tiếng Anh', 'Sinh học', 'Ngữ văn']

  return (
    <div className={styles.container}>
      {/* Top Banner & Notifications */}
      {pageError && (
        <div className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-sm text-on-error-container flex items-center gap-2">
          <span className="material-symbols-outlined text-error">error</span>
          <span>{pageError}</span>
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <span>{notice}</span>
        </div>
      )}

      {/* Hero Profile Card */}
      <section className={styles.heroCard}>
        <div className={styles.heroBgGradient} />
        <div className={styles.heroContent}>
          <div className={styles.heroProfileInfo}>
            {/* Avatar with Camera upload button */}
            <div className={styles.avatarWrapper}>
              <img
                src={avatar}
                alt={`Ảnh đại diện của ${profile.fullName}`}
                className={styles.avatarImage}
              />
              <button
                type="button"
                aria-label="Đổi ảnh đại diện"
                title="Đổi ảnh đại diện"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={styles.avatarUploadBtn}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {uploading ? 'progress_activity' : 'photo_camera'}
                </span>
              </button>
              <input
                ref={fileRef}
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatar}
              />
            </div>

            {/* Profile Info Details */}
            <div className="min-w-0">
              <div className={styles.nameRow}>
                <h1 className={styles.studentName}>{profile.fullName || 'Học sinh'}</h1>
                <span className={styles.roleBadge}>
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  Học sinh
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold border border-amber-500/20">
                  <span className="material-symbols-outlined text-[14px]">military_tech</span>
                  Cấp độ {profile.currentLevel}
                </span>
              </div>

              <p className="mt-1.5 text-sm text-on-surface-variant">
                {profile.schoolName || 'Trường THPT Chuyên'} {profile.className ? `• Lớp ${profile.className}` : ''}
              </p>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined text-[15px] text-primary">badge</span>
                  <strong>Mã số:</strong> {profile.studentCode || 'N/A'}
                </span>
                <span className={styles.metaItem}>
                  <span className="material-symbols-outlined text-[15px] text-primary">mail</span>
                  <strong>Email:</strong> {profile.email}
                </span>
                {profile.phoneNumber && (
                  <span className={styles.metaItem}>
                    <span className="material-symbols-outlined text-[15px] text-primary">call</span>
                    <strong>SĐT:</strong> {profile.phoneNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className={styles.heroActions}>
            {!isEditing ? (
              <button className={styles.btnPrimary} onClick={beginEditing}>
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            ) : (
              <button className={styles.btnSecondary} onClick={cancelEditing}>
                <span className="material-symbols-outlined text-[18px]">close</span>
                <span>Hủy chỉnh sửa</span>
              </button>
            )}
            <Link to="/student/dashboard" className={styles.btnSecondary}>
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>Tổng quan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bento Metric KPI Grid */}
      <section className={styles.metricsGrid}>
        {/* Metric 1: Total XP */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>TỔNG ĐIỂM XP</span>
            <div className={`${styles.metricIconWrapper} bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400`}>
              <span className="material-symbols-outlined text-[22px]">bolt</span>
            </div>
          </div>
          <div>
            <p className={styles.metricValue}>{profile.totalXp.toLocaleString('vi-VN')} XP</p>
            <div className={`${styles.metricFooter} text-blue-600 dark:text-blue-400`}>
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>Tích lũy từ bài tập & câu hỏi</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Level */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>CẤP ĐỘ HIỆN TẠI</span>
            <div className={`${styles.metricIconWrapper} bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400`}>
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
          </div>
          <div>
            <p className={styles.metricValue}>Level {profile.currentLevel}</p>
            <div className={`${styles.metricFooter} text-emerald-600 dark:text-emerald-400`}>
              <span className="material-symbols-outlined text-[14px]">military_tech</span>
              <span>Đẳng cấp học tập tích cực</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Streak */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>CHUỖI HỌC LIÊN TỤC</span>
            <div className={`${styles.metricIconWrapper} bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400`}>
              <span className="material-symbols-outlined text-[22px]">local_fire_department</span>
            </div>
          </div>
          <div>
            <p className={styles.metricValue}>{profile.currentStreak} ngày</p>
            <div className={`${styles.metricFooter} text-amber-600 dark:text-amber-400`}>
              <span className="material-symbols-outlined text-[14px]">electric_bolt</span>
              <span>Duy trì thói quen hàng ngày 🔥</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Daily Goal */}
        <div className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricLabel}>MỤC TIÊU HỌC TẬP</span>
            <div className={`${styles.metricIconWrapper} bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400`}>
              <span className="material-symbols-outlined text-[22px]">alarm</span>
            </div>
          </div>
          <div>
            <p className={styles.metricValue}>{preferences.dailyGoalMinutes} phút</p>
            <div className={`${styles.metricFooter} text-purple-600 dark:text-purple-400`}>
              <span className="material-symbols-outlined text-[14px]">hourglass_bottom</span>
              <span>Mục tiêu tự học mỗi ngày</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Left Column (Chart & Preferences) vs Right Column (Info / Edit Form) */}
      <div className={styles.mainGrid}>
        {/* Left Column: Chart & Study Preferences */}
        <div className={styles.leftCol}>
          {/* Study Analytics Chart */}
          <StudentStudyAnalyticsChart
            dailyGoalMinutes={preferences.dailyGoalMinutes}
            totalXp={profile.totalXp}
            currentStreak={profile.currentStreak}
          />

          {/* Study Preferences Display Card */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
                  <span>Định hướng & Tùy chọn học tập cùng AI</span>
                </h3>
                <p className={styles.cardSubtitle}>AI Tutor sẽ cá nhân hóa gợi ý dựa trên cài đặt của bạn</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                AI Powered
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Môn học quan tâm nhất
                </p>
                <div className="flex flex-wrap gap-2">
                  {preferences.favoriteSubjects.length > 0 ? (
                    preferences.favoriteSubjects.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold border border-outline-variant/60 shadow-xs"
                      >
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-on-surface-variant">Chưa thiết lập môn học</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-blue-500/5 to-transparent border border-primary/15 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Cố vấn học tập AI cá nhân</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Hệ thống sẽ nhắc nhở và tối ưu đề thi cho bạn mỗi ngày.
                  </p>
                </div>
                <Link to="/student/chat" className={styles.btnPrimary}>
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Hỏi AI</span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Personal Information / Edit Form & Security */}
        <div className={styles.rightCol}>
          {isEditing ? (
            /* Edit Profile Form */
            <form onSubmit={saveProfile} className={styles.formCard}>
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-outline-variant/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_square</span>
                    Chỉnh sửa thông tin
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Cập nhật thông tin học tập và tùy chọn cá nhân
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    Họ và tên
                  </label>
                  <input
                    className={styles.inputClass}
                    value={draft.fullName || ''}
                    onChange={(event) => setDraft({ ...draft, fullName: event.target.value })}
                    required
                    maxLength={255}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                      Ngày sinh
                    </label>
                    <input
                      className={styles.inputClass}
                      type="date"
                      value={draft.dateOfBirth || ''}
                      onChange={(event) =>
                        setDraft({ ...draft, dateOfBirth: event.target.value || null })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                      Giới tính
                    </label>
                    <select
                      className={styles.inputClass}
                      value={draft.gender || 'OTHER'}
                      onChange={(event) =>
                        setDraft({ ...draft, gender: event.target.value as Gender })
                      }
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                      Khối lớp
                    </label>
                    <input
                      className={styles.inputClass}
                      value={draft.gradeLevel || ''}
                      onChange={(event) => setDraft({ ...draft, gradeLevel: event.target.value })}
                      maxLength={32}
                      placeholder="Lớp 10 / 11 / 12"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                      Tên lớp
                    </label>
                    <input
                      className={styles.inputClass}
                      value={draft.className || ''}
                      onChange={(event) => setDraft({ ...draft, className: event.target.value })}
                      maxLength={64}
                      placeholder="10A1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    className={styles.inputClass}
                    value={draft.phoneNumber || ''}
                    onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })}
                    placeholder="0912345678"
                  />
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low/80 border border-outline-variant/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Mục tiêu học (phút/ngày)
                    </span>
                    <input
                      type="number"
                      min="15"
                      max="240"
                      step="5"
                      className="w-24 rounded-lg border border-outline-variant bg-surface px-2.5 py-1.5 text-center text-sm font-bold text-primary"
                      value={draftPreferences.dailyGoalMinutes}
                      onChange={(e) =>
                        setPreference('dailyGoalMinutes', Number(e.target.value) || 45)
                      }
                    />
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                      Chọn các môn học yêu thích
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subjectsList.map((subj) => {
                        const isSelected = draftPreferences.favoriteSubjects.includes(subj)
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? draftPreferences.favoriteSubjects.filter((s) => s !== subj)
                                : [...draftPreferences.favoriteSubjects, subj]
                              setPreference('favoriteSubjects', next)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
                            }`}
                          >
                            {subj}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button type="button" className={styles.btnSecondary} onClick={cancelEditing}>
                    Hủy
                  </button>
                  <button type="submit" className={styles.btnPrimary} disabled={saving}>
                    {saving && (
                      <span className="material-symbols-outlined animate-spin text-[18px]">
                        progress_activity
                      </span>
                    )}
                    <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* View Personal Information Card */
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                    <span>Thông tin cá nhân</span>
                  </h3>
                  <p className={styles.cardSubtitle}>Hồ sơ định danh của học sinh trong hệ thống</p>
                </div>
                <button
                  type="button"
                  onClick={beginEditing}
                  className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-all cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Họ và tên</span>
                  <span className={styles.infoValue}>{profile.fullName || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Mã học sinh</span>
                  <span className={styles.infoValue}>{profile.studentCode || 'Chưa có'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Ngày sinh</span>
                  <span className={styles.infoValue}>{profile.dateOfBirth || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Giới tính</span>
                  <span className={styles.infoValue}>
                    {profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                  </span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Khối lớp</span>
                  <span className={styles.infoValue}>{profile.gradeLevel || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Lớp học</span>
                  <span className={styles.infoValue}>{profile.className || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Trường học</span>
                  <span className={styles.infoValue}>{profile.schoolName || 'Chưa cập nhật'}</span>
                </div>
                <div className={styles.infoBox}>
                  <span className={styles.infoLabel}>Số điện thoại</span>
                  <span className={styles.infoValue}>{profile.phoneNumber || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/50 p-3 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">lock</span>
                <span>
                  Email tài khoản: <strong className="text-on-surface">{profile.email}</strong>
                </span>
              </div>
            </section>
          )}

          {/* Account Security Section */}
          <section className={styles.securitySection}>
            <button
              type="button"
              className="flex w-full items-center justify-between text-left cursor-pointer"
              onClick={() => setIsSecurityOpen((open) => !open)}
              aria-expanded={isSecurityOpen}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-[22px]">shield_person</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-sm sm:text-base">Bảo mật & Đổi mật khẩu</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Quản lý mật khẩu đăng nhập an toàn
                  </p>
                </div>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-container-low text-on-surface-variant transition-transform">
                <span className="material-symbols-outlined text-[20px]">
                  {isSecurityOpen ? 'expand_less' : 'expand_more'}
                </span>
              </span>
            </button>

            {isSecurityOpen && (
              <form onSubmit={submitPassword} noValidate className="mt-5 border-t border-outline-variant/40 pt-5 space-y-4">
                {/* Old password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      className={`${styles.inputClass} pr-10 ${
                        passwordFieldErrors.oldPassword ? 'border-error ring-1 ring-error' : ''
                      }`}
                      type={visiblePasswords.old ? 'text' : 'password'}
                      value={password.oldPassword}
                      onChange={(e) => updatePasswordField('oldPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVisiblePasswords({ ...visiblePasswords, old: !visiblePasswords.old })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {visiblePasswords.old ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {passwordFieldErrors.oldPassword && (
                    <span className="mt-1 block text-xs text-error font-medium">
                      {passwordFieldErrors.oldPassword}
                    </span>
                  )}
                </div>

                {/* New password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      className={`${styles.inputClass} pr-10 ${
                        passwordFieldErrors.newPassword ? 'border-error ring-1 ring-error' : ''
                      }`}
                      type={visiblePasswords.next ? 'text' : 'password'}
                      value={password.newPassword}
                      onChange={(e) => updatePasswordField('newPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVisiblePasswords({ ...visiblePasswords, next: !visiblePasswords.next })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {visiblePasswords.next ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {passwordFieldErrors.newPassword && (
                    <span className="mt-1 block text-xs text-error font-medium">
                      {passwordFieldErrors.newPassword}
                    </span>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      className={`${styles.inputClass} pr-10 ${
                        passwordFieldErrors.confirmPassword ? 'border-error ring-1 ring-error' : ''
                      }`}
                      type={visiblePasswords.confirm ? 'text' : 'password'}
                      value={password.confirmPassword}
                      onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVisiblePasswords({ ...visiblePasswords, confirm: !visiblePasswords.confirm })
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {visiblePasswords.confirm ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {passwordFieldErrors.confirmPassword && (
                    <span className="mt-1 block text-xs text-error font-medium">
                      {passwordFieldErrors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Password strength checklist */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span>Độ mạnh mật khẩu</span>
                    <span
                      className={
                        password.newPassword.length === 0
                          ? 'text-on-surface-variant'
                          : passwordIsStrong
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }
                    >
                      {password.newPassword.length === 0
                        ? 'Chưa nhập'
                        : passwordIsStrong
                        ? 'Đạt chuẩn'
                        : 'Chưa đủ'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-on-surface-variant">
                    <span className={`flex items-center gap-1 ${passwordChecks.minLength ? 'text-emerald-600 font-semibold' : ''}`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {passwordChecks.minLength ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Từ 8 ký tự trở lên
                    </span>
                    <span className={`flex items-center gap-1 ${passwordChecks.uppercase ? 'text-emerald-600 font-semibold' : ''}`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {passwordChecks.uppercase ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Chứa chữ hoa
                    </span>
                    <span className={`flex items-center gap-1 ${passwordChecks.number ? 'text-emerald-600 font-semibold' : ''}`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {passwordChecks.number ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Chứa chữ số
                    </span>
                    <span className={`flex items-center gap-1 ${passwordChecks.special ? 'text-emerald-600 font-semibold' : ''}`}>
                      <span className="material-symbols-outlined text-[13px]">
                        {passwordChecks.special ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      Chứa ký tự đặc biệt
                    </span>
                  </div>
                  {password.confirmPassword.length > 0 && (
                    <p
                      className={`text-[11px] font-medium pt-1 ${
                        passwordsMatch ? 'text-emerald-600' : 'text-error'
                      }`}
                    >
                      {passwordsMatch ? '✓ Mật khẩu xác nhận trùng khớp' : '✗ Mật khẩu xác nhận chưa khớp'}
                    </p>
                  )}
                </div>

                {passwordError && (
                  <p className="text-xs text-error font-medium">{passwordError}</p>
                )}
                {passwordNotice && (
                  <p className="text-xs text-emerald-600 font-medium">{passwordNotice}</p>
                )}

                <div className="flex justify-end pt-2">
                  <button type="submit" className={styles.btnPrimary} disabled={passwordSaving}>
                    {passwordSaving ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                    )}
                    <span>{passwordSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

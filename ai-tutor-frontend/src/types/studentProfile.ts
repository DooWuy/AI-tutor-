export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface StudentProfile {
  userId: string
  studentId: string
  studentCode: string
  username: string
  email: string
  fullName: string
  dateOfBirth: string | null
  gender: Gender | null
  phoneNumber: string | null
  avatarUrl: string | null
  gradeLevel: string | null
  className: string | null
  schoolName: string | null
  studyPreferences: Record<string, unknown>
  totalXp: number
  currentLevel: number
  currentStreak: number
}

export interface StudentProfileUpdate {
  fullName?: string
  dateOfBirth?: string | null
  gender?: Gender | null
  phoneNumber?: string | null
  gradeLevel?: string
  className?: string | null
  studyPreferences?: Record<string, unknown>
}

import type { ApiResponse } from '../types/auth'
import type { StudentProfile, StudentProfileUpdate } from '../types/studentProfile'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '')

async function parseResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null
  return response.json() as Promise<ApiResponse<T>>
}

function getErrorMessage(payload: ApiResponse<unknown> | null, status: number) {
  if (payload?.error && typeof payload.error === 'object') {
    const first = Object.values(payload.error)[0]
    if (first) return first
  }
  if (payload?.message) return payload.message
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  return 'Không thể hoàn thành thao tác. Vui lòng thử lại.'
}

async function request<T>(url: string, init: RequestInit) {
  let response: Response
  try { response = await fetch(`${API_BASE_URL}${url}`, { ...init, credentials: 'include' }) }
  catch { throw new Error('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy.') }
  const payload = await parseResponse<T>(response)
  if (!response.ok || !payload?.success) throw new Error(getErrorMessage(payload, response.status))
  return payload.data
}

export function getMyStudentProfile() { return request<StudentProfile>('/students/me', { method: 'GET' }) }

export function updateMyStudentProfile(update: StudentProfileUpdate) {
  return request<StudentProfile>('/students/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) })
}

export function uploadMyAvatar(file: File) {
  const body = new FormData(); body.append('file', file)
  return request<StudentProfile>('/students/me/avatar', { method: 'POST', body })
}

export function changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
  return request<null>('/users/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword, confirmPassword }) })
}

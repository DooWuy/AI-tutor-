import type { ApiResponse, AuthSession, LoginCredentials } from '../types/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '')

function resolveErrorMessage(payload: Partial<ApiResponse<unknown>> | null, status: number) {
  if (payload?.message) return payload.message
  if (payload?.error && typeof payload.error === 'object') {
    const firstError = Object.values(payload.error)[0]
    if (firstError) return firstError
  }
  if (status === 401) return 'Email hoặc mật khẩu không chính xác.'
  if (status === 403) return 'Tài khoản không có quyền đăng nhập.'
  return 'Đăng nhập không thành công. Vui lòng thử lại.'
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null
  return response.json() as Promise<ApiResponse<T>>
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy ở cổng 8088.')
  }
  const payload = await parseJson<AuthSession>(response)
  if (!response.ok || !payload?.success || !payload.data?.accessToken) throw new Error(resolveErrorMessage(payload, response.status))
  return payload.data
}

export async function logout(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) throw new Error(resolveErrorMessage(await parseJson<unknown>(response), response.status))
}

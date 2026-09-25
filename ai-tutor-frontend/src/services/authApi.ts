import type { ApiResponse, AuthSession, LoginCredentials } from '../types/auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '')

const USER_KEY = 'ai-tutor.user'

export function getStoredSession(): AuthSession | null {
  for (const storage of [localStorage, sessionStorage]) {
    const rawUser = storage.getItem(USER_KEY)
    if (!rawUser) continue
    try { return { accessToken: '', user: JSON.parse(rawUser) as import('../types/auth').User } }
    catch { storage.removeItem(USER_KEY) }
  }
  return null
}

export function clearSession() {
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem(USER_KEY)
  }
}

export function persistSession(session: AuthSession, remember: boolean) {
  clearSession()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(USER_KEY, JSON.stringify(session.user))
}

function resolveErrorMessage(payload: Partial<ApiResponse<unknown>> | null, status: number) {
  if (payload?.error && typeof payload.error === 'object') {
    const firstError = Object.values(payload.error)[0]
    if (firstError) return firstError
  }
  if (payload?.message) return payload.message
  if (status === 401) return 'Email hoặc mật khẩu không chính xác.'
  if (status === 403) return 'Tài khoản không có quyền đăng nhập.'
  return 'Thao tác không thành công. Vui lòng thử lại.'
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

export async function logout(): Promise<void> {
  const session = getStoredSession()
  if (session) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {}
  }
  clearSession()
}

export async function register(data: import('../types/auth').RegisterData): Promise<AuthSession> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  } catch {
    throw new Error('Không thể kết nối tới máy chủ. Hãy kiểm tra kết nối mạng.')
  }
  const payload = await parseJson<AuthSession>(response)
  if (!response.ok || !payload?.success || !payload.data?.accessToken) throw new Error(resolveErrorMessage(payload, response.status))
  return payload.data
}

export interface LoginCredentials { email: string; password: string }
export interface User {
  userId: string; username: string; fullName: string; phoneNumber?: string | null; email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | string; gender?: 'MALE' | 'FEMALE' | 'OTHER' | string | null;
  dateOfBirth?: string | null; avatarUrl?: string | null; active: boolean; createdAt?: string; updatedAt?: string; isDeleted?: boolean;
}
export interface AuthSession { accessToken: string; user: User }
export interface ApiResponse<T> { data: T; success: boolean; message: string; error?: Record<string, string> | string | null; timestamp: string }

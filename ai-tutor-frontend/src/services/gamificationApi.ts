import type { ApiResponse } from "../types/auth";
import type {
  Leaderboard,
  LeaderboardScope,
  StudentProgress,
} from "../types/gamification";
const BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8088/api/v1"
).replace(/\/$/, "");
export class GamificationApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: "include",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    cache: "no-store",
  });
  const body: ApiResponse<T> | null = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok || !body?.success) {
    const code =
      body?.error && typeof body.error === "object"
        ? body.error.code
        : undefined;
    throw new GamificationApiError(
      response.status === 401
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        : body?.message || "Không thể tải dữ liệu. Vui lòng thử lại.",
      response.status,
      code,
    );
  }
  return body.data;
}
export const gamificationApi = {
  progress: (signal?: AbortSignal) =>
    get<StudentProgress>("/students/me/progress", signal),
  leaderboard: (scope: LeaderboardScope, signal?: AbortSignal) =>
    get<Leaderboard>(`/leaderboard?scope=${scope}&limit=20`, signal),
};

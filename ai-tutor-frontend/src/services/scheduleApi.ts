import type { ApiResponse } from '../types/auth';
import type { ScheduleCreateRequest, ScheduleResponse, OcrExtractionResponse } from '../types/schedule';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '')

async function parseJson<T>(response: Response): Promise<ApiResponse<T> | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null
  return response.json() as Promise<ApiResponse<T>>
}

function resolveErrorMessage(payload: any, status: number) {
  if (payload?.error && typeof payload.error === 'object') {
    const firstError = Object.values(payload.error)[0]
    if (firstError) return firstError
  }
  if (payload?.errorDescription && typeof payload.errorDescription === 'string') return payload.errorDescription
  if (payload?.message && typeof payload.message === 'string') return payload.message
  if (payload?.error && typeof payload.error === 'string') return payload.error
  return `Thao tác không thành công (HTTP ${status}). Vui lòng thử lại.`
}



export async function extractScheduleFromImage(file: File): Promise<OcrExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/schedules/extract-ocr`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const payload = await parseJson<OcrExtractionResponse>(response);
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(resolveErrorMessage(payload, response.status));
  }
  return payload.data;
}

export async function createSchedule(request: ScheduleCreateRequest): Promise<ScheduleResponse> {
  const response = await fetch(`${API_BASE_URL}/schedules`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request),
  });

  const payload = await parseJson<ScheduleResponse>(response);
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(resolveErrorMessage(payload, response.status));
  }
  return payload.data;
}

export async function getActiveSchedule(): Promise<ScheduleResponse> {
  const response = await fetch(`${API_BASE_URL}/schedules/active`, {
    method: 'GET',
    credentials: 'include'
  });

  const payload = await parseJson<ScheduleResponse>(response);
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(resolveErrorMessage(payload, response.status));
  }
  return payload.data;
}

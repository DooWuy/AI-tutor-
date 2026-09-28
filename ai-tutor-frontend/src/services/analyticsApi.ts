import type { ApiResponse } from '../types/auth';
import type {
  AnalyticsFiltersResponse,
  DashboardSummaryResponse,
  KnowledgeGapsResponse,
  AtRiskListResponse,
  ParentMessageDraftResponse,
  ParentMessageSendResponse,
  ParentMessageSendRequest,
  AlertSettingsView,
  AlertSettingsRequest,
  AlertSettingsUpdateResponse,
  ReportPeriod,
} from '../pages/Teacher/Analytics/types/analytics';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Định dạng phản hồi không hợp lệ từ máy chủ.');
  }
  return res.json();
}

async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('Không thể kết nối tới máy chủ. Vui lòng kiểm tra dịch vụ backend đang chạy.');
  }

  if (response.status === 401) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (response.status === 403) {
    throw new Error('Thao tác bị từ chối: Bạn không có quyền hoặc dữ liệu lịch sử này có tính bất biến không được phép chỉnh sửa/xóa.');
  }

  const payload = await parseResponse<T>(response);
  if (!response.ok || !payload.success) {
    const errorMsg =
      typeof payload.error === 'object' && payload.error
        ? Object.values(payload.error)[0]
        : payload.message || 'Thao tác không thành công.';
    throw new Error(errorMsg);
  }

  return payload.data;
}

export const analyticsApi = {
  getFilters: () => request<AnalyticsFiltersResponse>('/analytics/filters'),

  getSummary: (
    classId: string,
    subject = 'ALL',
    period: ReportPeriod = 'LAST_7_DAYS',
    from?: string,
    to?: string
  ) => {
    const params = new URLSearchParams({ classId, subject, period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return request<DashboardSummaryResponse>(`/analytics/summary?${params.toString()}`);
  },

  getKnowledgeGaps: (
    classId: string,
    subject = 'ALL',
    period: ReportPeriod = 'LAST_7_DAYS',
    from?: string,
    to?: string
  ) => {
    const params = new URLSearchParams({ classId, subject, period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return request<KnowledgeGapsResponse>(`/analytics/knowledge-gaps?${params.toString()}`);
  },

  getAtRiskStudents: (
    classId: string,
    subject = 'ALL',
    period: ReportPeriod = 'LAST_7_DAYS',
    from?: string,
    to?: string
  ) => {
    const params = new URLSearchParams({ classId, subject, period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return request<AtRiskListResponse>(`/analytics/at-risk?${params.toString()}`);
  },

  draftParentMessage: (
    studentId: string,
    classId: string,
    subject = 'ALL',
    period: ReportPeriod = 'LAST_7_DAYS',
    from?: string,
    to?: string
  ) => {
    const params = new URLSearchParams({ classId, subject, period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return request<ParentMessageDraftResponse>(
      `/analytics/students/${studentId}/parent-message-draft?${params.toString()}`
    );
  },

  sendParentMessage: (studentId: string, body: ParentMessageSendRequest) =>
    request<ParentMessageSendResponse>(`/analytics/students/${studentId}/parent-messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getAlertSettings: (classId: string) =>
    request<AlertSettingsView>(`/analytics/classes/${classId}/alert-settings`),

  updateAlertSettings: (classId: string, body: AlertSettingsRequest) =>
    request<AlertSettingsUpdateResponse>(`/analytics/classes/${classId}/alert-settings`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  downloadPdfReport: async (
    classId: string,
    subject = 'ALL',
    period: ReportPeriod = 'LAST_7_DAYS',
    from?: string,
    to?: string,
    className?: string
  ) => {
    const params = new URLSearchParams({ classId, subject, period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const res = await fetch(`${API_BASE_URL}/analytics/report.pdf?${params.toString()}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Bạn không có quyền tải báo cáo của lớp học này.');
      }
      throw new Error('Không thể tải tệp PDF báo cáo. Vui lòng thử lại sau.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (className || classId).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Bao_cao_hoc_tap_${safeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadExcelReport: async (
    classId: string,
    subject = 'ALL',
    period: ReportPeriod = 'LAST_7_DAYS',
    from?: string,
    to?: string,
    className?: string
  ) => {
    const params = new URLSearchParams({ classId, subject, period });
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const res = await fetch(`${API_BASE_URL}/analytics/export.xlsx?${params.toString()}`, {
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Bạn không có quyền xuất dữ liệu Excel của lớp học này.');
      }
      throw new Error('Không thể tải tệp Excel dữ liệu. Vui lòng thử lại sau.');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (className || classId).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Bang_diem_lop_${safeName}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

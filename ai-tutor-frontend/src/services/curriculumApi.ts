import type { ApiResponse } from '../types/auth';
import {
  normalizeSubjectForBackend,
  normalizeGradeForBackend,
  type BookItem,
  type BookUpsertPayload,
  type TocAnalysisResult,
  type ExtractStructurePayload,
} from '../pages/Teacher/TeachingMaterials/types/curriculum';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (res.status === 413) {
    throw new Error('Dung lượng tệp tải lên vượt quá giới hạn cho phép của máy chủ (tối đa 100 MB / file sách).');
  }
  if (res.status === 502 || res.status === 504) {
    throw new Error('Máy chủ phản hồi chậm hoặc đang bận xử lý (Gateway Timeout). Vui lòng thử lại sau.');
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Lỗi phản hồi từ máy chủ (HTTP ${res.status} ${res.statusText})`);
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
    throw new Error('Bạn không có quyền thực hiện thao tác này (yêu cầu quyền Giáo viên hoặc Quản trị viên).');
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

export const curriculumApi = {
  /**
   * Lấy danh sách tất cả các sách giáo khoa
   */
  async listBooks(subject?: string, gradeLevel?: string): Promise<BookItem[]> {
    const params = new URLSearchParams();
    if (subject && subject !== 'ALL') params.append('subject', normalizeSubjectForBackend(subject));
    if (gradeLevel && gradeLevel !== 'ALL') params.append('gradeLevel', normalizeGradeForBackend(gradeLevel));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<BookItem[]>(`/curriculum/books${queryString}`, { method: 'GET' });
  },

  /**
   * Lấy chi tiết một cuốn sách kèm cấu trúc chương & bài học
   */
  async getBook(bookId: string): Promise<BookItem> {
    return request<BookItem>(`/curriculum/books/${encodeURIComponent(bookId)}`, { method: 'GET' });
  },

  /**
   * Tạo bản ghi Sách giáo khoa mới
   */
  async createBook(payload: BookUpsertPayload): Promise<BookItem> {
    const normalizedPayload: BookUpsertPayload = {
      ...payload,
      subject: normalizeSubjectForBackend(payload.subject),
      gradeLevel: normalizeGradeForBackend(payload.gradeLevel),
    };
    return request<BookItem>('/curriculum/books', {
      method: 'POST',
      body: JSON.stringify(normalizedPayload),
    });
  },

  /**
   * Cập nhật thông tin Sách giáo khoa
   */
  async updateBook(bookId: string, payload: BookUpsertPayload): Promise<BookItem> {
    const normalizedPayload: BookUpsertPayload = {
      ...payload,
      subject: normalizeSubjectForBackend(payload.subject),
      gradeLevel: normalizeGradeForBackend(payload.gradeLevel),
    };
    return request<BookItem>(`/curriculum/books/${encodeURIComponent(bookId)}`, {
      method: 'PUT',
      body: JSON.stringify(normalizedPayload),
    });
  },

  /**
   * Xóa Sách giáo khoa
   */
  async deleteBook(bookId: string): Promise<void> {
    return request<void>(`/curriculum/books/${encodeURIComponent(bookId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Phân tích mục lục sách bằng AI Gemini hoặc OCR (Issue 7)
   */
  async analyzeToc(
    bookId: string,
    pdfFile: File,
    tocImages: File[],
    method: 'AI' | 'OCR' = 'AI',
    curriculumName?: string
  ): Promise<TocAnalysisResult> {
    const formData = new FormData();
    formData.append('file', pdfFile);
    tocImages.forEach((img) => {
      formData.append('tocImages', img);
    });
    formData.append('method', method);
    if (curriculumName) {
      formData.append('curriculumName', curriculumName);
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/curriculum/books/${encodeURIComponent(bookId)}/analyze-toc`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
    } catch {
      throw new Error('Không thể kết nối tới máy chủ khi gửi yêu cầu phân tích mục lục.');
    }

    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (response.status === 403) {
      throw new Error('Bạn không có quyền thực hiện phân tích mục lục sách.');
    }

    const payload = await parseResponse<TocAnalysisResult>(response);
    if (!response.ok || !payload.success) {
      const errorMsg =
        typeof payload.error === 'object' && payload.error
          ? Object.values(payload.error)[0]
          : payload.message || 'Không thể phân tích mục lục sách.';
      throw new Error(errorMsg);
    }

    return payload.data;
  },

  /**
   * Xác nhận cấu trúc và khởi chạy tiến trình cắt sách & nạp tri thức vector hóa (Issue 7)
   */
  async extractAndIngest(
    bookId: string,
    pdfFile: File,
    structure: ExtractStructurePayload
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('structure', new Blob([JSON.stringify(structure)], { type: 'application/json' }));

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/curriculum/books/${encodeURIComponent(bookId)}/extract-and-ingest`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
    } catch {
      throw new Error('Không thể gửi yêu cầu cắt sách tới máy chủ.');
    }

    if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (response.status === 403) {
      throw new Error('Bạn không có quyền kích hoạt luồng nạp tri thức giáo trình.');
    }

    const payload = await parseResponse<void>(response);
    if (!response.ok || !payload.success) {
      const errorMsg =
        typeof payload.error === 'object' && payload.error
          ? Object.values(payload.error)[0]
          : payload.message || 'Không thể kích hoạt tiến trình cắt sách.';
      throw new Error(errorMsg);
    }
  },
};

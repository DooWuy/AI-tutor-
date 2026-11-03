import { useEffect, useRef, useState, useMemo } from 'react';
import {
  BookOpen,
  UploadCloud,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { getStoredSession } from '../../services/authApi';
import { DocumentStatsSection } from './Documents/components/DocumentStatsSection';
import { UploadDocumentModal } from './Documents/components/UploadDocumentModal';
import { EditDocumentModal } from './Documents/components/EditDocumentModal';
import { DeleteDocumentDialog } from './Documents/components/DeleteDocumentDialog';
import { DocumentTextbooksTab } from './Documents/components/DocumentTextbooksTab';
import { DocumentRagGuideTab } from './Documents/components/DocumentRagGuideTab';
import './Documents/DocumentsPage.css';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');

export interface Doc {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  creatorName: string;
  subject: string;
  gradeLevel: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | string;
  errorMessage?: string;
  createdAt: string;
  progressPercentage?: number;
  documentType?: string;
}

async function request(path: string, init: RequestInit = {}) {
  const token = getStoredSession()?.accessToken;
  const res = await fetch(base + path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể thực hiện thao tác');
  return data;
}

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDocDate(isoDate: string) {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    return isNaN(d.getTime()) ? isoDate : d.toLocaleString('vi-VN');
  } catch {
    return isoDate;
  }
}

const subjectDisplayNames: Record<string, string> = {
  TOAN: 'Toán học',
  VAN: 'Ngữ văn',
  NGU_VAN: 'Ngữ văn',
  ANH: 'Tiếng Anh',
  TIENG_ANH: 'Tiếng Anh',
  LY: 'Vật lý',
  VAT_LY: 'Vật lý',
  HOA: 'Hóa học',
  HOA_HOC: 'Hóa học',
  SINH: 'Sinh học',
  SINH_HOC: 'Sinh học',
  SU: 'Lịch sử',
  LICH_SU: 'Lịch sử',
  DIA: 'Địa lý',
  DIA_LY: 'Địa lý',
  TIN: 'Tin học',
  TIN_HOC: 'Tin học',
  GDCD: 'GDCD',
  KHTN: 'Khoa học tự nhiên',
};

export function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'TEXTBOOKS' | 'GUIDE'>('DOCUMENTS');
  const [rows, setRows] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  // Filters
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Async states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Doc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [actionError, setActionError] = useState('');

  const busy = useRef(false);

  // Fetch paginated documents
  useEffect(() => {
    const abort = new AbortController();
    let timer: number;
    setLoading(true);
    setError('');

    request(
      `/documents/page?page=${page}&size=20&search=${encodeURIComponent(
        search
      )}&subject=${encodeURIComponent(subject)}&gradeLevel=${encodeURIComponent(
        grade
      )}&status=${status}`,
      { signal: abort.signal }
    )
      .then((data) => {
        if (!abort.signal.aborted) {
          setRows(data.content || []);
          setTotal(data.totalElements || 0);
          setPages(data.totalPages || 0);

          // Polling every 10s if any document is PROCESSING
          if (data.content?.some((d: Doc) => d.status === 'PROCESSING')) {
            timer = window.setTimeout(() => setRevision((v) => v + 1), 10000);
          }
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });

    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, [page, search, status, subject, grade, revision]);

  // Derived counts for KPI
  const stats = useMemo(() => {
    let success = 0;
    let processing = 0;
    let failed = 0;

    rows.forEach((r) => {
      if (r.status === 'SUCCESS') success++;
      else if (r.status === 'PROCESSING') processing++;
      else if (r.status === 'FAILED') failed++;
    });

    return {
      success: status === 'SUCCESS' ? total : success,
      processing: status === 'PROCESSING' ? total : processing,
      failed: status === 'FAILED' ? total : failed,
    };
  }, [rows, total, status]);

  // Upload handler
  const handleUpload = async (formData: FormData) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setActionError('');
    try {
      const result = await request('/admin/documents/ingest/pdf', {
        method: 'POST',
        body: formData,
      });
      setNotice(`Đã tải tài liệu ${result.data}. Đang chờ xử lý.`);
      setIsUploadOpen(false);
      setPage(1);
      setRevision((v) => v + 1);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  // Edit metadata handler
  const handleEditSave = async (payload: { title: string; subject: string; gradeLevel: string }) => {
    if (!editTarget || busy.current) return;
    busy.current = true;
    setSaving(true);
    setActionError('');
    try {
      await request(`/documents/${editTarget.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setEditTarget(null);
      setRevision((v) => v + 1);
      setNotice('Đã cập nhật tài liệu.');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || busy.current) return;
    busy.current = true;
    setSaving(true);
    setActionError('');
    try {
      await request(`/documents/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      setDeleteTarget(null);
      setRevision((v) => v + 1);
      setNotice('Đã xóa tài liệu và toàn bộ vector liên quan.');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSubject('');
    setGrade('');
    setStatus('');
    setPage(1);
  };

  const getFileBadge = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      return {
        label: 'PDF',
        class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      };
    }
    if (ext === 'docx' || ext === 'doc') {
      return {
        label: 'DOCX',
        class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      };
    }
    if (ext === 'txt' || ext === 'md') {
      return {
        label: ext.toUpperCase(),
        class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      };
    }
    return {
      label: ext.toUpperCase() || 'FILE',
      class: 'bg-surface-container text-on-surface-variant border-outline-variant',
    };
  };

  return (
    <section className="space-y-6 pb-12 text-on-surface" aria-labelledby="documents-heading">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
            <BookOpen size={15} />
            <span>QUẢN TRỊ NỘI DUNG & TRI THỨC</span>
          </div>
          <h1 id="documents-heading" className="text-2xl font-bold tracking-tight text-on-surface">
            Kho tài liệu & Sách giáo khoa
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Quản lý tài liệu của mọi người tạo. Chỉ tài liệu thành công được dùng cho truy xuất AI (RAG).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRevision((v) => v + 1)}
            className="min-h-11 inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-all active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => {
              setActionError('');
              setIsUploadOpen(true);
            }}
            className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary/90 transition-all shadow-sm active:scale-95"
          >
            <UploadCloud size={16} />
            Tải tài liệu mới
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-outline-variant/80 gap-6 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'DOCUMENTS'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Kho tài liệu & Vector RAG ({total})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TEXTBOOKS')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'TEXTBOOKS'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Sách giáo khoa & Chương trình
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('GUIDE')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'GUIDE'
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Hướng dẫn & Chuẩn RAG
        </button>
      </div>

      {/* Status Notice (Accessible role="status") */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 doc-slide-up"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 p-1"
            aria-label="Đóng thông báo"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Error Alert (Accessible role="alert") */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 doc-slide-up"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <p className="font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setRevision((v) => v + 1)}
            className="min-h-9 inline-flex items-center rounded-lg border border-rose-500/40 bg-surface-container-lowest px-3 py-1 font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* TAB 1: Documents & RAG */}
      {activeTab === 'DOCUMENTS' && (
        <div className="space-y-6">
          {/* KPI Statistics */}
          <DocumentStatsSection
            total={total}
            successCount={stats.success}
            processingCount={stats.processing}
            failedCount={stats.failed}
            activeStatus={status}
            onFilterStatus={(s) => {
              setPage(1);
              setStatus(s);
            }}
          />

          {/* Filter Bar */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  value={search}
                  placeholder="Tìm tên tài liệu, tệp, người tạo…"
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-full min-h-11 rounded-xl border border-outline-variant bg-surface pl-9 pr-3 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary placeholder:text-on-surface-variant/60"
                />
              </div>

              {/* Subject */}
              <div>
                <select
                  value={subject}
                  onChange={(e) => {
                    setPage(1);
                    setSubject(e.target.value);
                  }}
                  className="w-full min-h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="">Tất cả môn học</option>
                  <option value="TOAN">Toán học (TOAN)</option>
                  <option value="VAN">Ngữ văn (VAN)</option>
                  <option value="ANH">Tiếng Anh (ANH)</option>
                  <option value="LY">Vật lý (LY)</option>
                  <option value="HOA">Hóa học (HOA)</option>
                  <option value="SINH">Sinh học (SINH)</option>
                  <option value="SU">Lịch sử (SU)</option>
                  <option value="DIA">Địa lý (DIA)</option>
                  <option value="TIN">Tin học (TIN)</option>
                </select>
              </div>

              {/* Grade */}
              <div>
                <select
                  value={grade}
                  onChange={(e) => {
                    setPage(1);
                    setGrade(e.target.value);
                  }}
                  className="w-full min-h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="">Tất cả khối lớp</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
                    <option key={g} value={g}>
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={status}
                  onChange={(e) => {
                    setPage(1);
                    setStatus(e.target.value);
                  }}
                  className="w-full min-h-11 rounded-xl border border-outline-variant bg-surface px-3 py-2 text-xs text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công (Sẵn sàng RAG)</option>
                  <option value="PROCESSING">Đang xử lý (Processing)</option>
                  <option value="FAILED">Thất bại (Failed)</option>
                </select>
              </div>
            </div>

            {(search || subject || grade || status) && (
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60 text-xs">
                <span className="text-on-surface-variant">Đang áp dụng bộ lọc</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-primary hover:underline font-semibold"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Document Table / List */}
          <div
            aria-busy={loading}
            className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest"
          >
            {loading ? (
              <div className="p-8 text-center" role="status">
                <div className="mx-auto h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="mt-3 text-xs text-on-surface-variant font-medium">Đang tải danh sách tài liệu…</p>
              </div>
            ) : !error && rows.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-surface-container text-on-surface-variant/70 border border-outline-variant">
                  <FileText size={28} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-on-surface">Không có tài liệu phù hợp.</h3>
                <p className="mt-1 text-xs text-on-surface-variant max-w-md mx-auto">
                  {search || subject || grade || status
                    ? 'Không tìm thấy tài liệu nào khớp với bộ lọc hiện tại. Hãy thử xóa hoặc thay đổi bộ lọc.'
                    : 'Chưa có tài liệu nào trong kho lưu trữ. Nhấn "Tải tài liệu mới" để bắt đầu nạp học liệu.'}
                </p>
                {(search || subject || grade || status) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 min-h-9 rounded-lg border border-outline-variant bg-surface px-4 py-1.5 text-xs font-semibold text-primary hover:bg-surface-container"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {rows.map((d) => {
                  const badge = getFileBadge(d.fileName);
                  return (
                    <div
                      key={d.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-surface-container/30 transition-colors"
                    >
                      {/* Left info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border font-bold text-xs ${badge.class}`}
                        >
                          {badge.label}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-sm text-on-surface break-words">
                              {d.title}
                            </h2>
                            {d.status === 'SUCCESS' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 size={12} />
                                Sẵn sàng RAG
                              </span>
                            )}
                            {d.status === 'PROCESSING' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                Đang xử lý
                              </span>
                            )}
                            {d.status === 'FAILED' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <AlertTriangle size={12} />
                                Lỗi xử lý
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-on-surface-variant break-all">
                            {d.fileName} · {formatBytes(d.fileSize)}
                            {d.fileType ? ` · ${d.fileType}` : ''}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-on-surface-variant">
                            <span className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 font-semibold text-on-surface border border-outline-variant">
                              {subjectDisplayNames[d.subject] || d.subject}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 font-semibold text-on-surface border border-outline-variant">
                              Khối {d.gradeLevel}
                            </span>
                            {d.creatorName && (
                              <span className="inline-flex items-center gap-1">
                                <User size={12} />
                                {d.creatorName}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDocDate(d.createdAt)}
                            </span>
                          </div>

                          {d.errorMessage && d.status === 'FAILED' && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 pt-0.5">
                              Lý do: {d.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('');
                            setEditTarget(d);
                          }}
                          className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <Edit3 size={13} />
                          Sửa
                          <span className="sr-only"> {d.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('');
                            setDeleteTarget(d);
                          }}
                          className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 size={13} />
                          Xóa
                          <span className="sr-only"> {d.title}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/80 p-4 text-xs text-on-surface-variant">
              <span>
                {total} tài liệu · Trang {page}/{Math.max(1, pages)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((v) => Math.max(1, v - 1))}
                  className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-1 font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= pages || loading}
                  onClick={() => setPage((v) => v + 1)}
                  className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface px-3 py-1 font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                >
                  Sau
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Textbooks & Curriculum */}
      {activeTab === 'TEXTBOOKS' && <DocumentTextbooksTab />}

      {/* TAB 3: RAG Architecture & Guide */}
      {activeTab === 'GUIDE' && <DocumentRagGuideTab />}

      {/* Modals & Dialogs */}
      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
        isSaving={saving}
        error={actionError}
      />

      <EditDocumentModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        document={editTarget}
        onSave={handleEditSave}
        isSaving={saving}
        error={actionError}
      />

      <DeleteDocumentDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        document={deleteTarget}
        onConfirm={handleDeleteConfirm}
        isDeleting={saving}
        error={actionError}
      />
    </section>
  );
}

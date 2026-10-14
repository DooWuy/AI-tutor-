import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { systemLogsApi, SystemLogsApiError } from '../../../services/systemLogsApi';
import { useToast } from '../../../context/ToastContext';
import type { SystemLogItem, LogLevel } from '../../../types/systemLogs';
import { StackTraceModal } from './components/StackTraceModal';
import { PurgeLogsModal } from './components/PurgeLogsModal';

const LOG_LEVELS: { label: string; value: LogLevel | '' }[] = [
  { label: 'Tất cả mức độ', value: '' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARNING', value: 'WARNING' },
  { label: 'ERROR', value: 'ERROR' },
  { label: 'CRITICAL', value: 'CRITICAL' },
];

export const SystemLogsPage: React.FC = () => {
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  // Filter & Search states
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | ''>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination states
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Data states
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [selectedLogForTrace, setSelectedLogForTrace] = useState<SystemLogItem | null>(null);
  const [isStackTraceOpen, setIsStackTraceOpen] = useState<boolean>(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // 300ms Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  // Load logs
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Parse ISO dates if provided
      let formattedFrom: string | undefined;
      let formattedTo: string | undefined;

      if (fromDate) {
        formattedFrom = new Date(fromDate).toISOString();
      }
      if (toDate) {
        // Set end of day if only date is picked
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        formattedTo = d.toISOString();
      }

      const res = await systemLogsApi.fetchLogs({
        level: selectedLevel || undefined,
        keyword: debouncedKeyword.trim() || undefined,
        fromDate: formattedFrom,
        toDate: formattedTo,
        page,
        size,
        direction: 'desc',
      });

      startTransition(() => {
        setLogs(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      });
    } catch (err) {
      const msg = err instanceof SystemLogsApiError ? err.message : 'Không thể tải danh sách nhật ký hệ thống.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevel, debouncedKeyword, fromDate, toDate, page, size, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleResetFilters = () => {
    setSelectedLevel('');
    setSearchKeyword('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const handleOpenStackTrace = (log: SystemLogItem) => {
    setSelectedLogForTrace(log);
    setIsStackTraceOpen(true);
  };

  const handlePurgeLogs = async (daysOld: number) => {
    setIsPurging(true);
    try {
      const deletedCount = await systemLogsApi.purgeOldLogs(daysOld);
      toast.success(`Đã dọn dẹp thành công ${deletedCount} bản ghi nhật ký cũ!`);
      setIsPurgeModalOpen(false);
      setPage(0);
      await loadLogs();
    } catch (err) {
      const msg = err instanceof SystemLogsApiError ? err.message : 'Không thể dọn dẹp nhật ký.';
      toast.error(msg);
    } finally {
      setIsPurging(false);
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800">
            CRITICAL
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-error-container/40 text-error border-error/30 dark:bg-error-container/20">
            ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800">
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-primary-container/40 text-primary border-primary/20 dark:bg-primary-container/20">
            INFO
          </span>
        );
    }
  };

  const formatLogDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-on-surface dark:text-white">
            Nhật ký hệ thống
          </h1>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
            Theo dõi lỗi, cảnh báo và sự kiện vận hành thời gian thực của nền tảng AI Tutor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadLogs()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-outline-variant/60 bg-surface dark:bg-slate-800 hover:bg-surface-variant/40 text-sm font-semibold text-on-surface dark:text-white transition-colors shadow-sm disabled:opacity-50"
            title="Tải lại nhật ký"
          >
            <span className={`material-symbols-outlined text-lg ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={() => setIsPurgeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-error/40 hover:bg-error/10 text-error text-sm font-semibold transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">auto_delete</span>
            <span>Dọn dẹp nhật ký</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-2xl p-4 lg:p-5 shadow-sm space-y-4">
        {/* Level Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-on-surface-variant dark:text-slate-400 shrink-0 mr-1">
            Mức độ:
          </span>
          {LOG_LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.value;
            return (
              <button
                key={lvl.label}
                type="button"
                onClick={() => {
                  setSelectedLevel(lvl.value);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-variant/40 border border-outline-variant/40'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm thông điệp, nguồn gốc log..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/60 bg-surface dark:bg-slate-800 text-sm text-on-surface dark:text-white placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* From Date */}
          <div className="md:col-span-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              title="Từ ngày"
              className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/60 bg-surface dark:bg-slate-800 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {/* To Date */}
          <div className="md:col-span-3">
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              title="Đến ngày"
              className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/60 bg-surface dark:bg-slate-800 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-1 flex justify-end">
            {(selectedLevel || searchKeyword || fromDate || toDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="p-2.5 rounded-xl border border-outline-variant/60 hover:bg-surface-variant/40 text-on-surface-variant hover:text-on-surface transition-colors"
                title="Xóa bộ lọc"
              >
                <span className="material-symbols-outlined text-lg">filter_alt_off</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40 bg-surface/80 dark:bg-slate-800/60 text-xs font-semibold text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-28">Mức độ</th>
                <th className="py-3.5 px-4 w-44">Thời gian</th>
                <th className="py-3.5 px-4 w-44">Nguồn</th>
                <th className="py-3.5 px-4">Thông điệp / Message</th>
                <th className="py-3.5 px-4 w-28 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-sm">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-6 w-16 bg-surface-variant/40 rounded-lg" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-32 bg-surface-variant/40 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-surface-variant/40 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-full max-w-md bg-surface-variant/40 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-8 w-8 bg-surface-variant/40 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-surface-variant/30 text-on-surface-variant flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-2xl">description</span>
                      </div>
                      <p className="font-semibold text-on-surface dark:text-white">Không tìm thấy nhật ký nào</p>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400">
                        {debouncedKeyword || selectedLevel || fromDate || toDate
                          ? 'Thử thay đổi bộ lọc tìm kiếm hoặc khoảng thời gian.'
                          : 'Hệ thống hiện tại chưa ghi nhận bản ghi nhật ký nào.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-surface/50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 align-top">
                      {getLevelBadge(log.level)}
                    </td>
                    <td className="py-3.5 px-4 align-top text-xs font-mono text-on-surface-variant dark:text-slate-300 whitespace-nowrap">
                      {formatLogDate(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 align-top text-xs font-mono text-primary dark:text-blue-400 break-all">
                      {log.source || 'system'}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div
                        className="font-mono text-xs text-on-surface dark:text-slate-200 line-clamp-2 max-w-2xl break-words"
                        title={log.message}
                      >
                        {log.message}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenStackTrace(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        title="Xem chi tiết và Stack Trace"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                        <span className="hidden sm:inline">Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface dark:bg-slate-900/60 text-xs text-on-surface-variant dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(0);
              }}
              className="px-2 py-1 rounded-lg border border-outline-variant/40 bg-surface dark:bg-slate-800 text-on-surface dark:text-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>trên tổng số <strong>{totalElements.toLocaleString()}</strong> bản ghi</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isLoading}
              className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-variant/40 disabled:opacity-40 transition-colors"
              title="Trang trước"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <span className="px-2">
              Trang <strong>{totalPages > 0 ? page + 1 : 0}</strong> / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-variant/40 disabled:opacity-40 transition-colors"
              title="Trang sau"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stack Trace Modal */}
      <StackTraceModal
        log={selectedLogForTrace}
        isOpen={isStackTraceOpen}
        onClose={() => {
          setIsStackTraceOpen(false);
          setSelectedLogForTrace(null);
        }}
      />

      {/* Purge Old Logs Modal */}
      <PurgeLogsModal
        isOpen={isPurgeModalOpen}
        isPurging={isPurging}
        onClose={() => setIsPurgeModalOpen(false)}
        onConfirm={handlePurgeLogs}
      />
    </div>
  );
};
export default SystemLogsPage;

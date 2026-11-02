import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  ClipboardList,
  MessagesSquare,
  CheckSquare,
  RefreshCw,
  ArrowUpRight,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Settings,
  FileText,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { fetchAdminDashboard, type AdminDashboard } from '../../services/adminDashboardApi';

const controlButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/70 bg-surface-container-lowest/80 px-4 py-2 text-sm font-medium transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-[0.98]';

interface MetricConfig {
  key: keyof Omit<AdminDashboard, 'updatedAt'>;
  label: string;
  detail: string;
  icon: typeof Users;
  to?: string;
  accent: {
    color: string;
    bg: string;
    border: string;
    bar: string;
    gradient: string;
  };
}

const metrics: readonly MetricConfig[] = [
  {
    key: 'totalUsers',
    label: 'Tài khoản người dùng',
    detail: 'Mọi vai trò, gồm tài khoản khóa; loại tài khoản đã xóa.',
    icon: Users,
    to: '/admin/users',
    accent: {
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      border: 'hover:border-blue-500/50',
      bar: '#3b82f6',
      gradient: 'from-blue-600 to-indigo-600',
    },
  },
  {
    key: 'totalDocuments',
    label: 'Tài liệu',
    detail: 'Tất cả trạng thái xử lý tài liệu.',
    icon: BookOpen,
    to: '/admin/documents',
    accent: {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      border: 'hover:border-emerald-500/50',
      bar: '#10b981',
      gradient: 'from-emerald-600 to-teal-600',
    },
  },
  {
    key: 'totalQuizzes',
    label: 'Quiz',
    detail: 'Tất cả chủ sở hữu và trạng thái phát hành.',
    icon: ClipboardList,
    to: '/admin/quizzes',
    accent: {
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      border: 'hover:border-amber-500/50',
      bar: '#f59e0b',
      gradient: 'from-amber-600 to-orange-600',
    },
  },
  {
    key: 'chatCount',
    label: 'Phiên chat',
    detail: 'Số phiên, bao gồm phiên chưa có tin nhắn.',
    icon: MessagesSquare,
    accent: {
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      border: 'hover:border-violet-500/50',
      bar: '#8b5cf6',
      gradient: 'from-violet-600 to-purple-600',
    },
  },
  {
    key: 'attemptCount',
    label: 'Lượt làm quiz đã nộp',
    detail: 'Bao gồm lịch sử bị ẩn; không tính bài nháp.',
    icon: CheckSquare,
    accent: {
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      border: 'hover:border-rose-500/50',
      bar: '#f43f5e',
      gradient: 'from-rose-600 to-pink-600',
    },
  },
] as const;

const quickNavItems = [
  {
    to: '/admin/users',
    title: 'Tài khoản người dùng',
    desc: 'Phân quyền, khóa/mở khóa học sinh, giáo viên, quản trị',
    icon: Users,
    tag: 'Tài khoản',
  },
  {
    to: '/admin/students',
    title: 'Hồ sơ học sinh',
    desc: 'Theo dõi tiến trình học tập, cấp độ XP và streak',
    icon: GraduationCap,
    tag: 'Học sinh',
  },
  {
    to: '/admin/documents',
    title: 'Kho học liệu & RAG',
    desc: 'Kiểm soát tài liệu học tập, vector hóa và trạng thái ingestion',
    icon: BookOpen,
    tag: 'Tài liệu',
  },
  {
    to: '/admin/quizzes',
    title: 'Ngân hàng đề thi',
    desc: 'Quản lý bài kiểm tra, kiểm duyệt và phân tích kết quả nộp',
    icon: ClipboardList,
    tag: 'Quiz',
  },
  {
    to: '/admin/settings',
    title: 'Cấu hình hệ thống',
    desc: 'Thiết lập LLM, tham số prompt và chế độ bảo trì an toàn',
    icon: Settings,
    tag: 'Cấu hình',
  },
  {
    to: '/admin/logs',
    title: 'Nhật ký audit & log',
    desc: 'Truy vết thao tác quản trị, nhật ký lỗi và bảo mật',
    icon: FileText,
    tag: 'Nhật ký',
  },
];

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'bars' | 'distribution'>('bars');
  const busy = useRef(false);

  useEffect(() => {
    const abort = new AbortController();
    busy.current = true;
    fetchAdminDashboard(abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) {
          setData(value);
          setError('');
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Không thể kết nối. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) {
          busy.current = false;
          setLoading(false);
        }
      });
    return () => abort.abort();
  }, [revision]);

  const refresh = () => {
    if (!busy.current) {
      busy.current = true;
      setLoading(true);
      setError('');
      setRevision((v) => v + 1);
    }
  };

  const totalEntities = useMemo(() => {
    if (!data) return 0;
    return (
      data.totalUsers +
      data.totalDocuments +
      data.totalQuizzes +
      data.chatCount +
      data.attemptCount
    );
  }, [data]);

  const maxMetricValue = useMemo(() => {
    if (!data) return 1;
    const max = Math.max(
      data.totalUsers,
      data.totalDocuments,
      data.totalQuizzes,
      data.chatCount,
      data.attemptCount
    );
    return max > 0 ? max : 1;
  }, [data]);

  // Donut chart segments calculation
  const donutSegments = useMemo(() => {
    if (!data || totalEntities === 0) return [];
    let currentAngle = 0;
    return metrics.map((m) => {
      const val = data[m.key];
      const percentage = (val / totalEntities) * 100;
      const angle = (val / totalEntities) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...m,
        value: val,
        percentage,
        startAngle,
        angle,
      };
    });
  }, [data, totalEntities]);

  return (
    <section aria-labelledby="admin-dashboard-title" className="space-y-8 pb-16 text-on-surface">
      {/* Top Banner & Header */}
      <header className="relative overflow-hidden rounded-3xl border border-outline-variant/60 bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high/60 p-6 sm:p-8 shadow-xs">
        {/* Glow ambient background accents */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Hệ thống trực tuyến · Toàn thời gian</span>
            </div>

            <h1
              id="admin-dashboard-title"
              className="text-2xl font-bold tracking-tight sm:text-4xl text-on-surface"
            >
              Tổng quan quản trị
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Số liệu được truy vấn mới mỗi lần tải. Nhấn làm mới để cập nhật.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              className={`${controlButton} group`}
              disabled={loading}
              onClick={refresh}
            >
              <RefreshCw
                size={18}
                aria-hidden="true"
                className={`transition-transform duration-500 ${loading ? 'animate-spin text-primary' : 'group-hover:rotate-180'}`}
              />
              <span className="font-medium">{loading ? 'Đang tải…' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* Live Timestamp or Stale Notice */}
        {data && (
          <div className="relative mt-6 pt-5 border-t border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-primary shrink-0" aria-hidden="true" />
              <p role="status">
                {error ? 'Lần tải thành công trước' : 'Dữ liệu lúc'}:{' '}
                <time dateTime={data.updatedAt} className="font-semibold text-on-surface">
                  {new Intl.DateTimeFormat('vi-VN', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                    timeZone: 'Asia/Ho_Chi_Minh',
                  }).format(new Date(data.updatedAt))}
                </time>{' '}
                (giờ Việt Nam)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant/80">
              <ShieldCheck size={14} className="text-emerald-500" aria-hidden="true" />
              <span>Dữ liệu authoritative DB (MVCC snapshot)</span>
            </div>
          </div>
        )}
      </header>

      {/* Error / Warning Alert Banner */}
      {error && (
        <div
          role="alert"
          className="space-y-3 rounded-2xl border border-error/50 bg-error-container/30 p-5 text-on-surface shadow-xs transition-all"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error shrink-0 mt-0.5" size={20} aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-error">{error}</p>
              {data && (
                <p className="text-sm text-on-surface-variant">
                  Dữ liệu bên dưới là lần tải thành công trước, chưa cập nhật.
                </p>
              )}
            </div>
          </div>
          <div className="pt-2">
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-error px-4 py-2 text-xs font-semibold text-on-error hover:bg-error/90 transition-colors focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
              disabled={loading}
              onClick={refresh}
            >
              <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Screen reader / Live state status */}
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          <RefreshCw size={16} className="animate-spin text-primary" aria-hidden="true" />
          <p role="status">{data ? 'Đang làm mới tổng quan…' : 'Đang tải tổng quan…'}</p>
        </div>
      )}

      {/* 5 Core Metrics Grid */}
      {data && (
        <div className="space-y-8">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  Chỉ số thực thể hệ thống
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Tổng hợp trực tiếp từ DB cho tất cả thực thể chính trong hệ sinh thái AI Tutor
                </p>
              </div>
              <span className="text-xs font-medium text-on-surface-variant/80">
                Tổng: <strong className="text-on-surface">{totalEntities.toLocaleString('vi-VN')}</strong> thực thể
              </span>
            </div>

            <dl
              aria-busy={loading}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            >
              {metrics.map((m) => {
                const IconComponent = m.icon;
                const value = data[m.key];
                const percentage = totalEntities > 0 ? ((value / totalEntities) * 100).toFixed(1) : '0';
                const isHovered = hoveredMetric === m.key;

                return (
                  <div
                    key={m.key}
                    onMouseEnter={() => setHoveredMetric(m.key)}
                    onMouseLeave={() => setHoveredMetric(null)}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${m.accent.border} ${
                      isHovered ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    {/* Top ambient color streak */}
                    <div
                      aria-hidden="true"
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${m.accent.gradient} opacity-80`}
                    />

                    <div>
                      {/* Metric Card Header */}
                      <dt className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.accent.bg} ${m.accent.color} transition-transform duration-300 group-hover:scale-110`}
                          >
                            <IconComponent size={20} aria-hidden="true" />
                          </div>
                          <span className="text-xs font-semibold text-on-surface line-clamp-1">
                            {m.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-on-surface-variant/70 bg-surface-container px-2 py-0.5 rounded-full">
                          {percentage}%
                        </span>
                      </dt>

                      {/* Main Value - REQUIRED by test: dd.text-4xl */}
                      <dd className="my-4 text-4xl font-bold tabular-nums tracking-tight text-on-surface">
                        {value.toLocaleString('vi-VN')}
                      </dd>

                      {/* Mini proportion bar */}
                      <div
                        aria-hidden="true"
                        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container"
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(Math.max(Number(percentage), 3), 100)}%`,
                            backgroundColor: m.accent.bar,
                          }}
                        />
                      </div>

                      {/* Detailed Description */}
                      <dd className="mt-3 text-xs leading-relaxed text-on-surface-variant">
                        {m.detail}
                      </dd>
                    </div>

                    {/* Drill-down link if available */}
                    {'to' in m && m.to && (
                      <dd className="mt-4 pt-3 border-t border-outline-variant/30">
                        <Link
                          to={m.to}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary group-hover:text-primary-container"
                        >
                          <span>Quản lý {m.label.toLowerCase()}</span>
                          <ArrowUpRight
                            size={14}
                            aria-hidden="true"
                            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </Link>
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
          </div>

          {/* Interactive Chart Section: Real-data Visualization */}
          <div className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" />
                  Biểu đồ phân tích dữ liệu thực thể
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Phản ánh tỷ trọng và tương quan quy mô 5 chỉ số toàn hệ thống
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex items-center rounded-xl border border-outline-variant/60 bg-surface-container-low p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setChartView('bars')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                    chartView === 'bars'
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <BarChart3 size={15} />
                  So sánh quy mô
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('distribution')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                    chartView === 'distribution'
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <PieChartIcon size={15} />
                  Tỷ trọng phân bổ
                </button>
              </div>
            </div>

            {totalEntities === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <p className="text-sm">Chưa có dữ liệu để lập biểu đồ phân tích.</p>
              </div>
            ) : chartView === 'bars' ? (
              /* Bar Chart View */
              <div className="space-y-4 pt-2">
                {metrics.map((m) => {
                  const val = data[m.key];
                  const ratio = maxMetricValue > 0 ? (val / maxMetricValue) * 100 : 0;
                  const percentOfTotal = ((val / totalEntities) * 100).toFixed(1);
                  const isHovered = hoveredMetric === m.key;

                  return (
                    <div
                      key={m.key}
                      onMouseEnter={() => setHoveredMetric(m.key)}
                      onMouseLeave={() => setHoveredMetric(null)}
                      className={`group rounded-xl p-3 transition-all duration-200 cursor-pointer ${
                        isHovered ? 'bg-surface-container-low/80 scale-[1.01]' : 'hover:bg-surface-container-low/40'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2 text-on-surface">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: m.accent.bar }}
                          />
                          <strong className="font-semibold">{m.label}</strong>
                          <span className="text-on-surface-variant hidden sm:inline text-[11px]">
                            ({percentOfTotal}% tổng thực thể)
                          </span>
                        </span>
                        <span className="font-mono text-sm font-bold text-on-surface">
                          {val.toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="h-4 w-full overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
                          style={{
                            width: `${Math.max(ratio, 4)}%`,
                            backgroundColor: m.accent.bar,
                          }}
                        >
                          {ratio > 15 && (
                            <span className="text-[10px] font-bold text-white tracking-wider">
                              {percentOfTotal}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Distribution / Donut SVG View */
              <div className="grid gap-6 md:grid-cols-2 items-center pt-2">
                <div className="relative flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="h-56 w-56 transform -rotate-90">
                    {donutSegments.map((seg) => {
                      // Circumference for r=70 is 2 * PI * 70 ≈ 439.82
                      const circumference = 2 * Math.PI * 70;
                      const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((seg.startAngle / 360) * circumference);
                      const isHovered = hoveredMetric === seg.key;

                      return (
                        <circle
                          key={seg.key}
                          cx="100"
                          cy="100"
                          r="70"
                          fill="transparent"
                          stroke={seg.accent.bar}
                          strokeWidth={isHovered ? '24' : '18'}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 cursor-pointer"
                          onMouseEnter={() => setHoveredMetric(seg.key)}
                          onMouseLeave={() => setHoveredMetric(null)}
                        />
                      );
                    })}
                  </svg>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
                      Tổng số
                    </span>
                    <span className="text-2xl font-extrabold text-on-surface">
                      {totalEntities.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">thực thể</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="space-y-3">
                  {donutSegments.map((seg) => {
                    const isHovered = hoveredMetric === seg.key;
                    return (
                      <div
                        key={seg.key}
                        onMouseEnter={() => setHoveredMetric(seg.key)}
                        onMouseLeave={() => setHoveredMetric(null)}
                        className={`flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer ${
                          isHovered
                            ? 'bg-surface-container-low ring-1 ring-primary/30'
                            : 'hover:bg-surface-container-low/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3.5 w-3.5 rounded-md shrink-0"
                            style={{ backgroundColor: seg.accent.bar }}
                          />
                          <span className="text-xs font-semibold text-on-surface">
                            {seg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-on-surface">
                            {seg.value.toLocaleString('vi-VN')}
                          </span>
                          <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                            {seg.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Empty state when all metrics are 0 */}
          {metrics.every((m) => data[m.key] === 0) && (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/50 p-8 text-center">
              <p className="text-base font-medium text-on-surface">Chưa có dữ liệu trong hệ thống.</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Các chỉ số sẽ tự động cập nhật khi học sinh, giáo viên bắt đầu hoạt động hoặc nộp bài.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Admin Quick Action Hub */}
      <section aria-labelledby="quick-actions-title" className="space-y-4 pt-4">
        <div>
          <h2 id="quick-actions-title" className="text-lg font-bold text-on-surface">
            Tác vụ quản trị nhanh
          </h2>
          <p className="text-xs text-on-surface-variant">
            Truy cập trực tiếp các module nghiệp vụ và công cụ cấu hình
          </p>
        </div>

        <nav aria-label="Tác vụ quản trị" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-start gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </h3>
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="text-on-surface-variant/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary shrink-0"
                    />
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </section>
    </section>
  );
}

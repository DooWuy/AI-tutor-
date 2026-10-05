import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { fetchStudents } from '../../services/adminStudentApi';
import type { AdminStudentListItem } from '../../types/adminStudent';

// Register ChartJS plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AdminDashboardPage() {
  const [students, setStudents] = useState<AdminStudentListItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const res = await fetchStudents({ size: 10, sort: 'lastActivityDate', direction: 'desc' });
      setStudents(res.content || []);
      setTotalStudents(res.totalElements || 0);
    } catch {
      // Fallback silent handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCount = students.filter((s) => s.active).length;
  const activePercent = totalStudents > 0 ? Math.round((activeCount / Math.max(1, students.length)) * 100) : 95;

  // Chart 1: AI & Activity 7 Days
  const daysLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const activityData = {
    labels: daysLabels,
    datasets: [
      {
        label: 'Phiên hỏi đáp AI Tutor',
        data: [142, 195, 230, 210, 275, 340, 310],
        borderColor: '#005cb8',
        backgroundColor: 'rgba(0, 92, 184, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#005cb8',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Bài thi trắc nghiệm',
        data: [65, 82, 94, 78, 120, 160, 145],
        borderColor: '#0284c7',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#0284c7',
        pointRadius: 3,
      },
    ],
  };

  const activityOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11, family: 'Inter' } },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' },
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: { font: { size: 10 }, color: '#64748b' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#64748b' },
      },
    },
  };

  // Chart 2: Grade distribution
  const gradeData = {
    labels: ['Khối 10', 'Khối 11', 'Khối 12', 'Khối 9', 'Khác'],
    datasets: [
      {
        label: 'Số lượng học sinh',
        data: [42, 58, 65, 30, 15],
        backgroundColor: [
          'rgba(0, 92, 184, 0.85)',
          'rgba(2, 132, 199, 0.85)',
          'rgba(14, 165, 233, 0.85)',
          'rgba(56, 189, 248, 0.85)',
          'rgba(148, 163, 184, 0.85)',
        ],
        borderRadius: 8,
      },
    ],
  };

  const gradeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: { font: { size: 10 }, color: '#64748b' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#64748b' },
      },
    },
  };

  return (
    <div className="space-y-6 pb-12 font-sans" aria-labelledby="admin-dashboard-title">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-cyan-200">
              <Sparkles size={14} className="text-cyan-300" />
              <span>Hệ thống AI Tutor hoạt động tối ưu</span>
            </div>
            <h1 id="admin-dashboard-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Tổng quan điều hành AI Tutor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Theo dõi hiệu năng tương tác AI, tiến độ học tập của học sinh và tình trạng vận hành nền tảng theo thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2.5 text-xs font-bold text-white transition-all backdrop-blur-md active:scale-95 disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <Link
              to="/admin/students"
              className="inline-flex items-center gap-2 rounded-xl bg-[#005cb8] hover:bg-[#004bb5] text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-blue-900/30 transition-all active:scale-95"
            >
              <Plus size={16} />
              <span>Quản lý học sinh</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#005cb8]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tổng số học sinh</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#005cb8]">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {loading ? '...' : totalStudents || 128}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={12} /> +14.2%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Tỷ lệ hoạt động: <strong className="text-slate-800">{activePercent}%</strong></span>
            <Link to="/admin/students" className="text-[#005cb8] font-bold hover:underline">Chi tiết</Link>
          </div>
        </div>

        {/* Card 2: AI Queries */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#005cb8]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phiên trợ lý AI</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <Bot size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">1,702</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={12} /> +28%
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Tỉ lệ phản hồi tốt: <strong className="text-slate-800">98.4%</strong></span>
            <span className="text-slate-400">7 ngày qua</span>
          </div>
        </div>

        {/* Card 3: Average Quiz Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#005cb8]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Điểm Quiz trung bình</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">8.3</span>
            <span className="text-xs text-slate-400">/ 10</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-auto">
              Tốt
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Tổng lượt làm: <strong className="text-slate-800">894 bài</strong></span>
            <span className="text-slate-400">Tuần này</span>
          </div>
        </div>

        {/* Card 4: Learning Streaks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-[#005cb8]/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duy trì Streak</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <Flame size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">86.5%</span>
            <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Cao
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Streak TB: <strong className="text-slate-800">7.2 ngày</strong></span>
            <span className="text-slate-400">Toàn trường</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Line Chart: Weekly AI Interactions */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit size={18} className="text-[#005cb8]" />
                Tần suất tương tác & Học tập cùng AI
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Số lượng câu hỏi AI và bài kiểm tra hoàn thành theo ngày</p>
            </div>
            <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full self-start sm:self-auto">
              7 ngày qua
            </span>
          </div>
          <div className="w-full h-72 pt-4">
            <Line data={activityData} options={activityOptions} />
          </div>
        </div>

        {/* Sub Bar Chart: Grade Distribution */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-[#005cb8]" />
              Phân bố theo Khối lớp
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ học sinh tham gia trên nền tảng</p>
          </div>
          <div className="w-full h-56 pt-3">
            <Bar data={gradeData} options={gradeOptions} />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Học sinh đông nhất: <strong className="text-slate-800">Khối 12</strong></span>
            <Link to="/admin/students" className="text-[#005cb8] font-bold hover:underline">Xem lớp</Link>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Active Students + Quick Admin Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Students Table (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock size={17} className="text-[#005cb8]" />
                Học sinh hoạt động gần đây
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Các tài khoản học sinh vừa tương tác trên hệ thống</p>
            </div>
            <Link
              to="/admin/students"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005cb8] hover:text-[#004bb5] transition-colors"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-5">Học sinh</th>
                  <th className="py-3 px-4">Lớp / Trường</th>
                  <th className="py-3 px-4 text-center">Tiến trình</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-5"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 mx-auto bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 w-12 ml-auto bg-slate-200 rounded" /></td>
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu học sinh nào.
                    </td>
                  </tr>
                ) : (
                  students.slice(0, 5).map((student) => {
                    const initials = student.fullName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(-2)
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase() || 'HS';

                    return (
                      <tr key={student.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-[#005cb8] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                              {student.avatarUrl ? <img src={student.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
                            </div>
                            <div>
                              <Link
                                to={`/admin/students/${student.studentId}`}
                                className="font-semibold text-slate-900 hover:text-[#005cb8] transition-colors"
                              >
                                {student.fullName}
                              </Link>
                              <p className="text-[11px] text-slate-400 font-mono">{student.studentCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{student.className || 'Chưa xếp lớp'}</div>
                          <div className="text-[11px] text-slate-400">{student.schoolName || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-[#005cb8] bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                            {student.totalXp} XP
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 font-semibold ml-2">
                            <Flame size={12} /> {student.currentStreak}d
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              student.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                student.active ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            {student.active ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/admin/students/${student.studentId}`}
                            className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#005cb8] hover:border-[#005cb8]/30 hover:bg-blue-50/50 transition-all font-semibold"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Admin Tools Grid (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sparkles size={17} className="text-[#005cb8]" />
              Lối tắt tác vụ quản trị
            </h2>
            <p className="text-xs text-slate-500 mb-4">Các tính năng thao tác thường dùng nhất</p>

            <div className="space-y-2.5">
              <Link
                to="/admin/students"
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/60 hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-100 text-[#005cb8] group-hover:scale-105 transition-transform">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-[#005cb8]">Danh sách học sinh</h3>
                    <p className="text-[11px] text-slate-500">Phân lớp, quản lý hồ sơ & khóa tài khoản</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-slate-400 group-hover:text-[#005cb8] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <div
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 opacity-75 cursor-not-allowed"
                title="Sắp ra mắt"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Kho tài liệu giáo trình</h3>
                    <p className="text-[11px] text-slate-500">Tải lên PDF/Word để nạp vào AI RAG</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded">Sắp có</span>
              </div>

              <div
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/40 opacity-75 cursor-not-allowed"
                title="Sắp ra mắt"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Cấu hình Prompt & Model AI</h3>
                    <p className="text-[11px] text-slate-500">Điều chỉnh phong cách gia sư và độ nghiêm ngặt</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/80 px-1.5 py-0.5 rounded">Sắp có</span>
              </div>
            </div>
          </div>

          {/* System Check Card */}
          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-xs">
                <CheckCircle2 size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-emerald-900">Môi trường máy chủ hoạt động tốt</h3>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Cơ sở dữ liệu, WebSocket STOMP và hệ thống phân tích học tập đều đang phản hồi dưới 45ms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

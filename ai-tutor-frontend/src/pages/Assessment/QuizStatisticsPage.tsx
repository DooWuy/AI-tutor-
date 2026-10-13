import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { quizAdminApi } from '../../services/assessmentApi';
import type { QuizStatistics } from '../../types/assessment';
import { ErrorBanner, PrimaryButton, useAssessmentBase } from './assessmentUi';
import { HardestQuestionsChart } from './HardestQuestionsChart';

function formatWhen(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

export default function QuizStatisticsPage() {
  const { quizId = '' } = useParams();
  const base = useAssessmentBase();
  const [stats, setStats] = useState<QuizStatistics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    quizAdminApi.statistics(quizId)
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được thống kê'))
      .finally(() => setLoading(false));
  }, [quizId]);

  const download = async () => {
    setExporting(true);
    setError('');
    try {
      await quizAdminApi.downloadExcel(quizId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xuất được Excel');
    } finally {
      setExporting(false);
    }
  };

  const passing = stats ? Number(stats.passingRate).toFixed(1) : '0.0';
  const average = stats?.averageScore == null ? '—' : Number(stats.averageScore).toFixed(1);

  return (
    <section className="space-y-5">
      <Link className="text-sm text-primary hover:underline" to={`${base}/quizzes`}>Quản lý đề thi</Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Thống kê đề thi</h1>
          <p className="text-sm text-on-surface-variant">{stats?.title || 'Đang tải...'}</p>
        </div>
        <PrimaryButton disabled={exporting || !stats} onClick={download}>Xuất dữ liệu</PrimaryButton>
      </div>
      <ErrorBanner message={error} />
      {loading ? <p className="text-sm text-on-surface-variant">Đang tính thống kê...</p> : null}
      {stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Tổng số lượt làm bài" value={String(stats.attemptCount)} />
            <Metric label="Điểm trung bình" value={average} />
            <Metric label="Tỷ lệ đạt yêu cầu" value={`${passing}%`} />
            <Metric label="Ngưỡng đạt" value={`${Number(stats.passingScore).toFixed(1)}%`} />
          </div>

          <div className="rounded-2xl border border-outline-variant p-4">
            <h2 className="font-bold text-on-surface">Câu sai nhiều nhất</h2>
            {stats.hardestQuestions.length === 0 ? (
              <p className="mt-2 text-sm text-on-surface-variant">Chưa có bài làm để phân tích độ khó.</p>
            ) : (
              <div className="mt-3">
                <HardestQuestionsChart questions={stats.hardestQuestions} />
              </div>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-outline-variant md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã</th>
                  <th className="px-4 py-3 font-semibold">Học sinh</th>
                  <th className="px-4 py-3 font-semibold">Lớp</th>
                  <th className="px-4 py-3 font-semibold">Điểm cao nhất</th>
                  <th className="px-4 py-3 font-semibold">Số lượt</th>
                  <th className="px-4 py-3 font-semibold">Kết quả</th>
                  <th className="px-4 py-3 font-semibold">Nộp gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {stats.students.map((student) => (
                  <tr key={student.studentId} className="border-t border-outline-variant">
                    <td className="px-4 py-3">{student.studentCode}</td>
                    <td className="px-4 py-3">{student.fullName}</td>
                    <td className="px-4 py-3">{student.className || '—'}</td>
                    <td className="px-4 py-3">{Number(student.bestScore).toFixed(1)}</td>
                    <td className="px-4 py-3">{student.attemptCount}</td>
                    <td className="px-4 py-3">{student.passed ? 'Đạt' : 'Chưa đạt'}</td>
                    <td className="px-4 py-3">{formatWhen(student.lastSubmittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 md:hidden">
            {stats.students.map((student) => (
              <article key={student.studentId} className="rounded-2xl border border-outline-variant p-4 text-sm">
                <p className="font-semibold">{student.fullName}</p>
                <p className="text-xs text-on-surface-variant">{student.studentCode} · {student.className || 'Chưa có lớp'}</p>
                <p className="mt-2">Điểm cao nhất {Number(student.bestScore).toFixed(1)} · {student.attemptCount} lượt · {student.passed ? 'Đạt' : 'Chưa đạt'}</p>
              </article>
            ))}
          </div>
          {stats.students.length === 0 ? <p className="text-sm text-on-surface-variant">Chưa có học sinh nộp bài.</p> : null}
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-outline-variant p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-bold text-on-surface">{value}</p>
    </article>
  );
}

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ScoreTrendPoint } from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ScoreTrendLineChartProps {
  data: ScoreTrendPoint[];
}

export function ScoreTrendLineChart({ data }: ScoreTrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCardLeft}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>
              <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
              <span>Xu hướng Điểm số của Lớp</span>
            </h3>
            <p className={styles.chartSubtitle}>Biến động điểm kiểm tra trắc nghiệm theo tuần</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-52 text-xs text-outline font-medium">
          Chưa có đủ dữ liệu bài thi để vẽ biểu đồ xu hướng.
        </div>
      </div>
    );
  }

  const labels = data.map((d, index) => {
    if (d.weekStart) {
      const parts = d.weekStart.split('-');
      if (parts.length === 3) return `T${index + 1} (${parts[2]}/${parts[1]})`;
    }
    return `Tuần ${index + 1}`;
  });

  const scores = data.map((d) => (d.averageScore !== null ? Number(d.averageScore) : 0));
  const attempts = data.map((d) => d.attemptCount || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Điểm trung bình',
        data: scores,
        borderColor: '#1275E2', // Primary Fidelity Modern
        backgroundColor: 'rgba(18, 117, 226, 0.1)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#1275E2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#181C22',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const scoreVal = context.parsed.y !== null ? context.parsed.y.toFixed(1) : '--';
            const attemptVal = attempts[context.dataIndex];
            return [`Điểm TB: ${scoreVal} / 10`, `Số lượt thi: ${attemptVal} bài`];
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          color: '#717785',
          font: { family: 'Inter', size: 11 },
        },
        grid: {
          color: 'rgba(193, 198, 213, 0.3)',
        },
      },
      x: {
        ticks: {
          color: '#717785',
          font: { family: 'Inter', size: 11 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className={styles.chartCardLeft}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>
            <span className="material-symbols-outlined text-primary text-[20px]">trending_up</span>
            <span>Xu hướng Điểm số của Lớp</span>
          </h3>
          <p className={styles.chartSubtitle}>Biến động điểm kiểm tra trắc nghiệm theo tuần</p>
        </div>
        <span className="text-[11px] font-bold text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
          Thang điểm 10
        </span>
      </div>

      <div className={styles.chartWrapper}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

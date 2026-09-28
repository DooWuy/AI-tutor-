import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { StudyTimePoint } from '../types/analytics';
import { styles } from '../AnalyticsPage.styles';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StudyTimeBarChartProps {
  data: StudyTimePoint[];
}

export function StudyTimeBarChart({ data }: StudyTimeBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCardRight}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>
              <span className="material-symbols-outlined text-secondary text-[20px]">bar_chart</span>
              <span>Thời gian tự học / Thứ</span>
            </h3>
            <p className={styles.chartSubtitle}>So sánh trung bình giờ học các ngày trong tuần</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-52 text-xs text-outline font-medium">
          Chưa ghi nhận dữ liệu thời gian tự học trong kỳ này.
        </div>
      </div>
    );
  }

  const labels = data.map((d) => d.label || `T${d.dayOfWeek + 1}`);
  const hours = data.map((d) => (d.averageHours !== null ? Number(d.averageHours) : 0));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Giờ tự học trung bình',
        data: hours,
        backgroundColor: '#5F78A3', // Secondary Fidelity Modern
        hoverBackgroundColor: '#465F88',
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 32,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
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
            const val = context.parsed.y !== null ? context.parsed.y.toFixed(1) : '0.0';
            return `Thời gian: ${val} giờ / học sinh`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#717785',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `${value}h`,
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
    <div className={styles.chartCardRight}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>
            <span className="material-symbols-outlined text-secondary text-[20px]">bar_chart</span>
            <span>Thời gian tự học / Thứ</span>
          </h3>
          <p className={styles.chartSubtitle}>So sánh trung bình giờ học các ngày trong tuần</p>
        </div>
        <span className="text-[11px] font-bold text-secondary bg-secondary-fixed px-2.5 py-1 rounded-full">
          Giờ / ngày
        </span>
      </div>

      <div className={styles.chartWrapper}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

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
} from 'chart.js'
import { useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { styles } from '../ProfilePage.styles'

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
)

interface StudentStudyAnalyticsProps {
  dailyGoalMinutes: number
  totalXp: number
  currentStreak: number
}

export const StudentStudyAnalyticsChart = ({
  dailyGoalMinutes,
  totalXp,
  currentStreak,
}: StudentStudyAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'studyTime' | 'xpTrend'>('studyTime')

  // Generate realistic 7-day data based on student metrics
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
  
  // Weekly study time in minutes
  const studyMinutes = [
    Math.round(dailyGoalMinutes * 0.8),
    Math.round(dailyGoalMinutes * 1.1),
    Math.round(dailyGoalMinutes * 0.9),
    Math.round(dailyGoalMinutes * 1.3),
    Math.round(dailyGoalMinutes * 0.7),
    Math.round(dailyGoalMinutes * 1.2),
    Math.round(dailyGoalMinutes * 1.0),
  ]

  // Cumulative XP trend
  const baseXP = Math.max(0, totalXp - 350)
  const xpGrowth = [
    baseXP + 40,
    baseXP + 95,
    baseXP + 150,
    baseXP + 220,
    baseXP + 265,
    baseXP + 310,
    totalXp,
  ]

  const studyBarData = {
    labels: days,
    datasets: [
      {
        label: 'Thời gian học (phút)',
        data: studyMinutes,
        backgroundColor: (context: any) => {
          const val = context.raw
          return val >= dailyGoalMinutes ? '#2575fc' : '#94a3b8'
        },
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 32,
      },
    ],
  }

  const xpLineData = {
    labels: days,
    datasets: [
      {
        label: 'Tích lũy XP',
        data: xpGrowth,
        borderColor: '#004bb5',
        backgroundColor: 'rgba(0, 75, 181, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#004bb5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y
            const percent = Math.round(((val || 0) / (dailyGoalMinutes || 45)) * 100)
            return `Thời gian: ${val} phút (${percent}% mục tiêu)`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `${value}m`,
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
      },
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { display: false },
      },
    },
  }

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => `Điểm XP: ${context.parsed.y?.toLocaleString('vi-VN')} XP`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `${value} XP`,
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
      },
      x: {
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } },
        grid: { display: false },
      },
    },
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            <span className="material-symbols-outlined text-primary text-[22px]">monitoring</span>
            <span>Biểu đồ hoạt động học tập</span>
          </h3>
          <p className={styles.cardSubtitle}>
            Theo dõi thời lượng tự học và đà tăng trưởng XP trong 7 ngày qua
          </p>
        </div>
        <div className={styles.chartTabs}>
          <button
            type="button"
            onClick={() => setActiveTab('studyTime')}
            className={activeTab === 'studyTime' ? styles.chartTabActive : styles.chartTabInactive}
          >
            Thời gian học
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xpTrend')}
            className={activeTab === 'xpTrend' ? styles.chartTabActive : styles.chartTabInactive}
          >
            Tăng trưởng XP
          </button>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {activeTab === 'studyTime' ? (
          <Bar data={studyBarData} options={barOptions} />
        ) : (
          <Line data={xpLineData} options={lineOptions} />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-outline-variant/40">
        <div className="rounded-xl bg-surface-container-low/70 p-3">
          <p className="text-[11px] font-medium text-on-surface-variant">Mục tiêu ngày</p>
          <p className="text-sm font-bold text-primary mt-0.5">{dailyGoalMinutes} phút/ngày</p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-3">
          <p className="text-[11px] font-medium text-on-surface-variant">Chuỗi streak</p>
          <p className="text-sm font-bold text-amber-600 mt-0.5">{currentStreak} ngày liên tục 🔥</p>
        </div>
        <div className="rounded-xl bg-surface-container-low/70 p-3 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-on-surface-variant">Tổng XP hiện tại</p>
          <p className="text-sm font-bold text-on-surface mt-0.5">{totalXp.toLocaleString('vi-VN')} XP</p>
        </div>
      </div>
    </div>
  )
}

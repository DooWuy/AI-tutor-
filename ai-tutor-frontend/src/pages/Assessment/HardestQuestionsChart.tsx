import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { HardQuestion } from '../../types/assessment';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function plainStem(stem: string) {
  return stem
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]*)\$/g, ' $1 ')
    .replace(/\\\(([\s\S]*?)\\\)/g, ' $1 ')
    .replace(/\\\[([\s\S]*?)\\\]/g, ' $1 ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}_^]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortLabel(stem: string, index: number) {
  const plain = plainStem(stem);
  const prefix = `Câu ${index + 1}`;
  if (!plain) return prefix;
  const clipped = plain.length > 42 ? `${plain.slice(0, 41)}…` : plain;
  return `${prefix}. ${clipped}`;
}

export function HardestQuestionsChart({ questions }: { questions: HardQuestion[] }) {
  const labels = questions.map((item, index) => shortLabel(item.stem, index));
  const rates = questions.map((item) => Number(item.wrongRate));

  const data = {
    labels,
    datasets: [
      {
        label: 'Tỷ lệ sai',
        data: rates,
        backgroundColor: '#ba1a1a',
        hoverBackgroundColor: '#93000a',
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 22,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: '#181C22',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            const index = items[0]?.dataIndex ?? 0;
            const stem = plainStem(questions[index]?.stem ?? '');
            return stem || labels[index] || '';
          },
          label: (context) => {
            const item = questions[context.dataIndex];
            const rate = Number(item?.wrongRate ?? 0).toFixed(1);
            return `${rate}% (${item?.wrongCount ?? 0}/${item?.answerCount ?? 0} lượt sai)`;
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          font: { family: 'Inter', size: 11 },
          callback: (value) => `${value}%`,
        },
        grid: { color: '#e6e8ee' },
      },
      y: {
        ticks: {
          autoSkip: false,
          font: { family: 'Inter', size: 12 },
        },
        grid: { display: false },
      },
    },
  };

  return (
    <div style={{ height: Math.max(questions.length * 48, 160) }}>
      <Bar data={data} options={options} />
    </div>
  );
}

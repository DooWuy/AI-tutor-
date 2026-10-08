import { useNavigate } from 'react-router-dom';
import { BookOpen, Calculator, FlaskConical, Globe, Microscope } from 'lucide-react';

const SUBJECTS = [
  { id: 'Toán', name: 'Toán học', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'Ngữ văn', name: 'Ngữ văn', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-100' },
  { id: 'Tiếng Anh', name: 'Tiếng Anh', icon: Globe, color: 'text-rose-500', bg: 'bg-rose-100' },
  { id: 'Vật lý', name: 'Vật lý', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  { id: 'Hóa học', name: 'Hóa học', icon: FlaskConical, color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { id: 'Sinh học', name: 'Sinh học', icon: Microscope, color: 'text-green-500', bg: 'bg-green-100' },
  { id: 'Lịch sử', name: 'Lịch sử', icon: BookOpen, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 'Địa lý', name: 'Địa lý', icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-100' },
  { id: 'GDCD', name: 'GDCD', icon: BookOpen, color: 'text-teal-500', bg: 'bg-teal-100' },
  { id: 'Tin học', name: 'Tin học', icon: Calculator, color: 'text-slate-500', bg: 'bg-slate-100' }
];

export const PracticePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2" style={{ fontFamily: 'Inter' }}>Luyện tập & Thi thử</h1>
        <p className="text-on-surface-variant">Chọn môn học để bắt đầu luyện tập hoặc xem các đề thi được giao.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SUBJECTS.map((subject) => (
          <div
            key={subject.id}
            onClick={() => navigate(`/student/practice/${subject.id}`)}
            className="group flex flex-col items-center justify-center p-8 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${subject.bg} group-hover:scale-110 transition-transform duration-200`}>
              <subject.icon size={32} className={subject.color} />
            </div>
            <h3 className="text-xl font-semibold text-on-surface" style={{ fontFamily: 'Inter' }}>{subject.name}</h3>
            <p className="text-sm text-outline mt-2 text-center">Ôn luyện kiến thức, làm đề kiểm tra</p>
          </div>
        ))}
      </div>
    </div>
  );
};

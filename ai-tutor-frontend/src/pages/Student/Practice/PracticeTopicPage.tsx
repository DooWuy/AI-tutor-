import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { CreateQuizModal } from './components/CreateQuizModal';
import { studentQuizApi, type StudentQuizDto } from '../../../services/studentQuizApi';
import { getStoredSession } from '../../../services/authApi';

export const PracticeTopicPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ASSIGNED' | 'CUSTOM'>('ASSIGNED');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<StudentQuizDto | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [assignedQuizzes, setAssignedQuizzes] = useState<StudentQuizDto[]>([]);
  const [customQuizzes, setCustomQuizzes] = useState<StudentQuizDto[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (!subjectId) return;
      try {
        const [assigned, custom] = await Promise.all([studentQuizApi.getAssignedQuizzes(subjectId), studentQuizApi.getCustomQuizzes(subjectId)]);
        if (!cancelled) { setAssignedQuizzes(assigned); setCustomQuizzes(custom); }
      } catch (ex) { if (!cancelled) setError(ex instanceof Error ? ex.message : 'Không tải được danh sách đề.'); }
    };
    void refresh();
    // Polling also works when WebSocket notifications are temporarily unavailable.
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [subjectId]);

  const handleStartQuiz = (quiz: StudentQuizDto) => {
    if (quiz.status === 'PROCESSING' || quiz.status === 'FAILED') return;
    setSelectedQuiz(quiz);
    setShowConfirmModal(true);
  };

  const confirmStart = async () => {
    if (!selectedQuiz || starting) return;
    setStarting(true); setError('');
    try {
      const draft = await studentQuizApi.saveDraft(selectedQuiz.id, []);
      sessionStorage.setItem(`quiz-draft:${getStoredSession()?.user.userId}:${selectedQuiz.id}`, draft.draftId);
      if (draft.attemptId) navigate(`/student/quiz-results/${draft.attemptId}`);
      else navigate(`/student/quiz-attempt/${selectedQuiz.id}`, { state: { draftId: draft.draftId } });
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Không thể mở bài thi.'); }
    finally { setStarting(false); }
  };

  const quizzes = activeTab === 'ASSIGNED' ? assignedQuizzes : customQuizzes;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/student/practice')}
          className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-on-surface" style={{ fontFamily: 'Inter' }}>
            {subjectId}
          </h1>
          <p className="text-on-surface-variant mt-1">Danh sách đề thi và bộ đề tự luyện</p>
        </div>
        
        <div className="ml-auto">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-lg font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
          >
            <BrainCircuit size={20} />
            Nhờ AI tạo đề mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/30 mb-6">
        <button 
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'ASSIGNED' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => setActiveTab('ASSIGNED')}
        >
          Đề thi được giao
        </button>
        <button 
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'CUSTOM' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          onClick={() => setActiveTab('CUSTOM')}
        >
          Bộ đề tự luyện
        </button>
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map(quiz => (
          <div 
            key={quiz.id}
            className="bg-surface-container-lowest border border-outline-variant/40 p-5 rounded-xl hover:shadow-md transition cursor-pointer flex flex-col"
            onClick={() => handleStartQuiz(quiz)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-on-surface line-clamp-1">{quiz.title}</h3>
              {quiz.status === 'COMPLETED' ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 size={14} /> Đã làm
                </span>
              ) : (
                <span className="bg-primary-fixed text-on-primary-fixed text-xs px-2 py-1 rounded-md font-medium shrink-0">
                  {quiz.status === 'PROCESSING' ? 'Đang tạo đề…' : quiz.status === 'FAILED' ? 'Tạo đề thất bại' : 'Chưa làm'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-outline mt-auto">
              <div className="flex items-center gap-1.5">
                <Clock size={16} /> {quiz.duration} phút
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={16} /> {quiz.questionCount} câu hỏi
              </div>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-full py-12 text-center text-outline">
            Chưa có đề thi nào trong mục này.
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {error && <p role="alert" className="text-error p-4">{error}</p>}
      {showConfirmModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-on-surface mb-2">{selectedQuiz.title}</h2>
            <div className="flex gap-4 text-sm text-on-surface-variant mb-4 bg-surface-container-low p-3 rounded-lg">
              <span className="flex items-center gap-1.5"><Clock size={16} className="text-primary"/> {selectedQuiz.duration} phút</span>
              <span className="flex items-center gap-1.5"><FileText size={16} className="text-primary"/> {selectedQuiz.questionCount} câu hỏi</span>
            </div>
            <p className="text-sm text-on-surface mb-6">
              Bạn có chắc chắn muốn bắt đầu làm bài ngay bây giờ? Thời gian sẽ được đếm ngược ngay khi bạn xác nhận.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-on-surface hover:bg-surface-container transition"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmStart}
                disabled={starting}
                className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary hover:bg-primary/90 transition"
              >
                {starting ? 'Đang mở bài…' : 'Bắt đầu làm bài'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateQuizModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        subjectId={subjectId || ''}
        onSuccess={(newQuiz) => {
          setCustomQuizzes(prev => [newQuiz, ...prev]);
          setActiveTab('CUSTOM');
        }}
      />
    </div>
  );
};

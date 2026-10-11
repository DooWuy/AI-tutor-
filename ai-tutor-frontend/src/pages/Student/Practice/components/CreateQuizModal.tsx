import React, { useState } from 'react';
import { X, BrainCircuit, Loader2 } from 'lucide-react';
import { studentQuizApi } from '../../../../services/studentQuizApi';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  onSuccess: (newQuiz: any) => void;
}

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose, subjectId, onSuccess }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [count, setCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Vui lòng nhập chủ đề!");
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const newQuiz = await studentQuizApi.generateCustomQuiz({
        subjectId,
        topic,
        difficulty,
        count
      });
      onSuccess(newQuiz);
      onClose();
      setTopic('');
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Đã có lỗi xảy ra khi tạo đề. Vui lòng thử lại sau.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-on-surface">Nhờ AI tạo đề mới</h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 size={48} className="text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-on-surface mb-2">AI đang soạn đề thi...</h3>
              <p className="text-sm text-on-surface-variant text-center">
                Vui lòng chờ trong giây lát. Hệ thống đang tạo {count} câu hỏi môn {subjectId} về chủ đề "{topic}" với độ khó {difficulty}/5.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Môn học</label>
                <input 
                  type="text" 
                  value={subjectId} 
                  disabled 
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-surface-container-low text-on-surface-variant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Chủ đề cụ thể <span className="text-error">*</span></label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Đạo hàm, Tích phân, Di truyền..." 
                  className="w-full border border-outline focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 bg-surface-container-lowest outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Độ khó ({difficulty}/5)</label>
                <input 
                  type="range" 
                  min="1" max="5" 
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Dễ</span>
                  <span>Trung bình</span>
                  <span>Khó</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Số lượng câu hỏi ({count})</label>
                <input 
                  type="range" 
                  min="5" max="40" step="5"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isGenerating && (
          <div className="p-5 border-t border-outline-variant/30 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-on-surface hover:bg-surface-container transition"
            >
              Hủy
            </button>
            <button 
              onClick={handleGenerate}
              className="px-4 py-2 rounded-lg font-medium bg-primary text-on-primary hover:bg-primary/90 transition flex items-center gap-2"
            >
              <BrainCircuit size={18} />
              Tạo đề ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

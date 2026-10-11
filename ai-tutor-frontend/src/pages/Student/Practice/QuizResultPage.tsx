import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studentQuizApi, type QuizResult } from '../../../services/studentQuizApi';
import { getStoredSession } from '../../../services/authApi';
import './Quiz.css';

export function QuizResultPage() {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    studentQuizApi.getResult(attemptId).then(data => { if (!cancelled) {
      setResult(data); setError(''); window.dispatchEvent(new Event('student-profile-updated'));
    } })
      .catch(ex => { if (!cancelled) setError(ex.message); });
    return () => { cancelled = true; };
  }, [attemptId, retry]);
  async function retake() {
    if (!result) return;
    setLoading(true);
    try {
      const draft = await studentQuizApi.saveDraft(result.quizId, []);
      sessionStorage.setItem(`quiz-draft:${getStoredSession()?.user.userId}:${result.quizId}`, draft.draftId);
      navigate(`/student/quiz-attempt/${result.quizId}`, { state: { draftId: draft.draftId } });
    } catch (ex) { setError(ex instanceof Error ? ex.message : 'Không thể bắt đầu lại.'); }
    finally { setLoading(false); }
  }
  if (!result) return <div className="quiz-page"><p role="status">{error || 'Đang tải kết quả…'}</p>{error && <button onClick={() => setRetry(n => n + 1)}>Thử lại</button>}</div>;
  return <div className="quiz-page"><header className="quiz-heading"><div><p className="quiz-eyebrow">Kết quả luyện tập</p><h1>{result.quizTitle}</h1></div><Link to="/student/practice">Hoàn thành</Link></header>
    {error && <p className="quiz-error" role="alert">{error}</p>}
    <section className="quiz-card quiz-summary"><div><strong>{result.score.toFixed(1)} / 10</strong><span>Điểm bài làm</span></div><div><strong>{result.correctCount}/{result.totalQuestions}</strong><span>Đúng · {result.totalQuestions - result.correctCount} sai/bỏ trống</span></div><div><strong>+{result.xpEarned} XP</strong><span>Tổng {result.totalXp} XP · Level {result.currentLevel}</span></div><div><strong>{Math.floor(result.durationSeconds / 60)} phút {result.durationSeconds % 60} giây</strong><span>Thời gian làm bài</span></div></section>
    <p className="quiz-notice">XP chỉ được thưởng ở lần hoàn tất đầu tiên của mỗi đề. Bạn vẫn có thể làm lại để luyện tập.</p>
    {result.answers.map((answer, index) => {
      const correct = answer.isCorrect ?? answer.correct ?? false;
      const text = (key: string | null) => key ? (answer.options.find(option => option.key === key)?.content || key) : 'Chưa trả lời';
      return <section className={`quiz-card quiz-review ${correct ? 'quiz-review-correct' : 'quiz-review-wrong'}`} key={answer.questionId}><p className="quiz-eyebrow">Câu {index + 1} · {correct ? 'Đúng' : 'Sai / Chưa trả lời'}</p><h2 className="quiz-question">{answer.questionText}</h2><p>Đáp án của bạn: <strong>{text(answer.selectedOptionKey)}</strong></p><p className="quiz-correct-text">Đáp án đúng: <strong>{text(answer.correctOptionKey)}</strong></p><div className="quiz-explanation"><h3>Lời giải chi tiết</h3><p>{answer.explanation}</p></div></section>;
    })}
    <div className="quiz-navigation"><Link to="/student/practice">Hoàn thành</Link><button className="quiz-primary" disabled={loading} onClick={() => void retake()}>{loading ? 'Đang mở bài…' : 'Làm lại đề'}</button></div>
  </div>;
}

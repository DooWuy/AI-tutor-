import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { questionBankApi } from '../../services/assessmentApi';
import type { SkillItem } from '../../types/assessment';
import { subjectLabel } from '../../types/assessment';
import { ErrorBanner, Filters, useAssessmentBase } from './assessmentUi';

export default function QuestionBankPage() {
  const base = useAssessmentBase();
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    questionBankApi.listSkills(subject, grade)
      .then((data) => {
        if (active) setSkills(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được ngân hàng câu hỏi');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [subject, grade]);

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Ngân hàng câu hỏi</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Mỗi kỹ năng là một bài học trong giáo trình. Số câu chỉ tính câu đã nạp vào ngân hàng.</p>
      </div>
      <Filters subject={subject} grade={grade} onSubject={setSubject} onGrade={setGrade} />
      <ErrorBanner message={error} />
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải kỹ năng...</p> : null}
      {!loading && skills.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant p-6 text-sm text-on-surface-variant">Chưa có kỹ năng phù hợp bộ lọc.</p>
      ) : null}

      <div className="hidden overflow-hidden rounded-2xl border border-outline-variant md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-on-surface-variant">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã kỹ năng</th>
              <th className="px-4 py-3 font-semibold">Tên kỹ năng</th>
              <th className="px-4 py-3 font-semibold">Môn</th>
              <th className="px-4 py-3 font-semibold">Khối</th>
              <th className="px-4 py-3 font-semibold">Số câu hỏi</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.id} className="border-t border-outline-variant">
                <td className="px-4 py-3 font-medium">{skill.skillCode}</td>
                <td className="px-4 py-3">
                  <Link className="font-semibold text-primary hover:underline" to={`${base}/question-bank/${skill.id}`}>{skill.name}</Link>
                </td>
                <td className="px-4 py-3">{subjectLabel(skill.subject)}</td>
                <td className="px-4 py-3">Lớp {skill.gradeLevel}</td>
                <td className="px-4 py-3">{skill.questionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {skills.map((skill) => (
          <Link key={skill.id} to={`${base}/question-bank/${skill.id}`} className="block rounded-2xl border border-outline-variant p-4">
            <p className="text-xs text-on-surface-variant">{skill.skillCode} · {subjectLabel(skill.subject)} · Lớp {skill.gradeLevel}</p>
            <p className="mt-1 font-semibold text-on-surface">{skill.name}</p>
            <p className="mt-2 text-sm">{skill.questionCount} câu hỏi</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

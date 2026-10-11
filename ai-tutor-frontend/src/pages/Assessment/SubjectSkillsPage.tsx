import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { questionBankApi } from '../../services/assessmentApi';
import type { SkillItem } from '../../types/assessment';
import { ErrorBanner, useAssessmentBase } from './assessmentUi';
import { groupTitle } from './questionBankGroups';

export default function SubjectSkillsPage() {
  const base = useAssessmentBase();
  const params = useParams();
  const subject = decodeURIComponent(params.subject || '');
  const grade = decodeURIComponent(params.grade || '');
  const title = groupTitle(subject, grade);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    questionBankApi.listSkills(subject, grade)
      .then((data) => {
        if (!active) return;
        setSkills(data.filter((skill) => skill.subject === subject && skill.gradeLevel === grade));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được kỹ năng');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [subject, grade]);

  const visibleSkills = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return skills;
    return skills.filter((skill) => `${skill.skillCode} ${skill.name}`.toLowerCase().includes(needle));
  }, [keyword, skills]);

  return (
    <section className="space-y-5">
      <div>
        <Link className="text-sm text-primary hover:underline" to={`${base}/question-bank`}>Ngân hàng câu hỏi</Link>
        <h1 className="mt-1 text-2xl font-bold text-on-surface">{title}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {loading ? 'Đang tải kỹ năng...' : `${skills.length} kỹ năng. Chọn một kỹ năng để soạn câu hỏi.`}
        </p>
      </div>
      <label className="flex max-w-md flex-col gap-1 text-sm font-medium text-on-surface">
        Tìm kỹ năng
        <input
          className="rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm font-normal text-on-surface outline-none focus:border-primary"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Mã hoặc tên kỹ năng"
          aria-label={`Tìm kỹ năng ${title}`}
        />
      </label>
      <ErrorBanner message={error} />
      {!loading && visibleSkills.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant p-6 text-sm text-on-surface-variant">
          {skills.length === 0
            ? `Chưa có kỹ năng cho ${title}.`
            : `Không có kỹ năng khớp từ khóa trong ${title}.`}
        </p>
      ) : null}
      {visibleSkills.length > 0 ? (
        <ul className="divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface">
          {visibleSkills.map((skill) => (
            <li key={skill.id}>
              <Link
                to={`${base}/question-bank/${skill.id}`}
                className="flex items-start justify-between gap-3 px-4 py-4 hover:bg-surface-container"
              >
                <span className="min-w-0">
                  <span className="block text-xs text-on-surface-variant">{skill.skillCode}</span>
                  <span className="mt-1 block font-semibold text-primary">{skill.name}</span>
                </span>
                <span className="shrink-0 text-sm text-on-surface-variant">{skill.questionCount} câu</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

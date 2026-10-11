import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { questionBankApi } from '../../services/assessmentApi';
import type { SkillItem } from '../../types/assessment';
import { ErrorBanner, Field, Filters, SecondaryButton, inputClass, useAssessmentBase } from './assessmentUi';
import { groupSkills, groupTitle, questionTotal, skillSections, subjectGradePath, type SkillSort } from './questionBankGroups';

export default function QuestionBankPage() {
  const base = useAssessmentBase();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [sortBy, setSortBy] = useState<SkillSort>('subject');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');

  const downloadTemplate = async () => {
    setDownloading(true);
    setError('');
    try {
      await questionBankApi.downloadTemplate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được file mẫu');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    questionBankApi.listSkills()
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
  }, []);

  const sections = useMemo(() => {
    const filtered = skills.filter((skill) =>
      (!subject || skill.subject === subject) && (!grade || skill.gradeLevel === grade));
    return skillSections(groupSkills(filtered, sortBy), sortBy);
  }, [grade, skills, sortBy, subject]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Ngân hàng câu hỏi</h1>
          <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">
            Mỗi ô là một môn và một khối. Sách quét mục lục bằng OCR được xếp vào đúng ô của môn và khối đã chọn khi nhập sách.
          </p>
        </div>
        <SecondaryButton disabled={downloading} onClick={downloadTemplate}>Tải mẫu Excel</SecondaryButton>
      </div>
      <Filters
        subject={subject}
        grade={grade}
        onSubject={setSubject}
        onGrade={setGrade}
        extra={(
          <Field label="Sắp xếp">
            <select
              className={inputClass}
              value={sortBy}
              aria-label="Sắp xếp theo môn học hoặc khối"
              onChange={(event) => setSortBy(event.target.value as SkillSort)}
            >
              <option value="subject">Theo môn học</option>
              <option value="grade">Theo khối lớp</option>
            </select>
          </Field>
        )}
      />
      <ErrorBanner message={error} />
      {loading ? <p className="text-sm text-on-surface-variant">Đang tải kỹ năng...</p> : null}
      {!loading && sections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-outline-variant p-6 text-sm text-on-surface-variant">
          {skills.length === 0
            ? 'Chưa có kỹ năng. Hãy quét mục lục sách trong Tài liệu giảng dạy.'
            : 'Chưa có kỹ năng phù hợp bộ lọc.'}
        </p>
      ) : null}

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.key} aria-label={section.title} className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">{section.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.groups.map((group) => {
                const title = groupTitle(group.subject, group.gradeLevel);
                const questions = questionTotal(group.skills);
                return (
                  <Link
                    key={`${group.subject}-${group.gradeLevel}`}
                    to={subjectGradePath(base, group.subject, group.gradeLevel)}
                    className="rounded-2xl border border-outline-variant bg-surface p-5 transition hover:border-primary"
                    aria-label={`Mở ${title}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Môn và khối</p>
                    <h3 className="mt-2 text-xl font-bold text-on-surface">{title}</h3>
                    <p className="mt-3 text-sm text-on-surface-variant">
                      {group.skills.length} kỹ năng · {questions} câu hỏi
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

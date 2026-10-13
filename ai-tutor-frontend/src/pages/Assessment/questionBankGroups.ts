import type { SkillItem } from '../../types/assessment';
import { SUBJECTS, subjectLabel } from '../../types/assessment';

export type SkillSort = 'subject' | 'grade';

export type SkillGroup = {
  subject: string;
  gradeLevel: string;
  skills: SkillItem[];
};

function subjectRank(subject: string) {
  const index = SUBJECTS.findIndex((item) => item.value === subject);
  return index === -1 ? SUBJECTS.length : index;
}

export function groupTitle(subject: string, gradeLevel: string) {
  return `${subjectLabel(subject)} lớp ${gradeLevel}`;
}

export type SkillSection = {
  key: string;
  title: string;
  groups: SkillGroup[];
};

export function skillSections(groups: SkillGroup[], sortBy: SkillSort): SkillSection[] {
  const sections: SkillSection[] = [];
  for (const group of groups) {
    const key = sortBy === 'grade' ? `grade:${group.gradeLevel}` : `subject:${group.subject}`;
    const title = sortBy === 'grade' ? `Lớp ${group.gradeLevel}` : subjectLabel(group.subject);
    const last = sections[sections.length - 1];
    if (last && last.key === key) last.groups.push(group);
    else sections.push({ key, title, groups: [group] });
  }
  return sections;
}

export function groupSkills(skills: SkillItem[], sortBy: SkillSort): SkillGroup[] {
  const groups = new Map<string, SkillGroup>();
  for (const skill of skills) {
    const key = `${skill.subject}::${skill.gradeLevel}`;
    const current = groups.get(key);
    if (current) current.skills.push(skill);
    else groups.set(key, { subject: skill.subject, gradeLevel: skill.gradeLevel, skills: [skill] });
  }
  return [...groups.values()].sort((left, right) => {
    const bySubject = subjectRank(left.subject) - subjectRank(right.subject) || left.subject.localeCompare(right.subject);
    const byGrade = Number(left.gradeLevel) - Number(right.gradeLevel);
    if (sortBy === 'grade') return byGrade || bySubject;
    return bySubject || byGrade;
  });
}

export function questionTotal(skills: SkillItem[]) {
  return skills.reduce((sum, skill) => sum + skill.questionCount, 0);
}

export function subjectGradePath(base: string, subject: string, gradeLevel: string) {
  return `${base}/question-bank/${encodeURIComponent(subject)}/${encodeURIComponent(gradeLevel)}`;
}

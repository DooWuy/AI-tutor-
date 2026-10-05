package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.analytics.AlertThresholds;
import com.vn.aitutor.analytics.AtRiskClassifier;
import com.vn.aitutor.analytics.KpiCalculator;
import com.vn.aitutor.analytics.ParentMessageComposer;
import com.vn.aitutor.dto.response.analytics.AppliedFiltersDto;
import com.vn.aitutor.dto.response.analytics.AtRiskListResponse;
import com.vn.aitutor.dto.response.analytics.AtRiskStudentDto;
import com.vn.aitutor.dto.response.analytics.ParentMessageDraftResponse;
import com.vn.aitutor.entity.ClassAlertSetting;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.RiskLevel;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.ClassAlertSettingRepository;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.projection.StudentScoreRow;
import com.vn.aitutor.repository.projection.TopicAnswerCountRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.AnalyticsAccess;
import com.vn.aitutor.service.IAtRiskService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AtRiskServiceImpl implements IAtRiskService {

    private final AnalyticsAccess analyticsAccess;
    private final AcademicCalendar academicCalendar;
    private final StudentRepository studentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAttemptAnswerRepository answerRepository;
    private final ClassAlertSettingRepository alertSettingRepository;

    @Override
    public AtRiskListResponse list(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        return listClass(schoolClass, subject, period, from, to);
    }

    @Override
    public int[] countLevels(SchoolClass schoolClass) {
        AtRiskListResponse response = listClass(schoolClass, SubjectCode.ALL, ReportPeriod.LAST_7_DAYS, null, null);
        return counts(response.getStudents());
    }

    @Override
    public ParentMessageDraftResponse draft(
            UserPrincipal principal,
            UUID studentId,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        AtRiskStudentDto assessed = requireStudent(schoolClass, studentId, subject, period, from, to);
        String teacherName = principal.getUsers() == null ? null : principal.getUsers().getFullName();
        String body = ParentMessageComposer.compose(
                templateOf(schoolClass.getId()),
                assessed.getFullName(),
                assessed.getInactiveDays(),
                assessed.getAverageScore(),
                assessed.getSubjects(),
                assessed.getGapTopics(),
                teacherName,
                schoolClass.getSchoolName());
        return ParentMessageDraftResponse.builder()
                .studentId(studentId)
                .fullName(assessed.getFullName())
                .inactiveDays(assessed.getInactiveDays())
                .averageScore(assessed.getAverageScore())
                .gapTopics(assessed.getGapTopics())
                .subjects(assessed.getSubjects())
                .body(body)
                .minLength(ParentMessageComposer.MIN_LENGTH)
                .maxLength(ParentMessageComposer.MAX_LENGTH)
                .build();
    }

    @Override
    public AtRiskStudentDto requireStudent(
            SchoolClass schoolClass,
            UUID studentId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        return assess(schoolClass, subject, period, from, to).stream()
                .filter(student -> studentId.equals(student.getStudentId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Học sinh không thuộc lớp này"));
    }

    private AtRiskListResponse listClass(
            SchoolClass schoolClass, String subject, ReportPeriod period, LocalDate from, LocalDate to) {
        ResolvedScope scope = resolve(subject, period, from, to);
        List<AtRiskStudentDto> flagged = assess(schoolClass, subject, period, from, to).stream()
                .filter(student -> student.getLevel() != null)
                .sorted(Comparator.comparingInt((AtRiskStudentDto student) -> student.getLevel() == RiskLevel.RED ? 0 : 1)
                        .thenComparing(AtRiskStudentDto::getFullName, Comparator.nullsLast(String::compareTo)))
                .toList();
        return AtRiskListResponse.builder()
                .filters(AppliedFiltersDto.builder()
                        .classId(schoolClass.getId())
                        .className(schoolClass.getName())
                        .subject(scope.subjectCode())
                        .period(scope.period().name())
                        .from(scope.range().from())
                        .to(scope.range().to())
                        .build())
                .evaluatedAt(Instant.now())
                .students(flagged)
                .build();
    }

    private List<AtRiskStudentDto> assess(
            SchoolClass schoolClass, String subject, ReportPeriod period, LocalDate from, LocalDate to) {
        ResolvedScope scope = resolve(subject, period, from, to);
        AlertThresholds thresholds = thresholdsOf(schoolClass.getId());
        Instant now = Instant.now();
        Map<UUID, StudentScoreRow> scores = new HashMap<>();
        List<StudentScoreRow> scoreRows = quizAttemptRepository.studentScores(
                schoolClass.getId(), scope.range().from(), scope.range().to(), scope.subjectFilter());
        if (scoreRows != null) {
            for (StudentScoreRow row : scoreRows) {
                if (row.getStudentId() != null) {
                    scores.put(row.getStudentId(), row);
                }
            }
        }
        Map<UUID, Map<String, GapTally>> gaps = gapTallies(
                schoolClass.getId(), scope.range().from(), scope.range().to(), scope.subjectFilter());

        List<AtRiskStudentDto> result = new ArrayList<>();
        for (Student student : activeStudents(schoolClass.getId())) {
            StudentScoreRow score = scores.get(student.getId());
            BigDecimal average = score == null
                    ? null
                    : KpiCalculator.averageScore(score.getScoreSum() == null ? 0d : score.getScoreSum(), score.getAttemptCount());
            if (score != null && score.getAttemptCount() <= 0) {
                average = null;
            }
            Instant lastActivity = student.getLastActivityDate();
            Integer inactiveDays = KpiCalculator.inactivityDays(lastActivity, now, academicCalendar.zoneId());
            Map<String, GapTally> studentGaps = gaps.getOrDefault(student.getId(), Map.of());
            List<String> topics = new ArrayList<>();
            Set<String> subjects = new LinkedHashSet<>();
            for (GapTally tally : studentGaps.values()) {
                if (tally.wrong > tally.correct) {
                    topics.add(tally.topic);
                    subjects.add(subjectLabel(tally.subject));
                }
            }
            topics.sort(String::compareTo);
            AtRiskClassifier.RiskResult risk =
                    AtRiskClassifier.classify(average, inactiveDays, topics.size(), thresholds);
            User user = student.getUser();
            result.add(AtRiskStudentDto.builder()
                    .studentId(student.getId())
                    .studentCode(student.getStudentCode())
                    .fullName(user == null ? null : user.getFullName())
                    .averageScore(average)
                    .inactiveDays(inactiveDays)
                    .gapTopicCount(topics.size())
                    .gapTopics(List.copyOf(topics))
                    .subjects(List.copyOf(subjects))
                    .level(risk.level())
                    .reasons(risk.reasons())
                    .build());
        }
        return result;
    }

    private Map<UUID, Map<String, GapTally>> gapTallies(
            UUID classId, Instant from, Instant to, String subjectFilter) {
        Map<UUID, Map<String, GapTally>> byStudent = new HashMap<>();
        List<TopicAnswerCountRow> rows =
                answerRepository.aggregateTopicAnswers(classId, from, to, subjectFilter);
        if (rows == null) {
            return byStudent;
        }
        for (TopicAnswerCountRow row : rows) {
            if (row.getStudentId() == null || row.getTopic() == null || row.getTopic().isBlank()) {
                continue;
            }
            String subject = row.getSubject() == null ? "" : row.getSubject();
            String key = subject + "\n" + row.getTopic().trim();
            Map<String, GapTally> topics =
                    byStudent.computeIfAbsent(row.getStudentId(), ignored -> new LinkedHashMap<>());
            GapTally tally = topics.computeIfAbsent(key, ignored -> new GapTally(row.getTopic().trim(), subject));
            long amount = Math.max(0, row.getAnswerCount());
            if (Boolean.TRUE.equals(row.getCorrect())) {
                tally.correct += amount;
            } else {
                tally.wrong += amount;
            }
        }
        return byStudent;
    }

    private List<Student> activeStudents(UUID classId) {
        List<Student> students = studentRepository.findWithUserByClassId(classId);
        if (students == null) {
            return List.of();
        }
        return students.stream().filter(this::isActive).toList();
    }

    private boolean isActive(Student student) {
        User user = student.getUser();
        return user != null && user.isActive() && !user.isDeleted();
    }

    private int[] counts(List<AtRiskStudentDto> students) {
        int red = 0;
        int orange = 0;
        for (AtRiskStudentDto student : students) {
            if (student.getLevel() == RiskLevel.RED) {
                red++;
            } else if (student.getLevel() == RiskLevel.ORANGE) {
                orange++;
            }
        }
        return new int[] {red, orange};
    }

    private AlertThresholds thresholdsOf(UUID classId) {
        return alertSettingRepository
                .findById(classId)
                .map(setting -> new AlertThresholds(
                        setting.getScoreThreshold(), setting.getInactivityDays(), setting.getMaxGapTopics()))
                .orElse(AlertThresholds.defaults());
    }

    private String templateOf(UUID classId) {
        return alertSettingRepository
                .findById(classId)
                .map(ClassAlertSetting::getMessageTemplate)
                .orElse(null);
    }

    private String subjectLabel(String code) {
        if (code == null || code.isBlank()) {
            return "chưa rõ môn";
        }
        try {
            return SubjectCode.valueOf(code).getDisplayName();
        } catch (IllegalArgumentException ex) {
            return code;
        }
    }

    private ResolvedScope resolve(String subject, ReportPeriod period, LocalDate from, LocalDate to) {
        ReportPeriod resolved = period == null ? ReportPeriod.LAST_7_DAYS : period;
        String subjectFilter = SubjectCode.normalizeFilter(subject);
        String subjectCode = subjectFilter == null ? SubjectCode.ALL : subjectFilter;
        AcademicCalendar.DateRange range = academicCalendar.resolve(resolved, from, to, Instant.now());
        return new ResolvedScope(subjectFilter, subjectCode, resolved, range);
    }

    private record ResolvedScope(
            String subjectFilter, String subjectCode, ReportPeriod period, AcademicCalendar.DateRange range) {}

    private static final class GapTally {
        private final String topic;
        private final String subject;
        private long wrong;
        private long correct;

        private GapTally(String topic, String subject) {
            this.topic = topic;
            this.subject = subject;
        }
    }
}

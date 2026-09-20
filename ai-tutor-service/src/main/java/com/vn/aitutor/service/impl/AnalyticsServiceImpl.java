package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.analytics.KpiCalculator;
import com.vn.aitutor.dto.response.analytics.AnalyticsFiltersResponse;
import com.vn.aitutor.dto.response.analytics.AppliedFiltersDto;
import com.vn.aitutor.dto.response.analytics.ClassOptionDto;
import com.vn.aitutor.dto.response.analytics.DashboardSummaryResponse;
import com.vn.aitutor.dto.response.analytics.KpiMetricsDto;
import com.vn.aitutor.dto.response.analytics.ScoreTrendPoint;
import com.vn.aitutor.dto.response.analytics.StudyTimePoint;
import com.vn.aitutor.dto.response.analytics.SubjectOptionDto;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Teacher;
import com.vn.aitutor.entity.TeacherClassAssignment;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.ChatSessionRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.TeacherClassAssignmentRepository;
import com.vn.aitutor.repository.TeacherRepository;
import com.vn.aitutor.repository.projection.DaySecondsRow;
import com.vn.aitutor.repository.projection.ScoreSumCountRow;
import com.vn.aitutor.repository.projection.StudentScoreRow;
import com.vn.aitutor.repository.projection.WeeklyScoreRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAnalyticsService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements IAnalyticsService {

    private static final String[] WEEKDAY_LABELS = {"", "T2", "T3", "T4", "T5", "T6", "T7", "CN"};

    private final AcademicCalendar academicCalendar;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherClassAssignmentRepository assignmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ChatSessionRepository chatSessionRepository;

    @Override
    public AnalyticsFiltersResponse getFilters(UserPrincipal principal) {
        User user = principal.getUsers();
        List<ClassOptionDto> classes;
        Set<SubjectCode> allowedSubjects;

        if (user.getRole() == Role.ADMIN) {
            classes = schoolClassRepository.findAllOrdered().stream()
                    .map(c -> ClassOptionDto.builder()
                            .id(c.getId())
                            .name(c.getName())
                            .gradeLevel(c.getGradeLevel())
                            .homeroom(false)
                            .build())
                    .toList();
            allowedSubjects = EnumSet.allOf(SubjectCode.class);
        } else {
            Teacher teacher = requireTeacher(user.getId());
            List<TeacherClassAssignment> assignments = assignmentRepository.findByTeacherIdWithClass(teacher.getId());
            Map<UUID, ClassOptionDto> byClass = new LinkedHashMap<>();
            boolean seesAllSubjects = false;
            EnumSet<SubjectCode> assignedSubjects = EnumSet.noneOf(SubjectCode.class);
            for (TeacherClassAssignment assignment : assignments) {
                SchoolClass schoolClass = assignment.getSchoolClass();
                ClassOptionDto existing = byClass.get(schoolClass.getId());
                boolean homeroom = assignment.isHomeroom() || (existing != null && existing.isHomeroom());
                byClass.put(
                        schoolClass.getId(),
                        ClassOptionDto.builder()
                                .id(schoolClass.getId())
                                .name(schoolClass.getName())
                                .gradeLevel(schoolClass.getGradeLevel())
                                .homeroom(homeroom)
                                .build());
                if (assignment.getSubject() == null || assignment.isHomeroom()) {
                    seesAllSubjects = true;
                } else if (SubjectCode.isKnown(assignment.getSubject()) && !SubjectCode.isAll(assignment.getSubject())) {
                    assignedSubjects.add(SubjectCode.parseRequired(assignment.getSubject()));
                }
            }
            classes = byClass.values().stream()
                    .sorted(Comparator.comparing(ClassOptionDto::isHomeroom)
                            .reversed()
                            .thenComparing(ClassOptionDto::getName))
                    .toList();
            allowedSubjects = seesAllSubjects || assignedSubjects.isEmpty()
                    ? EnumSet.allOf(SubjectCode.class)
                    : assignedSubjects;
        }

        List<SubjectOptionDto> subjects = new ArrayList<>();
        subjects.add(SubjectOptionDto.builder().code(SubjectCode.ALL).name("Tất cả môn học").build());
        allowedSubjects.stream()
                .sorted(Comparator.comparing(Enum::name))
                .forEach(code -> subjects.add(SubjectOptionDto.builder()
                        .code(code.name())
                        .name(code.getDisplayName())
                        .build()));

        UUID defaultClassId = classes.stream()
                .filter(ClassOptionDto::isHomeroom)
                .map(ClassOptionDto::getId)
                .findFirst()
                .orElseGet(() -> classes.isEmpty() ? null : classes.get(0).getId());

        return AnalyticsFiltersResponse.builder()
                .classes(classes)
                .subjects(subjects)
                .defaultClassId(defaultClassId)
                .defaultPeriod(ReportPeriod.LAST_7_DAYS.name())
                .build();
    }

    @Override
    public DashboardSummaryResponse getSummary(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        SchoolClass schoolClass = schoolClassRepository
                .findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lớp học"));
        assertCanReadClass(principal, classId);

        String subjectFilter = SubjectCode.normalizeFilter(subject);
        ReportPeriod resolvedPeriod = period == null ? ReportPeriod.LAST_7_DAYS : period;
        Instant now = Instant.now();
        AcademicCalendar.DateRange range = academicCalendar.resolve(resolvedPeriod, from, to, now);

        int studentCount = (int) studentRepository.countActiveByClassId(classId);

        ScoreSumCountRow scoreRow = quizAttemptRepository.sumScores(
                classId, range.from(), range.to(), subjectFilter);
        double scoreSum = scoreRow == null || scoreRow.getScoreSum() == null ? 0d : scoreRow.getScoreSum();
        long attemptCount = scoreRow == null ? 0L : scoreRow.getAttemptCount();
        BigDecimal averageScore = KpiCalculator.averageScore(scoreSum, attemptCount);

        long quizSeconds = nz(quizAttemptRepository.sumQuizDurationSeconds(
                classId, range.from(), range.to(), subjectFilter));
        long chatSeconds = nz(chatSessionRepository.sumCappedChatSeconds(
                classId, range.from(), range.to(), subjectFilter));
        double weeks = AcademicCalendar.weeksInPeriod(range.fromDate(), range.toDate());
        BigDecimal avgStudyHours = KpiCalculator.averageStudyHoursPerWeek(
                quizSeconds + chatSeconds, studentCount, weeks);

        int atRiskCount = countAtRisk(
                quizAttemptRepository.studentScores(classId, range.from(), range.to(), subjectFilter), now);

        List<ScoreTrendPoint> scoreTrend = buildScoreTrend(
                quizAttemptRepository.weeklyScores(classId, range.from(), range.to(), subjectFilter),
                range.fromDate(),
                range.toDate());

        List<StudyTimePoint> studyTime = buildStudyTimeBars(
                quizAttemptRepository.quizSecondsByWeekday(classId, range.from(), range.to(), subjectFilter),
                chatSessionRepository.chatSecondsByWeekday(classId, range.from(), range.to(), subjectFilter),
                studentCount,
                range.fromDate(),
                range.toDate());

        String subjectCode = subjectFilter == null ? SubjectCode.ALL : subjectFilter;

        return DashboardSummaryResponse.builder()
                .filters(AppliedFiltersDto.builder()
                        .classId(schoolClass.getId())
                        .className(schoolClass.getName())
                        .subject(subjectCode)
                        .period(resolvedPeriod.name())
                        .from(range.from())
                        .to(range.to())
                        .build())
                .kpis(KpiMetricsDto.builder()
                        .studentCount(studentCount)
                        .quizAttemptCount(attemptCount)
                        .averageQuizScore(averageScore)
                        .averageStudyHoursPerWeek(avgStudyHours)
                        .atRiskStudentCount(atRiskCount)
                        .build())
                .scoreTrend(scoreTrend)
                .studyTimeByWeekday(studyTime)
                .build();
    }

    private int countAtRisk(List<StudentScoreRow> rows, Instant now) {
        int count = 0;
        for (StudentScoreRow row : rows) {
            BigDecimal studentAvg = row.getAttemptCount() > 0 && row.getScoreSum() != null
                    ? KpiCalculator.averageScore(row.getScoreSum(), row.getAttemptCount())
                    : null;
            Integer inactiveDays = KpiCalculator.inactivityDays(
                    row.getLastActivityDate(), now, academicCalendar.zoneId());
            if (KpiCalculator.isAtRisk(studentAvg, inactiveDays)) {
                count++;
            }
        }
        return count;
    }

    private List<ScoreTrendPoint> buildScoreTrend(List<WeeklyScoreRow> rows, LocalDate fromDate, LocalDate toDate) {
        Map<LocalDate, WeeklyScoreRow> byWeek = rows.stream()
                .filter(row -> row.getWeekStart() != null)
                .collect(Collectors.toMap(WeeklyScoreRow::getWeekStart, row -> row, (a, b) -> a, LinkedHashMap::new));

        LocalDate cursor = AcademicCalendar.mondayOf(fromDate);
        LocalDate last = AcademicCalendar.mondayOf(toDate);
        List<ScoreTrendPoint> points = new ArrayList<>();
        for (LocalDate week = cursor; !week.isAfter(last); week = week.plusWeeks(1)) {
            WeeklyScoreRow row = byWeek.get(week);
            if (row == null || row.getAttemptCount() == 0) {
                points.add(ScoreTrendPoint.builder()
                        .weekStart(week)
                        .averageScore(null)
                        .attemptCount(0)
                        .build());
            } else {
                double sum = row.getScoreSum() == null ? 0d : row.getScoreSum();
                points.add(ScoreTrendPoint.builder()
                        .weekStart(week)
                        .averageScore(KpiCalculator.averageScore(sum, row.getAttemptCount()))
                        .attemptCount(row.getAttemptCount())
                        .build());
            }
        }
        return points;
    }

    private List<StudyTimePoint> buildStudyTimeBars(
            List<DaySecondsRow> quizDays,
            List<DaySecondsRow> chatDays,
            int studentCount,
            LocalDate fromDate,
            LocalDate toDate) {
        long[] seconds = new long[8];
        addSeconds(seconds, quizDays);
        addSeconds(seconds, chatDays);

        List<StudyTimePoint> points = new ArrayList<>();
        for (int dow = 1; dow <= 7; dow++) {
            long occurrences = AcademicCalendar.countIsoDayOfWeek(fromDate, toDate, dow);
            points.add(StudyTimePoint.builder()
                    .dayOfWeek(dow)
                    .label(WEEKDAY_LABELS[dow])
                    .averageHours(KpiCalculator.weekdayAverageHours(seconds[dow], studentCount, occurrences))
                    .build());
        }
        return points;
    }

    private void addSeconds(long[] target, List<DaySecondsRow> rows) {
        if (rows == null) {
            return;
        }
        for (DaySecondsRow row : rows) {
            int dow = row.getDayOfWeek();
            if (dow >= 1 && dow <= 7) {
                target[dow] += row.getTotalSeconds();
            }
        }
    }

    private void assertCanReadClass(UserPrincipal principal, UUID classId) {
        User user = principal.getUsers();
        if (user.getRole() == Role.ADMIN) {
            return;
        }
        Teacher teacher = requireTeacher(user.getId());
        if (!assignmentRepository.existsByTeacher_IdAndSchoolClass_Id(teacher.getId(), classId)) {
            throw new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này");
        }
    }

    private Teacher requireTeacher(UUID userId) {
        return teacherRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceForbiddenException("Tài khoản không gắn với hồ sơ giáo viên"));
    }

    private long nz(Long value) {
        return value == null ? 0L : value;
    }
}

package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.analytics.KnowledgeGapCalculator;
import com.vn.aitutor.analytics.RankedGap;
import com.vn.aitutor.analytics.StudentTopicCount;
import com.vn.aitutor.analytics.TopicText;
import com.vn.aitutor.dto.response.analytics.AppliedFiltersDto;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapItemDto;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.projection.ChatSnippetRow;
import com.vn.aitutor.repository.projection.TopicAnswerCountRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.AnalyticsAccess;
import com.vn.aitutor.service.ai.GapAdviceRequest;
import com.vn.aitutor.service.ai.PedagogyAdvisor;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KnowledgeGapService {

    private static final int MAX_EXCERPTS = 8;
    private static final int EXCERPT_CHARS = 240;

    private final AnalyticsAccess analyticsAccess;
    private final AcademicCalendar academicCalendar;
    private final StudentRepository studentRepository;
    private final QuizAttemptAnswerRepository answerRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PedagogyAdvisor pedagogyAdvisor;

    public KnowledgeGapsResponse getGaps(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        ResolvedScope scope = resolve(subject, period, from, to);
        int classSize = (int) studentRepository.countActiveByClassId(classId);
        List<RankedGap> ranked = rank(classId, scope, classSize);
        List<ChatSnippetRow> messages = messages(classId, scope);
        Map<String, Integer> asking = askingCounts(ranked, messages);
        List<GapAdviceRequest> requests = adviceRequests(ranked, asking, messages, classSize);
        Map<String, String> advice = requests.isEmpty() ? Map.of() : pedagogyAdvisor.advise(requests);

        List<KnowledgeGapItemDto> items = new ArrayList<>();
        int rank = 1;
        for (RankedGap gap : ranked) {
            items.add(KnowledgeGapItemDto.builder()
                    .rank(rank++)
                    .topic(gap.topic())
                    .subject(gap.subject())
                    .affectedStudentCount(gap.affectedStudentCount())
                    .affectedPercent(gap.affectedPercent())
                    .wrongAnswerCount(gap.wrongAnswerCount())
                    .correctAnswerCount(gap.correctAnswerCount())
                    .askingStudentCount(asking.getOrDefault(gapKey(gap), 0))
                    .advice(advice.getOrDefault(gap.topic(), ""))
                    .build());
        }
        return KnowledgeGapsResponse.builder()
                .filters(filters(schoolClass, scope))
                .classSize(classSize)
                .analyzedAt(Instant.now())
                .gaps(items)
                .build();
    }

    public int countRankedTopics(UUID classId) {
        ResolvedScope scope = resolve(SubjectCode.ALL, ReportPeriod.LAST_7_DAYS, null, null);
        int classSize = (int) studentRepository.countActiveByClassId(classId);
        return rank(classId, scope, classSize).size();
    }

    private List<RankedGap> rank(UUID classId, ResolvedScope scope, int classSize) {
        List<TopicAnswerCountRow> rows = answerRepository.aggregateTopicAnswers(
                classId, scope.range().from(), scope.range().to(), scope.subjectFilter());
        Map<String, long[]> totals = new LinkedHashMap<>();
        Map<String, StudentTopicCount> identity = new LinkedHashMap<>();
        if (rows != null) {
            for (TopicAnswerCountRow row : rows) {
                if (row.getTopic() == null || row.getStudentId() == null) {
                    continue;
                }
                String subject = row.getSubject() == null ? "" : row.getSubject();
                String key = subject + "\n" + row.getTopic() + "\n" + row.getStudentId();
                long[] counts = totals.computeIfAbsent(key, ignored -> new long[2]);
                long amount = Math.max(0, row.getAnswerCount());
                if (Boolean.TRUE.equals(row.getCorrect())) {
                    counts[1] += amount;
                } else {
                    counts[0] += amount;
                }
                identity.putIfAbsent(
                        key, new StudentTopicCount(row.getTopic(), subject, row.getStudentId(), 0, 0));
            }
        }
        List<StudentTopicCount> counts = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : totals.entrySet()) {
            StudentTopicCount base = identity.get(entry.getKey());
            long[] pair = entry.getValue();
            counts.add(new StudentTopicCount(base.topic(), base.subject(), base.studentId(), pair[0], pair[1]));
        }
        return KnowledgeGapCalculator.rank(classSize, counts);
    }

    private List<ChatSnippetRow> messages(UUID classId, ResolvedScope scope) {
        List<ChatSnippetRow> rows = chatMessageRepository.findStudentMessages(
                classId, scope.range().from(), scope.range().to(), scope.subjectFilter());
        return rows == null ? List.of() : rows;
    }

    private Map<String, Integer> askingCounts(List<RankedGap> ranked, List<ChatSnippetRow> messages) {
        Map<String, java.util.Set<UUID>> students = new LinkedHashMap<>();
        for (RankedGap gap : ranked) {
            students.put(gapKey(gap), new java.util.LinkedHashSet<>());
        }
        for (ChatSnippetRow message : messages) {
            if (message.getStudentId() == null || message.getContent() == null) {
                continue;
            }
            for (RankedGap gap : ranked) {
                if (TopicText.containsTopic(message.getContent(), gap.topic())) {
                    students.get(gapKey(gap)).add(message.getStudentId());
                }
            }
        }
        Map<String, Integer> counts = new LinkedHashMap<>();
        students.forEach((key, ids) -> counts.put(key, ids.size()));
        return counts;
    }

    private List<GapAdviceRequest> adviceRequests(
            List<RankedGap> ranked,
            Map<String, Integer> asking,
            List<ChatSnippetRow> messages,
            int classSize) {
        List<GapAdviceRequest> requests = new ArrayList<>();
        int remaining = MAX_EXCERPTS;
        for (RankedGap gap : ranked) {
            List<String> excerpts = new ArrayList<>();
            for (ChatSnippetRow message : messages) {
                if (remaining <= 0 || excerpts.size() == 3) {
                    break;
                }
                if (TopicText.containsTopic(message.getContent(), gap.topic())) {
                    excerpts.add(TopicText.clip(message.getContent(), EXCERPT_CHARS));
                    remaining--;
                }
            }
            requests.add(new GapAdviceRequest(
                    gap.topic(),
                    gap.subject(),
                    gap.affectedPercent(),
                    gap.affectedStudentCount(),
                    classSize,
                    gap.wrongAnswerCount(),
                    asking.getOrDefault(gapKey(gap), 0),
                    excerpts));
        }
        return requests;
    }

    private ResolvedScope resolve(String subject, ReportPeriod period, LocalDate from, LocalDate to) {
        ReportPeriod resolved = period == null ? ReportPeriod.LAST_7_DAYS : period;
        String subjectFilter = SubjectCode.normalizeFilter(subject);
        String subjectCode = subjectFilter == null ? SubjectCode.ALL : subjectFilter;
        AcademicCalendar.DateRange range = academicCalendar.resolve(resolved, from, to, Instant.now());
        return new ResolvedScope(subjectFilter, subjectCode, resolved, range);
    }

    private AppliedFiltersDto filters(SchoolClass schoolClass, ResolvedScope scope) {
        return AppliedFiltersDto.builder()
                .classId(schoolClass.getId())
                .className(schoolClass.getName())
                .subject(scope.subjectCode())
                .period(scope.period().name())
                .from(scope.range().from())
                .to(scope.range().to())
                .build();
    }

    private String gapKey(RankedGap gap) {
        return gap.subject() + "\n" + gap.topic();
    }

    private record ResolvedScope(
            String subjectFilter, String subjectCode, ReportPeriod period, AcademicCalendar.DateRange range) {}
}

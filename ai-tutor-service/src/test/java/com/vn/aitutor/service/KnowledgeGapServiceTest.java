package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapItemDto;
import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.ChatMessageRepository;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.repository.projection.ChatSnippetRow;
import com.vn.aitutor.repository.projection.TopicAnswerCountRow;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.ai.GapAdviceRequest;
import com.vn.aitutor.service.ai.PedagogyAdvisor;
import com.vn.aitutor.service.impl.KnowledgeGapService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class KnowledgeGapServiceTest {

    @Mock
    private AnalyticsAccess analyticsAccess;

    @Mock
    private AcademicCalendar academicCalendar;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private QuizAttemptAnswerRepository answerRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private PedagogyAdvisor pedagogyAdvisor;

    @InjectMocks
    private KnowledgeGapService knowledgeGapService;

    @Test
    void ac02FixtureRanksConeFirstAndIgnoresInventedTopics() {
        UUID classId = UUID.randomUUID();
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setName("12A1");
        schoolClass.setSchoolName("THPT AI Tutor");
        UserPrincipal principal = principal();

        List<UUID> students = new ArrayList<>();
        List<TopicAnswerCountRow> answers = new ArrayList<>();
        List<ChatSnippetRow> messages = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            UUID studentId = UUID.randomUUID();
            students.add(studentId);
            answers.add(answer("Thể tích hình nón", "TOAN", studentId, i >= 30, 2));
            if (i < 4) {
                answers.add(answer("Tiệm cận", "TOAN", studentId, false, 2));
            }
            if (i < 30) {
                messages.add(snippet(studentId, "Em chưa hiểu thể tích hình nón"));
            }
        }

        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(academicCalendar.resolve(any(), any(), any(), any()))
                .thenReturn(new AcademicCalendar.DateRange(
                        Instant.parse("2026-09-15T17:00:00Z"),
                        Instant.parse("2026-09-22T16:59:59Z"),
                        LocalDate.of(2026, 9, 16),
                        LocalDate.of(2026, 9, 22)));
        when(studentRepository.countActiveByClassId(classId)).thenReturn(40L);
        when(answerRepository.aggregateTopicAnswers(eq(classId), any(), any(), isNull())).thenReturn(answers);
        when(chatMessageRepository.findStudentMessages(eq(classId), any(), any(), isNull())).thenReturn(messages);
        when(pedagogyAdvisor.advise(any())).thenAnswer(invocation -> {
            List<GapAdviceRequest> requests = invocation.getArgument(0);
            assertEquals("Thể tích hình nón", requests.get(0).topic());
            Map<String, String> advice = new LinkedHashMap<>();
            advice.put("Thể tích hình nón", "Nên chữa bài mẫu hình nón.");
            advice.put("Chủ đề bịa", "bỏ");
            return advice;
        });

        KnowledgeGapsResponse response = knowledgeGapService.getGaps(
                principal, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null);

        assertEquals(40, response.getClassSize());
        assertEquals(2, response.getGaps().size());
        KnowledgeGapItemDto first = response.getGaps().get(0);
        assertEquals(1, first.getRank());
        assertEquals("Thể tích hình nón", first.getTopic());
        assertEquals(30, first.getAffectedStudentCount());
        assertEquals(30, first.getAskingStudentCount());
        assertEquals(0, first.getAffectedPercent().compareTo(new BigDecimal("75.0")));
        assertEquals("Nên chữa bài mẫu hình nón.", first.getAdvice());
        assertEquals("Tiệm cận", response.getGaps().get(1).getTopic());
        assertEquals(10.0, response.getGaps().get(1).getAffectedPercent().doubleValue(), 0.001);
    }

    @Test
    void forbiddenClassIsRejectedBeforeAnalysis() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal();
        when(analyticsAccess.requireReadableClass(principal, classId))
                .thenThrow(new ResourceForbiddenException("no"));

        assertThrows(
                ResourceForbiddenException.class,
                () -> knowledgeGapService.getGaps(principal, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
    }

    private static TopicAnswerCountRow answer(
            String topic, String subject, UUID studentId, boolean correct, long count) {
        return new TopicAnswerCountRow() {
            @Override
            public String getTopic() {
                return topic;
            }

            @Override
            public String getSubject() {
                return subject;
            }

            @Override
            public UUID getStudentId() {
                return studentId;
            }

            @Override
            public Boolean getCorrect() {
                return correct;
            }

            @Override
            public long getAnswerCount() {
                return count;
            }
        };
    }

    private static ChatSnippetRow snippet(UUID studentId, String content) {
        return new ChatSnippetRow() {
            @Override
            public UUID getStudentId() {
                return studentId;
            }

            @Override
            public String getContent() {
                return content;
            }
        };
    }

    private static UserPrincipal principal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        user.setFullName("Nguyễn Thị Giáo");
        return UserPrincipal.builder().users(user).build();
    }
}

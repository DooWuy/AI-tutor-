package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.ClassAlertSettingRepository;
import com.vn.aitutor.repository.QuizAttemptAnswerRepository;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.impl.AtRiskService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AtRiskServiceTest {

    @Mock
    private AnalyticsAccess analyticsAccess;

    @Mock
    private AcademicCalendar academicCalendar;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private QuizAttemptAnswerRepository answerRepository;

    @Mock
    private ClassAlertSettingRepository alertSettingRepository;

    @InjectMocks
    private AtRiskService atRiskService;

    @Test
    void studentAndUnassignedTeacherAreRejected() {
        UUID classId = UUID.randomUUID();
        UserPrincipal teacher = principal(Role.TEACHER);
        when(analyticsAccess.requireReadableClass(teacher, classId))
                .thenThrow(new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này"));

        assertThrows(
                ResourceForbiddenException.class,
                () -> atRiskService.list(teacher, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
        assertThrows(
                ResourceForbiddenException.class,
                () -> atRiskService.draft(
                        teacher, UUID.randomUUID(), classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
    }

    private static UserPrincipal principal(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(role);
        user.setFullName("Nguyễn Thị Giáo");
        return UserPrincipal.builder().users(user).build();
    }
}

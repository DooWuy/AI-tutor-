package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.vn.aitutor.analytics.AcademicCalendar;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceForbiddenException;
import com.vn.aitutor.repository.QuizAttemptRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAnalyticsService;
import com.vn.aitutor.service.impl.KnowledgeGapService;
import com.vn.aitutor.service.impl.ReportExportService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportExportServiceTest {

    @Mock
    private AnalyticsAccess analyticsAccess;

    @Mock
    private IAnalyticsService analyticsService;

    @Mock
    private KnowledgeGapService knowledgeGapService;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private AcademicCalendar academicCalendar;

    @InjectMocks
    private ReportExportService reportExportService;

    @Test
    void pdfAndExcelRefuseUnassignedTeacher() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal();
        when(analyticsAccess.requireReadableClass(principal, classId))
                .thenThrow(new ResourceForbiddenException("Giáo viên không được phân quyền xem lớp học này"));

        assertThrows(
                ResourceForbiddenException.class,
                () -> reportExportService.buildReport(principal, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
        assertThrows(
                ResourceForbiddenException.class,
                () -> reportExportService.exportExcel(principal, classId, "ALL", ReportPeriod.LAST_7_DAYS, null, null));
    }

    private static UserPrincipal principal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        return UserPrincipal.builder().users(user).build();
    }
}

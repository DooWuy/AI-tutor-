package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.analytics.ParentMessageComposer;
import com.vn.aitutor.dto.request.AlertSettingsRequest;
import com.vn.aitutor.dto.response.analytics.AlertSettingsUpdateResponse;
import com.vn.aitutor.dto.response.analytics.AtRiskListResponse;
import com.vn.aitutor.entity.ClassAlertSetting;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.ClassAlertSettingRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.IAtRiskService;
import com.vn.aitutor.service.impl.AlertSettingsServiceImpl;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AlertSettingsServiceTest {

    @Mock
    private AnalyticsAccess analyticsAccess;

    @Mock
    private ClassAlertSettingRepository settingRepository;

    @Mock
    private IAtRiskService atRiskService;

    @InjectMocks
    private AlertSettingsServiceImpl alertSettingsService;

    @Test
    void missingRowReturnsDefaults() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal();
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass(classId));
        when(settingRepository.findById(classId)).thenReturn(Optional.empty());

        var view = alertSettingsService.get(principal, classId);

        assertEquals(new BigDecimal("5.0"), view.getScoreThreshold());
        assertEquals(7, view.getInactivityDays());
        assertEquals(2, view.getMaxGapTopics());
        assertFalse(view.isCustomized());
        assertTrue(view.getMessageTemplate().contains("{studentName}"));
    }

    @Test
    void updateSavesThresholdsAndRescansImmediately() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal();
        SchoolClass schoolClass = schoolClass(classId);
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass);
        when(settingRepository.findById(classId)).thenReturn(Optional.empty());
        when(settingRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(atRiskService.list(principal, classId, SubjectCode.ALL, ReportPeriod.LAST_7_DAYS, null, null))
                .thenReturn(AtRiskListResponse.builder().students(List.of()).build());

        AlertSettingsUpdateResponse response =
                alertSettingsService.update(principal, classId, request(new BigDecimal("6.0"), 5, 2));

        ArgumentCaptor<ClassAlertSetting> saved = ArgumentCaptor.forClass(ClassAlertSetting.class);
        verify(settingRepository).saveAndFlush(saved.capture());
        assertEquals(new BigDecimal("6.0"), saved.getValue().getScoreThreshold());
        assertEquals(5, saved.getValue().getInactivityDays());
        assertEquals(2, saved.getValue().getMaxGapTopics());
        verify(atRiskService).list(eq(principal), eq(classId), eq(SubjectCode.ALL), eq(ReportPeriod.LAST_7_DAYS), eq(null), eq(null));
        assertEquals(new BigDecimal("6.0"), response.getSettings().getScoreThreshold());
        assertTrue(response.getSettings().isCustomized());
    }

    @Test
    void templateWithoutStudentNameIsRejected() {
        UUID classId = UUID.randomUUID();
        UserPrincipal principal = principal();
        when(analyticsAccess.requireReadableClass(principal, classId)).thenReturn(schoolClass(classId));
        AlertSettingsRequest request = request(new BigDecimal("6.0"), 5, 2);
        request.setMessageTemplate("A".repeat(60) + " {inactiveDays} {topics}");

        assertThrows(ResourceBadRequestException.class, () -> alertSettingsService.update(principal, classId, request));
    }

    private static AlertSettingsRequest request(BigDecimal score, int days, int gaps) {
        AlertSettingsRequest request = new AlertSettingsRequest();
        request.setScoreThreshold(score);
        request.setInactivityDays(days);
        request.setMaxGapTopics(gaps);
        request.setMessageTemplate(ParentMessageComposer.DEFAULT_TEMPLATE);
        return request;
    }

    private static UserPrincipal principal() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setRole(Role.TEACHER);
        user.setFullName("Nguyễn Thị Giáo");
        return UserPrincipal.builder().users(user).build();
    }

    private static SchoolClass schoolClass(UUID classId) {
        SchoolClass schoolClass = new SchoolClass();
        schoolClass.setId(classId);
        schoolClass.setName("12A1");
        return schoolClass;
    }
}

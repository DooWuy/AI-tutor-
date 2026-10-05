package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.AlertTemplateRules;
import com.vn.aitutor.analytics.ParentMessageComposer;
import com.vn.aitutor.dto.request.AlertSettingsRequest;
import com.vn.aitutor.dto.response.analytics.AlertSettingsUpdateResponse;
import com.vn.aitutor.dto.response.analytics.AlertSettingsView;
import com.vn.aitutor.dto.response.analytics.AtRiskListResponse;
import com.vn.aitutor.entity.ClassAlertSetting;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.ClassAlertSettingRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.AnalyticsAccess;
import com.vn.aitutor.service.IAlertSettingsService;
import com.vn.aitutor.service.IAtRiskService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AlertSettingsServiceImpl implements IAlertSettingsService {

    private final AnalyticsAccess analyticsAccess;
    private final ClassAlertSettingRepository settingRepository;
    private final IAtRiskService atRiskService;

    @Override
    @Transactional(readOnly = true)
    public AlertSettingsView get(UserPrincipal principal, UUID classId) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        return settingRepository
                .findById(schoolClass.getId())
                .map(setting -> toView(setting, true))
                .orElseGet(() -> defaults(schoolClass.getId()));
    }

    @Override
    @Transactional
    public AlertSettingsUpdateResponse update(UserPrincipal principal, UUID classId, AlertSettingsRequest request) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, classId);
        BigDecimal score = normalizeScore(request.getScoreThreshold());
        int inactivityDays = requireRange(
                request.getInactivityDays(), 0, 365, "Số ngày không hoạt động phải từ 0 đến 365");
        int maxGapTopics = requireRange(request.getMaxGapTopics(), 1, 50, "Số lỗ hổng tối đa phải từ 1 đến 50");
        String template = AlertTemplateRules.validate(request.getMessageTemplate());

        ClassAlertSetting setting = settingRepository.findById(schoolClass.getId()).orElseGet(ClassAlertSetting::new);
        setting.setClassId(schoolClass.getId());
        setting.setScoreThreshold(score);
        setting.setInactivityDays(inactivityDays);
        setting.setMaxGapTopics(maxGapTopics);
        setting.setMessageTemplate(template);
        setting.setUpdatedAt(Instant.now());
        setting.setUpdatedBy(principal.getUsers());
        settingRepository.saveAndFlush(setting);

        AtRiskListResponse atRisk = atRiskService.list(
                principal, schoolClass.getId(), SubjectCode.ALL, ReportPeriod.LAST_7_DAYS, null, null);
        return AlertSettingsUpdateResponse.builder().settings(toView(setting, true)).atRisk(atRisk).build();
    }

    private BigDecimal normalizeScore(BigDecimal score) {
        if (score == null) {
            throw new ResourceBadRequestException("Ngưỡng điểm không được để trống");
        }
        BigDecimal scaled = score.setScale(1, RoundingMode.HALF_UP);
        if (scaled.compareTo(new BigDecimal("0.1")) < 0 || scaled.compareTo(new BigDecimal("10.0")) > 0) {
            throw new ResourceBadRequestException("Ngưỡng điểm phải từ 0.1 đến 10.0");
        }
        return scaled;
    }

    private int requireRange(Integer value, int min, int max, String message) {
        if (value == null || value < min || value > max) {
            throw new ResourceBadRequestException(message);
        }
        return value;
    }

    private AlertSettingsView defaults(UUID classId) {
        return AlertSettingsView.builder()
                .classId(classId)
                .scoreThreshold(new BigDecimal("5.0"))
                .inactivityDays(7)
                .maxGapTopics(2)
                .messageTemplate(ParentMessageComposer.DEFAULT_TEMPLATE)
                .customized(false)
                .build();
    }

    private AlertSettingsView toView(ClassAlertSetting setting, boolean customized) {
        return AlertSettingsView.builder()
                .classId(setting.getClassId())
                .scoreThreshold(setting.getScoreThreshold())
                .inactivityDays(setting.getInactivityDays())
                .maxGapTopics(setting.getMaxGapTopics())
                .messageTemplate(setting.getMessageTemplate())
                .customized(customized)
                .build();
    }
}

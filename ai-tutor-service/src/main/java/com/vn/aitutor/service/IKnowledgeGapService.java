package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.analytics.KnowledgeGapsResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.time.LocalDate;
import java.util.UUID;

public interface IKnowledgeGapService {

    KnowledgeGapsResponse getGaps(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);

    int countRankedTopics(UUID classId);
}

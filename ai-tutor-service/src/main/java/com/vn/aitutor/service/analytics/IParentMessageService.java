package com.vn.aitutor.service.analytics;

import com.vn.aitutor.dto.request.analytics.ParentMessageSendRequest;
import com.vn.aitutor.dto.response.analytics.ParentMessageDraftResponse;
import com.vn.aitutor.dto.response.analytics.ParentMessageSendResponse;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.time.LocalDate;
import java.util.UUID;

public interface IParentMessageService {

    ParentMessageDraftResponse draft(
            UserPrincipal principal,
            UUID studentId,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);

    ParentMessageSendResponse send(UserPrincipal principal, UUID studentId, ParentMessageSendRequest request);
}

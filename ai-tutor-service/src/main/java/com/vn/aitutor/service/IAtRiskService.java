package com.vn.aitutor.service;

import com.vn.aitutor.dto.response.analytics.AtRiskListResponse;
import com.vn.aitutor.dto.response.analytics.AtRiskStudentDto;
import com.vn.aitutor.dto.response.analytics.ParentMessageDraftResponse;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.time.LocalDate;
import java.util.UUID;

public interface IAtRiskService {

    AtRiskListResponse list(
            UserPrincipal principal,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);

    int[] countLevels(SchoolClass schoolClass);

    ParentMessageDraftResponse draft(
            UserPrincipal principal,
            UUID studentId,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);

    AtRiskStudentDto requireStudent(
            SchoolClass schoolClass,
            UUID studentId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to);
}

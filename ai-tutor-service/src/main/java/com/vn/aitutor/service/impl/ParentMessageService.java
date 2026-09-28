package com.vn.aitutor.service.impl;

import com.vn.aitutor.analytics.ParentMessageComposer;
import com.vn.aitutor.dto.request.ParentMessageSendRequest;
import com.vn.aitutor.dto.response.analytics.ParentMessageChannelResult;
import com.vn.aitutor.dto.response.analytics.ParentMessageDraftResponse;
import com.vn.aitutor.dto.response.analytics.ParentMessageSendResponse;
import com.vn.aitutor.entity.ParentAlertMessage;
import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.entity.enums.ParentChannel;
import com.vn.aitutor.entity.enums.ParentMessageStatus;
import com.vn.aitutor.entity.enums.ReportPeriod;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.ParentAlertMessageRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.AnalyticsAccess;
import com.vn.aitutor.service.IMailService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ParentMessageService {

    private final AnalyticsAccess analyticsAccess;
    private final AtRiskService atRiskService;
    private final StudentRepository studentRepository;
    private final ParentAlertMessageRepository messageRepository;
    private final IMailService mailService;

    @Transactional(readOnly = true)
    public ParentMessageDraftResponse draft(
            UserPrincipal principal,
            UUID studentId,
            UUID classId,
            String subject,
            ReportPeriod period,
            LocalDate from,
            LocalDate to) {
        return atRiskService.draft(principal, studentId, classId, subject, period, from, to);
    }

    @Transactional
    public ParentMessageSendResponse send(UserPrincipal principal, UUID studentId, ParentMessageSendRequest request) {
        SchoolClass schoolClass = analyticsAccess.requireReadableClass(principal, request.getClassId());
        Student student = studentRepository
                .findWithUserById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        if (student.getClassEntity() == null || !schoolClass.getId().equals(student.getClassEntity().getId())) {
            throw new ResourceNotFoundException("Học sinh không thuộc lớp này");
        }
        String body = request.getBody() == null ? "" : request.getBody().trim();
        if (body.length() < ParentMessageComposer.MIN_LENGTH || body.length() > ParentMessageComposer.MAX_LENGTH) {
            throw new ResourceBadRequestException("Tin nhắn phải từ 50 đến 1000 ký tự");
        }
        Set<ParentChannel> channels = new LinkedHashSet<>(request.getChannels());
        if (channels.isEmpty()) {
            throw new ResourceBadRequestException("Phải chọn ít nhất một kênh gửi");
        }

        List<ParentMessageChannelResult> results = new ArrayList<>();
        for (ParentChannel channel : channels) {
            results.add(dispatch(principal, schoolClass, student, body, channel));
        }
        return ParentMessageSendResponse.builder().studentId(studentId).results(results).build();
    }

    private ParentMessageChannelResult dispatch(
            UserPrincipal principal, SchoolClass schoolClass, Student student, String body, ParentChannel channel) {
        ParentMessageStatus status;
        String error = null;
        if (channel != ParentChannel.EMAIL) {
            status = ParentMessageStatus.NOT_CONFIGURED;
            error = "Kênh chưa được cấu hình";
        } else if (student.getParentEmail() == null || student.getParentEmail().isBlank()) {
            status = ParentMessageStatus.NOT_CONFIGURED;
            error = "Học sinh chưa có email phụ huynh";
        } else {
            try {
                mailService.sendParentAlertEmail(
                        student.getParentEmail().trim(),
                        "Thông báo tình hình tự học của em " + student.getUser().getFullName(),
                        body);
                status = ParentMessageStatus.SENT;
            } catch (RuntimeException ex) {
                status = ParentMessageStatus.FAILED;
                error = clip(ex.getMessage());
            }
        }
        ParentAlertMessage saved = new ParentAlertMessage();
        saved.setStudent(student);
        saved.setSchoolClass(schoolClass);
        saved.setSender(principal.getUsers());
        saved.setBody(body);
        saved.setChannel(channel);
        saved.setStatus(status);
        saved.setErrorMessage(error);
        saved = messageRepository.save(saved);
        return ParentMessageChannelResult.builder()
                .messageId(saved.getId())
                .channel(channel)
                .status(status)
                .errorMessage(error)
                .build();
    }

    private String clip(String message) {
        if (message == null || message.isBlank()) {
            return "Không gửi được email";
        }
        String trimmed = message.trim();
        return trimmed.length() <= 500 ? trimmed : trimmed.substring(0, 500);
    }
}

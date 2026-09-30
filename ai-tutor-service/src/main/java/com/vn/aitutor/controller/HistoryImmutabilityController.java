package com.vn.aitutor.controller;

import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.HistoryGuard;
import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class HistoryImmutabilityController {

    private final HistoryGuard historyGuard;

    @PutMapping("/api/v1/quiz-attempts/{id}")
    public void rejectQuizAttemptPut(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PatchMapping("/api/v1/quiz-attempts/{id}")
    public void rejectQuizAttemptPatch(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @DeleteMapping("/api/v1/quiz-attempts/{id}")
    public void rejectQuizAttemptDelete(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PutMapping("/api/v1/chat-messages/{id}")
    public void rejectChatPut(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PatchMapping("/api/v1/chat-messages/{id}")
    public void rejectChatPatch(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @DeleteMapping("/api/v1/chat-messages/{id}")
    public void rejectChatDelete(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PutMapping("/api/v1/parent-messages/{id}")
    public void rejectParentPut(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PatchMapping("/api/v1/parent-messages/{id}")
    public void rejectParentPatch(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @DeleteMapping("/api/v1/parent-messages/{id}")
    public void rejectParentDelete(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PutMapping("/api/v1/analytics/reports/{id}")
    public void rejectReportPut(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @PatchMapping("/api/v1/analytics/reports/{id}")
    public void rejectReportPatch(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    @DeleteMapping("/api/v1/analytics/reports/{id}")
    public void rejectReportDelete(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id, HttpServletRequest request) {
        reject(principal, request);
    }

    private void reject(UserPrincipal principal, HttpServletRequest request) {
        historyGuard.reject(principal, request.getMethod(), request.getRequestURI());
    }
}

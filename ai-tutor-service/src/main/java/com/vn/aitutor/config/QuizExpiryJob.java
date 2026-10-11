package com.vn.aitutor.config;

import com.vn.aitutor.repository.QuizAttemptDraftRepository;
import com.vn.aitutor.service.QuizSubmissionService;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class QuizExpiryJob {
    private final QuizAttemptDraftRepository drafts;
    private final QuizSubmissionService submissions;
    @Scheduled(fixedDelayString = "${app.quiz.expiry-scan-ms:5000}")
    public void expireDrafts() {
        for (var id : drafts.findExpired(Instant.now(), PageRequest.of(0, 100))) {
            try { submissions.expire(id); }
            catch (Exception ex) { log.error("Cannot finalize expired quiz draft {}", id, ex); }
        }
    }
}

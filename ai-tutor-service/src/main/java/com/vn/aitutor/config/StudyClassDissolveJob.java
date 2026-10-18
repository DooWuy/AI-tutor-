package com.vn.aitutor.config;

import com.vn.aitutor.service.classroom.StudyClassService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StudyClassDissolveJob {

    private final StudyClassService studyClassService;

    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Ho_Chi_Minh")
    public void dissolveExpiredClasses() {
        int dissolved = studyClassService.dissolveExpired();
        if (dissolved > 0) {
            log.info("Dissolved {} study classes past their end date", dissolved);
        }
    }
}

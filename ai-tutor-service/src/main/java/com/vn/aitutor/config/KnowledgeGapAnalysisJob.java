package com.vn.aitutor.config;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.service.impl.KnowledgeGapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.analytics.knowledge-gap-job", havingValue = "true")
public class KnowledgeGapAnalysisJob {

    private final SchoolClassRepository schoolClassRepository;
    private final KnowledgeGapService knowledgeGapService;

    @Scheduled(cron = "0 10 0 * * MON", zone = "Asia/Ho_Chi_Minh")
    public void analyzeWeekly() {
        for (SchoolClass schoolClass : schoolClassRepository.findAllOrdered()) {
            int topics = knowledgeGapService.countRankedTopics(schoolClass.getId());
            log.info("Weekly knowledge-gap scan class={} topics={}", schoolClass.getName(), topics);
        }
    }
}

package com.vn.aitutor.config;

import com.vn.aitutor.entity.SchoolClass;
import com.vn.aitutor.repository.SchoolClassRepository;
import com.vn.aitutor.service.impl.AtRiskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.analytics.at-risk-job", havingValue = "true")
public class AtRiskScanJob {

    private final SchoolClassRepository schoolClassRepository;
    private final AtRiskService atRiskService;

    @Scheduled(cron = "0 20 1 * * *", zone = "Asia/Ho_Chi_Minh")
    public void scanDaily() {
        for (SchoolClass schoolClass : schoolClassRepository.findAllOrdered()) {
            int[] counts = atRiskService.countLevels(schoolClass);
            log.info("Daily at-risk scan class={} red={} orange={}", schoolClass.getName(), counts[0], counts[1]);
        }
    }
}

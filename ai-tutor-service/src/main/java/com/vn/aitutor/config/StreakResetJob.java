package com.vn.aitutor.config;

import com.vn.aitutor.service.gamification.StreakResetService;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StreakResetJob {
    private final StreakResetService resets;
    private final Clock learningClock;
    private final ZoneId academicZone;

    // Hourly retries also recover skipped locks or a missed midnight run.
    @Scheduled(cron = "${app.gamification.streak-reset-cron:0 5 * * * *}",
            zone = "${app.academic.timezone:Asia/Ho_Chi_Minh}")
    public void resetExpiredStreaks() {
        Instant now = learningClock.instant();
        Instant cutoff = now.atZone(academicZone).toLocalDate().minusDays(1)
                .atStartOfDay(academicZone).toInstant();
        for (int batch = 0; batch < 20; batch++) {
            if (resets.resetBatch(cutoff) < 200) break;
        }
    }
}

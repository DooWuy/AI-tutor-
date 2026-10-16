package com.vn.aitutor.config;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LearningTimeConfig {
    @Bean
    public Clock learningClock() {
        return Clock.systemUTC();
    }

    @Bean
    public ZoneId academicZone(@Value("${app.academic.timezone:Asia/Ho_Chi_Minh}") String timezone) {
        return ZoneId.of(timezone);
    }
}

package com.vn.aitutor.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.academic")
public class AcademicProperties {

    /**
     * IANA timezone used to bucket weeks/days for analytics.
     */
    private String timezone = "Asia/Ho_Chi_Minh";

    private Semester semester1 = new Semester();

    @Getter
    @Setter
    public static class Semester {
        private String startMonthDay = "08-15";
        private String endMonthDay = "01-15";
    }
}

package com.vn.aitutor.notification;

import java.time.DayOfWeek;

/**
 * Schedule slots store Monday as 2 through Sunday as 8.
 */
public final class StoredDayOfWeek {

    private StoredDayOfWeek() {
    }

    public static int from(DayOfWeek dayOfWeek) {
        return dayOfWeek.getValue() + 1;
    }
}

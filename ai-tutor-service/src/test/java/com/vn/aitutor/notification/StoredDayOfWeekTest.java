package com.vn.aitutor.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.DayOfWeek;
import org.junit.jupiter.api.Test;

class StoredDayOfWeekTest {

    @Test
    void mondayIsTwoAndSundayIsEight() {
        assertEquals(2, StoredDayOfWeek.from(DayOfWeek.MONDAY));
        assertEquals(4, StoredDayOfWeek.from(DayOfWeek.WEDNESDAY));
        assertEquals(8, StoredDayOfWeek.from(DayOfWeek.SUNDAY));
    }
}

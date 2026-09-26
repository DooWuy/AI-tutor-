package com.vn.aitutor.analytics;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class ParentMessageComposerTest {

    @Test
    void ac04_draftFillsNameDaysAndGapSubject() {
        String body = ParentMessageComposer.compose(
                "Nguyễn Văn A",
                8,
                new BigDecimal("4.5"),
                List.of("Toán"),
                List.of("Thể tích hình nón", "Tiệm cận"),
                "Nguyễn Thị Giáo",
                "THPT AI Tutor");

        assertTrue(body.contains("Nguyễn Văn A"));
        assertTrue(body.contains("8 ngày"));
        assertTrue(body.contains("Thể tích hình nón"));
        assertTrue(body.contains("Tiệm cận"));
        assertTrue(body.contains("Toán"));
        assertTrue(body.length() >= ParentMessageComposer.MIN_LENGTH);
        assertTrue(body.length() <= ParentMessageComposer.MAX_LENGTH);
    }

    @Test
    void neverOpenedDoesNotInventADayCount() {
        String body = ParentMessageComposer.compose(
                "Nguyễn Văn A", null, null, List.of(), List.of(), "Giáo viên", "THPT AI Tutor");
        assertTrue(body.contains("chưa ghi nhận lần mở ứng dụng"));
        assertFalse(body.contains("ngày."));
        assertTrue(body.length() >= ParentMessageComposer.MIN_LENGTH);
    }
}

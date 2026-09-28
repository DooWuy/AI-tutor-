package com.vn.aitutor.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ReminderCopyTest {

    private final UUID notificationId = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void personalizesNameSubjectTimeRoomAndWeakTopic() {
        ReminderCopy.ReminderText text = ReminderCopy.compose(
                "Nguyễn Thị Lan",
                "Hóa học",
                LocalTime.of(7, 0),
                "P.302",
                List.of("Liên kết hóa học"),
                notificationId,
                15
        );

        assertEquals("Còn 15 phút — Hóa học", text.title());
        assertEquals(
                "Lan ơi, tiết Hóa học bắt đầu lúc 07:00 tại P.302. Mở bài ôn nhanh trước khi vào lớp. Nên xem lại: Liên kết hóa học.",
                text.body()
        );
        assertEquals("/student/review/" + notificationId, text.deepLink());
        assertTrue(text.deepLink().startsWith("/student/review/"));
        assertFalse(text.deepLink().contains("http"));
        assertEquals(3, text.outline().size());
        assertTrue(text.outline().get(1).contains("Liên kết hóa học"));
    }

    @Test
    void omitsRoomAndGapWhenTheyAreMissing() {
        ReminderCopy.ReminderText text = ReminderCopy.compose(
                " ",
                "Toán",
                LocalTime.of(13, 30),
                "  ",
                List.of(),
                notificationId,
                15
        );

        assertTrue(text.body().startsWith("bạn ơi, tiết Toán bắt đầu lúc 13:30."));
        assertFalse(text.body().contains("tại"));
        assertFalse(text.body().contains("Nên xem lại"));
        assertTrue(text.outline().get(1).contains("khái niệm chính"));
    }

    @Test
    void singleLetterLastTokenKeepsTheFullName() {
        assertEquals("Nguyễn Văn A", ReminderCopy.givenName("Nguyễn Văn A"));
    }
}

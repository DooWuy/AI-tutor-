package com.vn.aitutor.notification;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.dto.response.StudyNotificationResponse;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class StudyNotificationResponseJsonTest {

    @Test
    void readFlagAndDeepLinkUseTheApiNames() {
        StudyNotificationResponse response = StudyNotificationResponse.builder()
                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .title("Còn 15 phút — Hóa học")
                .deepLink("/student/review/11111111-1111-1111-1111-111111111111")
                .subjectName("Hóa học")
                .read(true)
                .build();

        String json = JsonMapper.builder().build().writeValueAsString(response);

        assertTrue(json.contains("\"read\":true"), json);
        assertTrue(json.contains("\"deepLink\":\"/student/review/11111111-1111-1111-1111-111111111111\""), json);
    }
}

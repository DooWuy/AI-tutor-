package com.vn.aitutor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class ContentSafetyService {

    // Danh sách từ khóa nhạy cảm, bạo lực cơ bản (demo)
    private static final List<String> BLOCKED_KEYWORDS = Arrays.asList(
            "đánh nhau", "giết", "tự tử", "chửi", "ngu", "đần",
            "kích động", "bạo lực", "đồi trụy", "khiêu dâm", "chết", "đấm", "địt", "đụ", "chó", "thằng", "mày", "tao"
    );

    public boolean isSafe(String message) {
        if (message == null || message.trim().isEmpty()) {
            return true;
        }
        
        String lowerCaseMessage = message.toLowerCase();
        for (String keyword : BLOCKED_KEYWORDS) {
            if (lowerCaseMessage.contains(keyword)) {
                log.warn("Content safety violation detected. Keyword: '{}'", keyword);
                return false;
            }
        }
        return true;
    }

    public String getRejectionMessage() {
        return "Xin lỗi bạn, tin nhắn của bạn chứa ngôn từ không phù hợp với môi trường giáo dục. Mong bạn sử dụng từ ngữ chuẩn mực và tập trung vào các câu hỏi học tập nhé!";
    }
}

package com.vn.aitutor.repository.projection;

import java.util.UUID;

public interface TopicAnswerCountRow {
    String getTopic();

    String getSubject();

    UUID getStudentId();

    Boolean getCorrect();

    long getAnswerCount();
}

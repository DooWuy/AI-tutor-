package com.vn.aitutor.repository.projection;

import java.util.UUID;

public interface QuestionWrongRateRow {
    UUID getQuestionId();

    String getStem();

    Long getWrongCount();

    Long getAnswerCount();
}

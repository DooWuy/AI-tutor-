package com.vn.aitutor.repository.projection;

public interface TopicWrongCountRow {
    String getTopic();

    long getWrongCount();

    long getCorrectCount();
}

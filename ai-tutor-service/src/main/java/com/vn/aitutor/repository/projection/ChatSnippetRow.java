package com.vn.aitutor.repository.projection;

import java.util.UUID;

public interface ChatSnippetRow {
    UUID getStudentId();

    String getContent();
}

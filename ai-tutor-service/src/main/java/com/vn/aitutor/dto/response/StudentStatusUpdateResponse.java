package com.vn.aitutor.dto.response;

import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentStatusUpdateResponse {
    UUID studentId;
    UUID userId;
    boolean active;
}

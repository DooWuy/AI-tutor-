package com.vn.aitutor.dto.response.system;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogResponse {
    private UUID id;
    private String level;
    private String message;
    private String source;
    private String stackTrace;
    private Instant createdAt;
}

package com.vn.aitutor.dto.response.system;

import java.time.Instant;
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
public class SystemSettingResponse {
    private String key;
    private String value;
    private String groupName;
    private String description;
    private Instant updatedAt;
}

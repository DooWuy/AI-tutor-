package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.Map;
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
public class SystemSettingsUpdateRequest {

    @NotNull(message = "Danh sách cài đặt không được để trống")
    private Map<String, String> settings;
}

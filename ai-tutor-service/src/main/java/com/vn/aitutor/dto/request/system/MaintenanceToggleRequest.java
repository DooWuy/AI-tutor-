package com.vn.aitutor.dto.request.system;

import jakarta.validation.constraints.NotNull;
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
public class MaintenanceToggleRequest {

    @NotNull(message = "Trạng thái bảo trì không được để trống")
    private Boolean enabled;

    private String message;
}

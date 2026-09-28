package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReminderPreferenceRequest {

    @NotNull(message = "enabled không được để trống")
    private Boolean enabled;
}

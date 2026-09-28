package com.vn.aitutor.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReminderPreferenceResponse {
    private boolean enabled;
    private NextReminderResponse nextReminder;
}

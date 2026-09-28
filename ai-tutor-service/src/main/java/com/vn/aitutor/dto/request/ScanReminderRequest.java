package com.vn.aitutor.dto.request;

import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScanReminderRequest {
    private OffsetDateTime asOf;
}

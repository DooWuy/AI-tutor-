package com.vn.aitutor.dto.response.analytics;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParentMessageSendResponse {
    private UUID studentId;
    private List<ParentMessageChannelResult> results;
}

package com.vn.aitutor.dto.response.analytics;

import com.vn.aitutor.entity.enums.ParentChannel;
import com.vn.aitutor.entity.enums.ParentMessageStatus;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParentMessageChannelResult {
    private UUID messageId;
    private ParentChannel channel;
    private ParentMessageStatus status;
    private String errorMessage;
}

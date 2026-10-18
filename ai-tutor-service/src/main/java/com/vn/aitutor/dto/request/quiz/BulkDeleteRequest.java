package com.vn.aitutor.dto.request.quiz;

import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class BulkDeleteRequest {
    private List<UUID> ids;
}


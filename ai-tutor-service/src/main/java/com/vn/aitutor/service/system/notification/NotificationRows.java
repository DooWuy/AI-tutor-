package com.vn.aitutor.service.system.notification;

import com.vn.aitutor.dto.response.notification.NotificationResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

public final class NotificationRows {
    private static final TypeReference<Map<String, Object>> METADATA = new TypeReference<>() {};
    private NotificationRows() {}

    public static NotificationResponse read(ResultSet rs, ObjectMapper mapper) throws SQLException {
        return new NotificationResponse(rs.getObject("id", UUID.class), rs.getString("type"),
                rs.getString("title"), rs.getString("message"), rs.getString("link"),
                rs.getBoolean("is_read"), rs.getTimestamp("created_at").toInstant(),
                mapper.readValue(rs.getString("metadata"), METADATA));
    }
}

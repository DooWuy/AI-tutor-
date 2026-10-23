package com.vn.aitutor.service.system;

import com.vn.aitutor.dto.response.notification.NotificationFeedResponse;
import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.service.system.notification.NotificationCursor;
import com.vn.aitutor.service.system.notification.NotificationRows;
import java.sql.Timestamp;
import java.util.ArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(UUID userId, Integer limit) {
        int boundedLimit = limit == null || limit <= 0 ? 20 : Math.min(limit, 100);
        return jdbc.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
                (rs, row) -> NotificationRows.read(rs, objectMapper), userId, boundedLimit);
    }

    @Transactional(readOnly = true)
    public NotificationFeedResponse getFeed(UUID userId, String cursor, Integer size, boolean unreadOnly) {
        int pageSize = size == null ? 20 : Math.min(size, 100);
        if (pageSize < 1) throw new ResourceBadRequestException("Kích thước trang phải lớn hơn 0");
        NotificationCursor after = NotificationCursor.decode(cursor);
        List<Object> args = new ArrayList<>();
        args.add(userId);
        String sql = "SELECT * FROM notifications WHERE user_id = ?";
        if (unreadOnly) sql += " AND is_read = FALSE";
        if (after != null) {
            sql += " AND (created_at, id) < (?, ?)";
            args.add(Timestamp.from(after.createdAt()));
            args.add(after.id());
        }
        args.add(pageSize + 1);
        List<NotificationResponse> rows = jdbc.query(sql + " ORDER BY created_at DESC, id DESC LIMIT ?",
                (rs, row) -> NotificationRows.read(rs, objectMapper), args.toArray());
        boolean hasNext = rows.size() > pageSize;
        List<NotificationResponse> items = List.copyOf(rows.subList(0, Math.min(pageSize, rows.size())));
        String nextCursor = hasNext ? NotificationCursor.encode(items.get(items.size() - 1)) : null;
        return new NotificationFeedResponse(items, nextCursor, getUnreadCount(userId));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return jdbc.queryForObject("SELECT count(*) FROM notifications WHERE user_id = ? AND is_read = FALSE", Long.class, userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        if (jdbc.update("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", notificationId, userId) == 0) {
            throw new ResourceNotFoundException("Không tìm thấy thông báo");
        }
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        jdbc.update("UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE", userId);
    }
}

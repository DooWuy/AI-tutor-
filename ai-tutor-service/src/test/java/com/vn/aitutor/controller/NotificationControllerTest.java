package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;

import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.entity.Notification;
import com.vn.aitutor.dto.response.notification.NotificationResponse;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.system.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    private NotificationController controller;

    private UserPrincipal principal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        controller = new NotificationController(notificationService);
        userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setUsername("testuser");
        user.setRole(Role.STUDENT);
        user.setActive(true);
        principal = UserPrincipal.builder().users(user).build();
    }

    @Test
    void getMyNotifications_returnsSuccessWithList() {
        Notification notification = new Notification();
        notification.setTitle("Tiết học sắp bắt đầu");
        when(notificationService.getMyNotifications(userId, (Integer) null)).thenReturn(List.of(NotificationResponse.from(notification)));

        ResponseEntity<ApiResponse<List<NotificationResponse>>> response = controller.getMyNotifications(principal, null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("Tiết học sắp bắt đầu", response.getBody().getData().get(0).title());
    }

    @Test
    void getMyNotifications_withLimit_returnsLimitedList() {
        Notification notification = new Notification();
        notification.setTitle("Thông báo mới nhất");
        when(notificationService.getMyNotifications(userId, 5)).thenReturn(List.of(NotificationResponse.from(notification)));

        ResponseEntity<ApiResponse<List<NotificationResponse>>> response = controller.getMyNotifications(principal, 5);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());
        assertEquals("Thông báo mới nhất", response.getBody().getData().get(0).title());
    }

    @Test
    void markAsRead_returnsSuccess() {
        UUID notificationId = UUID.randomUUID();

        ResponseEntity<ApiResponse<Void>> response = controller.markAsRead(principal, notificationId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã đọc", response.getBody().getMessage());
        verify(notificationService).markAsRead(notificationId, userId);
    }

    @Test
    void markAllAsRead_returnsSuccess() {
        ResponseEntity<ApiResponse<Void>> response = controller.markAllAsRead(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Đã đọc tất cả", response.getBody().getMessage());
        verify(notificationService).markAllAsRead(userId);
    }
}

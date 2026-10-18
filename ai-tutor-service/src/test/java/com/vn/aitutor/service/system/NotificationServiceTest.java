package com.vn.aitutor.service.system;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.vn.aitutor.entity.Notification;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository);
    }

    @Test
    void getMyNotifications_returnsUserNotificationsOrdered() {
        UUID userId = UUID.randomUUID();
        Notification n1 = new Notification();
        n1.setTitle("Thông báo 1");
        Notification n2 = new Notification();
        n2.setTitle("Thông báo 2");

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(n1, n2));

        List<Notification> result = notificationService.getMyNotifications(userId);

        assertEquals(2, result.size());
        assertEquals("Thông báo 1", result.get(0).getTitle());
        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void markAsRead_whenUserMatches_marksReadAndSaves() {
        UUID userId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();

        User user = new User();
        user.setId(userId);

        Notification notification = new Notification();
        notification.setId(notificationId);
        notification.setUser(user);
        notification.setRead(false);

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(notificationId, userId);

        assertTrue(notification.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_whenUserDoesNotMatch_doesNotSave() {
        UUID ownerId = UUID.randomUUID();
        UUID callerId = UUID.randomUUID();
        UUID notificationId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);

        Notification notification = new Notification();
        notification.setId(notificationId);
        notification.setUser(owner);
        notification.setRead(false);

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(notificationId, callerId);

        assertFalse(notification.isRead());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAsRead_whenNotificationNotFound_doesNothing() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

        notificationService.markAsRead(notificationId, userId);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void markAllAsRead_marksAllUnreadNotificationsAsRead() {
        UUID userId = UUID.randomUUID();

        when(notificationRepository.markAllAsReadByUserId(userId)).thenReturn(3);

        notificationService.markAllAsRead(userId);

        verify(notificationRepository).markAllAsReadByUserId(userId);
    }

    @Test
    void getMyNotifications_paged_returnsPage() {
        UUID userId = UUID.randomUUID();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        Notification n = new Notification();
        n.setTitle("Thông báo phân trang");
        org.springframework.data.domain.Page<Notification> page = new org.springframework.data.domain.PageImpl<>(List.of(n));

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)).thenReturn(page);

        org.springframework.data.domain.Page<Notification> result = notificationService.getMyNotifications(userId, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Thông báo phân trang", result.getContent().get(0).getTitle());
        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}

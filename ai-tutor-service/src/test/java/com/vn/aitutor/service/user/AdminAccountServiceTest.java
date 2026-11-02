package com.vn.aitutor.service.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipalCache;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AdminAccountServiceTest {
    UserRepository users;
    UserServiceImpl service;
    User target;

    @BeforeEach void setup() {
        users = mock(UserRepository.class);
        service = new UserServiceImpl(users, null, null, null, null, null, null, null,
                mock(UserPrincipalCache.class), null);
        target = new User(); target.setId(UUID.randomUUID()); target.setRole(Role.ADMIN);
        target.setUsername("admin"); target.setActive(true);
        when(users.findById(target.getId())).thenReturn(Optional.of(target));
    }

    @Test void lastAdminCannotBeLockedOrDeleted() {
        when(users.countByRoleAndActiveTrueAndIsDeletedFalse(Role.ADMIN)).thenReturn(1L);
        assertThrows(ResourceConflictException.class, () -> service.setStatus(target.getId(), false));
        assertThrows(ResourceConflictException.class, () -> service.deleteProfile(target.getId()));
        assertTrue(target.isActive()); assertFalse(target.isDeleted());
        verify(users, never()).save(any());
    }

    @Test void repeatStatusIsIdempotent() {
        target.setRole(Role.TEACHER);
        when(users.save(target)).thenReturn(target);
        service.setStatus(target.getId(), false);
        service.setStatus(target.getId(), false);
        assertFalse(target.isActive());
        service.setStatus(target.getId(), true);
        service.setStatus(target.getId(), true);
        assertTrue(target.isActive());
    }

    @Test void anotherActiveAdminAllowsLockAndLockIsAcquiredBeforeReadingTarget() {
        when(users.countByRoleAndActiveTrueAndIsDeletedFalse(Role.ADMIN)).thenReturn(2L);
        when(users.save(target)).thenReturn(target);
        service.setStatus(target.getId(), false);
        assertFalse(target.isActive());
        var ordered = inOrder(users);
        ordered.verify(users).lockAdminAccounts();
        ordered.verify(users).findById(target.getId());
        ordered.verify(users).countByRoleAndActiveTrueAndIsDeletedFalse(Role.ADMIN);
    }

    @Test void roleChangesCannotOrphanProfilesOrRemoveLastAdmin() {
        var request = new com.vn.aitutor.dto.request.user.UpdateRoleRequest();
        request.setRole(Role.STUDENT);
        assertThrows(ResourceConflictException.class, () -> service.updateRole(target.getId(), request));
        assertEquals(Role.ADMIN, target.getRole());
        verify(users, never()).save(any());
    }
}

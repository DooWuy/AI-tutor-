package com.vn.aitutor.security.principal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import com.vn.aitutor.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class AccountRevocationTest {
    @Test void staleCachedPrincipalCannotKeepAccountAuthenticatedAfterLockOrDelete() {
        var users = mock(UserRepository.class);
        var cache = new UserPrincipalCache();
        var details = new UserDetailServiceCustom(users, cache);
        var active = new User(); active.setUsername("teacher"); active.setRole(Role.TEACHER); active.setActive(true);
        when(users.findByUsernameOrEmailAndIsDeletedFalseAndIsActiveTrue("teacher"))
                .thenReturn(Optional.of(active)).thenReturn(Optional.empty());
        assertTrue(details.loadUserByUsername("teacher").isEnabled());
        assertNotNull(cache.get("teacher"));
        assertThrows(UsernameNotFoundException.class, () -> details.loadUserByUsername("teacher"));
    }
}

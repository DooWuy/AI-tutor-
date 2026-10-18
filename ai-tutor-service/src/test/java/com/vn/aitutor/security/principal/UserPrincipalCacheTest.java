package com.vn.aitutor.security.principal;

import static org.junit.jupiter.api.Assertions.*;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

class UserPrincipalCacheTest {

    private UserPrincipalCache cache;

    @BeforeEach
    void setUp() {
        cache = new UserPrincipalCache();
    }

    @Test
    void putAndGetWorksWithCaseInsensitiveKey() {
        User user = new User();
        user.setUsername("student01");
        user.setEmail("student01@example.com");
        user.setRole(Role.STUDENT);

        UserDetails principal = UserPrincipal.builder()
                .users(user)
                .authorities(Collections.singleton(new SimpleGrantedAuthority("ROLE_STUDENT")))
                .build();

        cache.put("student01", principal);

        UserDetails cached1 = cache.get("student01");
        UserDetails cached2 = cache.get("STUDENT01");
        UserDetails cached3 = cache.get(" Student01 ");

        assertNotNull(cached1);
        assertNotNull(cached2);
        assertNotNull(cached3);
        assertEquals(principal, cached1);
    }

    @Test
    void evictRemovesUserFromCache() {
        User user = new User();
        user.setUsername("student02");
        UserDetails principal = UserPrincipal.builder().users(user).build();

        cache.put("student02", principal);
        assertNotNull(cache.get("student02"));

        cache.evict("student02");
        assertNull(cache.get("student02"));
    }

    @Test
    void nullAndBlankKeysSafelyReturnNull() {
        assertNull(cache.get(null));
        assertNull(cache.get(""));
        assertNull(cache.get("   "));
    }
}

package com.vn.aitutor.security.jwt;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.Role;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class JwtProviderTest {
    @Test
    void rapidLoginAndRefreshAlwaysIssueDistinctTokens() {
        String secret = "test-secret-with-at-least-sixty-four-bytes-for-hs512-signatures-1234567890";
        JwtProvider provider = new JwtProvider(mock(TokenBlacklistService.class));
        ReflectionTestUtils.setField(provider, "secretKey", secret);
        ReflectionTestUtils.setField(provider, "expire", 86400000L);
        User user = new User();
        user.setUsername("student");
        user.setEmail("student@example.invalid");
        user.setRole(Role.STUDENT);
        var tokens = new HashSet<String>();
        var ids = new HashSet<String>();
        for (int i = 0; i < 20; i++) {
            for (String token : new String[] {provider.generateAccessToken(user), provider.generateRefreshToken(user)}) {
                assertTrue(tokens.add(token), "A blacklisted or rotated token must never be reissued");
                var claims = Jwts.parser().setSigningKey(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                        .parseClaimsJws(token).getBody();
                assertNotNull(claims.getId());
                assertTrue(ids.add(claims.getId()));
                assertEquals("student", claims.getSubject());
                assertTrue(claims.getExpiration().after(claims.getIssuedAt()));
            }
        }
    }
}

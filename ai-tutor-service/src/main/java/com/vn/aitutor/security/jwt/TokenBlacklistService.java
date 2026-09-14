package com.vn.aitutor.security.jwt;

import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.jwt.secret}")
    private String secretKey;

    private static final String BLACKLIST_PREFIX = "blacklist-token:";

    public void addTokenToBlacklist(String token, String tokenType) {
        try {
            long expirationTime = getExpireFromToken(token);
            long ttl = (expirationTime - System.currentTimeMillis()) / 1000;

            if (ttl > 0) {
                String blacklistKey = BLACKLIST_PREFIX + tokenType + ":" + token;
                String ttlValue = "ttl=" + ttl + "|type=" + tokenType;
                redisTemplate.opsForValue().set(blacklistKey, ttlValue, ttl, TimeUnit.SECONDS);
            }
        } catch (Exception e) {
            log.error("Error adding {} token to blacklist: {}", tokenType, e.getMessage());
        }
    }

    public boolean isTokenBlacklisted(String token) {
        try {
            String accessKey = BLACKLIST_PREFIX + "access:" + token;
            String refreshKey = BLACKLIST_PREFIX + "refresh:" + token;

            Boolean accessExists = redisTemplate.hasKey(accessKey);
            Boolean refreshExists = redisTemplate.hasKey(refreshKey);

            return (accessExists != null && accessExists) || (refreshExists != null && refreshExists);
        } catch (Exception e) {
            log.error("Error checking token blacklist: {}", e.getMessage());
            return false;
        }
    }

    private long getExpireFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(secretKey.getBytes(StandardCharsets.UTF_8))
                .parseClaimsJws(token)
                .getBody().getExpiration()
                .getTime();
    }
}
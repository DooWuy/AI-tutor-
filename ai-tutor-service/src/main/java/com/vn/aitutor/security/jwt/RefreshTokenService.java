package com.vn.aitutor.security.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {
    private final RedisTemplate<String, String> redisTemplate;

    private final String REFRESH_TOKEN_PREFIX = "refresh_token:";

    @Value("${app.jwt.secret}")
    private String secretKey;

    private Key key(){
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));// chuyen doi chuoi thanh key
    }

    public void saveRefreshToken(String refreshToken) {
        long ttl = getExpireFromToken(refreshToken);

        long timeToLive = (ttl - System.currentTimeMillis()) / 1000;
        if (ttl > 0) {
            String key = REFRESH_TOKEN_PREFIX + refreshToken;
            String value = "TTL: " + ttl;

            redisTemplate.opsForValue().set(key, value, timeToLive, TimeUnit.SECONDS);
        }
    }

    public boolean isRefreshTokenValid(String refreshToken) {
        Boolean exists = redisTemplate.hasKey(REFRESH_TOKEN_PREFIX + refreshToken);
        return exists != null && exists;
    }

    public void deleteRefreshToken(String refreshToken) {
        redisTemplate.delete(REFRESH_TOKEN_PREFIX + refreshToken);
    }

    private long getExpireFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(key())
                .parseClaimsJws(token)
                .getBody()
                .getExpiration()
                .getTime();
    }

}
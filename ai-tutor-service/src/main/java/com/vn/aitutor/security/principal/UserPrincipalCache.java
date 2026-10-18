package com.vn.aitutor.security.principal;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class UserPrincipalCache {

    private static final Duration TTL = Duration.ofMinutes(3);
    private static final int MAX_ENTRIES = 5000;

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public UserDetails get(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return null;
        }
        String key = normalize(identifier);
        CacheEntry entry = cache.get(key);
        if (entry == null) {
            return null;
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            cache.remove(key);
            return null;
        }
        return entry.userDetails();
    }

    public void put(String identifier, UserDetails userDetails) {
        if (identifier == null || identifier.isBlank() || userDetails == null) {
            return;
        }
        if (cache.size() >= MAX_ENTRIES) {
            cache.clear();
            log.debug("UserPrincipalCache reached max limit, cleared.");
        }
        String key = normalize(identifier);
        cache.put(key, new CacheEntry(userDetails, Instant.now().plus(TTL)));
    }

    public void evict(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return;
        }
        String key = normalize(identifier);
        cache.remove(key);
        log.debug("Evicted user from UserPrincipalCache: {}", key);
    }

    public void clear() {
        cache.clear();
    }

    private String normalize(String key) {
        return key.trim().toLowerCase(Locale.ROOT);
    }

    private record CacheEntry(UserDetails userDetails, Instant expiresAt) {}
}

package com.vn.aitutor.service.ai;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class CachingPedagogyAdvisor implements PedagogyAdvisor {

    private static final Duration TTL = Duration.ofHours(6);
    private static final int MAX_ENTRIES = 200;

    private final GeminiPedagogyAdvisor delegate;
    private final ConcurrentHashMap<String, Entry> cache = new ConcurrentHashMap<>();

    public CachingPedagogyAdvisor(GeminiPedagogyAdvisor delegate) {
        this.delegate = delegate;
    }

    @Override
    public Map<String, String> advise(List<GapAdviceRequest> gaps) {
        if (gaps == null || gaps.isEmpty()) {
            return Map.of();
        }
        String key = hash(gaps);
        Instant now = Instant.now();
        Entry hit = cache.get(key);
        if (hit != null && hit.expiresAt().isAfter(now)) {
            return hit.advice();
        }
        AdviceResult result = delegate.adviseWithSource(gaps);
        if (result.fromModel()) {
            if (cache.size() >= MAX_ENTRIES) {
                cache.clear();
            }
            cache.put(key, new Entry(result.advice(), now.plus(TTL)));
        }
        return result.advice();
    }

    private String hash(List<GapAdviceRequest> gaps) {
        StringBuilder builder = new StringBuilder();
        for (GapAdviceRequest gap : gaps) {
            builder.append(gap.topic())
                    .append('|')
                    .append(gap.subject())
                    .append('|')
                    .append(gap.affectedPercent())
                    .append('|')
                    .append(gap.affectedStudentCount())
                    .append('|')
                    .append(gap.classSize())
                    .append('|')
                    .append(gap.wrongAnswerCount())
                    .append('|')
                    .append(gap.askingStudentCount())
                    .append('|')
                    .append(String.join("~", gap.excerpts()))
                    .append('\n');
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(builder.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private record Entry(Map<String, String> advice, Instant expiresAt) {}
}

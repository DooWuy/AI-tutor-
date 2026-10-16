package com.vn.aitutor.service.impl;

import com.vn.aitutor.dto.response.SystemSettingResponse;
import com.vn.aitutor.entity.SystemSetting;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.SystemSettingRepository;
import com.vn.aitutor.service.ISystemSettingsService;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingsServiceImpl implements ISystemSettingsService {

    private final SystemSettingRepository systemSettingRepository;
    private final ConcurrentHashMap<String, String> cache = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        refreshCache();
    }

    public synchronized void refreshCache() {
        try {
            List<SystemSetting> all = systemSettingRepository.findAll();
            cache.clear();
            for (SystemSetting setting : all) {
                cache.put(setting.getKey(), setting.getValue());
            }
            log.info("Loaded {} system settings into memory cache", all.size());
        } catch (Exception e) {
            log.warn("Could not preload system settings on startup: {}", e.getMessage());
        }
    }

    @Override
    public String getSetting(String key, String defaultValue) {
        String val = cache.get(key);
        if (val != null) {
            return val;
        }
        return systemSettingRepository.findById(key)
                .map(setting -> {
                    cache.put(key, setting.getValue());
                    return setting.getValue();
                })
                .orElse(defaultValue);
    }

    @Override
    public int getInt(String key, int defaultValue) {
        String val = getSetting(key, null);
        if (val == null) return defaultValue;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Override
    public double getDouble(String key, double defaultValue) {
        String val = getSetting(key, null);
        if (val == null) return defaultValue;
        try {
            return Double.parseDouble(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    @Override
    public boolean getBoolean(String key, boolean defaultValue) {
        String val = getSetting(key, null);
        if (val == null) return defaultValue;
        return Boolean.parseBoolean(val.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<SystemSettingResponse>> getAllSettingsGrouped() {
        List<SystemSetting> all = systemSettingRepository.findAllByOrderByGroupNameAscKeyAsc();
        Map<String, List<SystemSettingResponse>> grouped = new LinkedHashMap<>();

        for (SystemSetting setting : all) {
            SystemSettingResponse res = SystemSettingResponse.builder()
                    .key(setting.getKey())
                    .value(setting.getValue())
                    .groupName(setting.getGroupName())
                    .description(setting.getDescription())
                    .updatedAt(setting.getUpdatedAt())
                    .build();
            grouped.computeIfAbsent(setting.getGroupName(), k -> new ArrayList<>()).add(res);
        }
        return grouped;
    }

    @Override
    @Transactional
    public void updateSettings(Map<String, String> newSettings) {
        if (newSettings == null || newSettings.isEmpty()) return;

        Instant now = Instant.now();
        List<SystemSetting> updatedEntities = new ArrayList<>();

        for (Map.Entry<String, String> entry : newSettings.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue() != null ? entry.getValue() : "";
            validateSetting(key, value);

            SystemSetting setting = systemSettingRepository.findById(key)
                    .orElseGet(() -> SystemSetting.builder()
                            .key(key)
                            .groupName(inferGroupName(key))
                            .description(key)
                            .build());

            setting.setValue(value);
            setting.setUpdatedAt(now);
            updatedEntities.add(setting);
        }

        systemSettingRepository.saveAll(updatedEntities);
        updatedEntities.forEach(setting -> cache.put(setting.getKey(), setting.getValue()));
        log.info("Updated {} system settings successfully", updatedEntities.size());
    }

    private void validateSetting(String key, String value) {
        if ("gamification.daily_xp_cap".equals(key)) {
            final int parsed;
            try {
                parsed = Integer.parseInt(value.trim());
            } catch (RuntimeException exception) {
                throw new ResourceBadRequestException("Hạn mức XP hằng ngày phải là số nguyên");
            }
            if (parsed < 1 || parsed > 1_000_000) {
                throw new ResourceBadRequestException("Hạn mức XP hằng ngày phải từ 1 đến 1000000");
            }
        }
    }

    private String inferGroupName(String key) {
        if (key.startsWith("gamification.")) return "GAMIFICATION";
        if (key.startsWith("ai.")) return "AI_MODEL";
        if (key.startsWith("system.")) return "MAINTENANCE";
        if (key.startsWith("cache.") || key.startsWith("db.")) return "CACHE_DB";
        return "GENERAL";
    }
}

package com.vn.aitutor.service;

import com.vn.aitutor.entity.SystemSetting;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.SystemSettingRepository;
import com.vn.aitutor.service.impl.SystemSettingsServiceImpl;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemSettingsServiceImplTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    private SystemSettingsServiceImpl settingsService;

    @BeforeEach
    void setUp() {
        settingsService = new SystemSettingsServiceImpl(systemSettingRepository);
    }

    @Test
    void getSetting_fallbackDefault() {
        when(systemSettingRepository.findById("custom.key")).thenReturn(Optional.empty());

        String val = settingsService.getSetting("custom.key", "default_val");
        assertEquals("default_val", val);
    }

    @Test
    void getInt_parsesCorrectly() {
        SystemSetting s = SystemSetting.builder()
                .key("gamification.daily_xp_cap")
                .value("500")
                .groupName("GAMIFICATION")
                .build();
        when(systemSettingRepository.findById("gamification.daily_xp_cap")).thenReturn(Optional.of(s));

        int cap = settingsService.getInt("gamification.daily_xp_cap", 100);
        assertEquals(500, cap);
    }

    @Test
    void getBoolean_parsesCorrectly() {
        SystemSetting s = SystemSetting.builder()
                .key("system.maintenance_mode")
                .value("true")
                .groupName("MAINTENANCE")
                .build();
        when(systemSettingRepository.findById("system.maintenance_mode")).thenReturn(Optional.of(s));

        boolean maintenance = settingsService.getBoolean("system.maintenance_mode", false);
        assertTrue(maintenance);
    }

    @Test
    void updateSettings_updatesEntitiesAndCache() {
        when(systemSettingRepository.findById("gamification.daily_xp_cap")).thenReturn(Optional.empty());

        settingsService.updateSettings(Map.of("gamification.daily_xp_cap", "700"));

        verify(systemSettingRepository).saveAll(anyList());
        assertEquals(700, settingsService.getInt("gamification.daily_xp_cap", 0));
    }

    @Test
    void updateSettings_rejectsInvalidDailyXpCapWithoutSavingOrCaching() {
        assertThrows(ResourceBadRequestException.class,
                () -> settingsService.updateSettings(Map.of("gamification.daily_xp_cap", "0")));
        assertThrows(ResourceBadRequestException.class,
                () -> settingsService.updateSettings(Map.of("gamification.daily_xp_cap", "not-a-number")));

        verify(systemSettingRepository, never()).saveAll(anyList());
        assertEquals(500, settingsService.getInt("gamification.daily_xp_cap", 500));
    }
}

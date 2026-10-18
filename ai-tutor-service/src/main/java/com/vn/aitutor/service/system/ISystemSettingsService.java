package com.vn.aitutor.service.system;

import com.vn.aitutor.dto.response.system.SystemSettingResponse;
import java.util.List;
import java.util.Map;

public interface ISystemSettingsService {

    String getSetting(String key, String defaultValue);

    int getInt(String key, int defaultValue);

    double getDouble(String key, double defaultValue);

    boolean getBoolean(String key, boolean defaultValue);

    Map<String, List<SystemSettingResponse>> getAllSettingsGrouped();

    void updateSettings(Map<String, String> newSettings);
}

package com.vn.aitutor.dto.response.analytics;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AlertSettingsUpdateResponse {
    private AlertSettingsView settings;
    private AtRiskListResponse atRisk;
}

package com.vn.aitutor.service.analytics;

import com.vn.aitutor.dto.request.analytics.AlertSettingsRequest;
import com.vn.aitutor.dto.response.analytics.AlertSettingsUpdateResponse;
import com.vn.aitutor.dto.response.analytics.AlertSettingsView;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.util.UUID;

public interface IAlertSettingsService {

    AlertSettingsView get(UserPrincipal principal, UUID classId);

    AlertSettingsUpdateResponse update(UserPrincipal principal, UUID classId, AlertSettingsRequest request);
}

package com.vn.aitutor.dto.response;

import java.util.Map;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiError {
    private final String code;
    private final Map<String, String> fieldErrors;
}

package com.vn.aitutor.service.ai;

import java.util.Map;

public record AdviceResult(Map<String, String> advice, boolean fromModel) {}

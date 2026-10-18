package com.vn.aitutor.ai.advisor;

import java.util.Map;

public record AdviceResult(Map<String, String> advice, boolean fromModel) {}

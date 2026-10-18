package com.vn.aitutor.ai.advisor;

import java.util.List;
import java.util.Map;

public interface PedagogyAdvisor {

    Map<String, String> advise(List<GapAdviceRequest> gaps);
}

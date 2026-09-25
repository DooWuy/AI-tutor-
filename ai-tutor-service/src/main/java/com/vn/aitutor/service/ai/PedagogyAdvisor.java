package com.vn.aitutor.service.ai;

import java.util.List;
import java.util.Map;

public interface PedagogyAdvisor {

    Map<String, String> advise(List<GapAdviceRequest> gaps);
}

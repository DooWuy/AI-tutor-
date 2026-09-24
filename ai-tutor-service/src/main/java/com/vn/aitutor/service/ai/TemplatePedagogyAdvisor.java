package com.vn.aitutor.service.ai;

import com.vn.aitutor.analytics.KnowledgeGapCalculator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class TemplatePedagogyAdvisor implements PedagogyAdvisor {

    @Override
    public Map<String, String> advise(List<GapAdviceRequest> gaps) {
        Map<String, String> advice = new LinkedHashMap<>();
        if (gaps == null) {
            return advice;
        }
        for (GapAdviceRequest gap : gaps) {
            advice.put(gap.topic(), text(gap));
        }
        return advice;
    }

    public String text(GapAdviceRequest gap) {
        return "Có "
                + KnowledgeGapCalculator.formatPercent(gap.affectedPercent())
                + "% học sinh đang trả lời sai chủ đề \""
                + gap.topic()
                + "\". Nên chữa một bài mẫu trên lớp, rồi cho 3–5 câu cùng dạng và kiểm tra lại buổi sau.";
    }
}

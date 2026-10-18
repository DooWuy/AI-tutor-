package com.vn.aitutor.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyClassListResponse {
    private int activeCount;
    private List<StudyClassResponse> classes;
}

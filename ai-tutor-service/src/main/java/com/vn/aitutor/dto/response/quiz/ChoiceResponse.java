package com.vn.aitutor.dto.response.quiz;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChoiceResponse {
    private UUID id;
    private String key;
    private String text;
    private boolean correct;
    private int displayOrder;
}

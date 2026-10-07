package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatSessionUpdateRequest {

    @NotBlank(message = "Session title cannot be blank")
    @Size(max = 255, message = "Session title cannot exceed 255 characters")
    private String title;
}

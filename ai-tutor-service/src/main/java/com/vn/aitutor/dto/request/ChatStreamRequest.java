package com.vn.aitutor.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatStreamRequest {

    @NotBlank(message = "Message cannot be blank")
    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;
}

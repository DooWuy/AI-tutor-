package com.vn.aitutor.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClassAssignmentRequest {

    @NotNull(message = "Mã giáo viên không được để trống")
    private UUID teacherId;

    private String subject;

    @JsonProperty("isHomeroom")
    private boolean homeroom;
}

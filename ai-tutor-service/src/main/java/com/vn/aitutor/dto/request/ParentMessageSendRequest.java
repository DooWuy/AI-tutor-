package com.vn.aitutor.dto.request;

import com.vn.aitutor.entity.enums.ParentChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ParentMessageSendRequest {

    @NotNull(message = "Phải chọn lớp học")
    private UUID classId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String body;

    @NotEmpty(message = "Phải chọn ít nhất một kênh gửi")
    private List<ParentChannel> channels;
}

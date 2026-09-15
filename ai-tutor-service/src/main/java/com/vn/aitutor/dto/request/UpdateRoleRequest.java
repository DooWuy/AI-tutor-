package com.vn.aitutor.dto.request;

import com.vn.aitutor.entity.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRoleRequest {
    @NotNull(message = "Vai trò không được để trống")
    private Role role;
}

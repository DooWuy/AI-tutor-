package com.vn.aitutor.dto.response;

import lombok.*;

@AllArgsConstructor
@Builder
@NoArgsConstructor
@Getter
@Setter
public class JwtErrorResponse {
    private String error;
    private Object errorDescription;
}
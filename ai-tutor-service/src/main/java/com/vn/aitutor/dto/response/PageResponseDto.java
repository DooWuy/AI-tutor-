package com.vn.aitutor.dto.response;

import java.util.List;
import lombok.*;

@AllArgsConstructor
@Builder
@Setter
@Getter
@NoArgsConstructor
public class PageResponseDto<T> {
    private Integer page;
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
    private List<T> content;
    private Boolean hasNext;
    private Boolean hasPrevious;
}

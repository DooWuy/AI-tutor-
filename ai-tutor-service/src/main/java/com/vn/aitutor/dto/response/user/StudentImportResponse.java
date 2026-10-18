package com.vn.aitutor.dto.response.user;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportResponse {
    private int totalRows;
    private int successCount;
    private int errorCount;
    private List<StudentImportError> errors;
    private List<StudentAdminListItemResponse> createdStudents;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentImportError {
        private int rowNumber;
        private String username;
        private String email;
        private String errorMessage;
    }
}

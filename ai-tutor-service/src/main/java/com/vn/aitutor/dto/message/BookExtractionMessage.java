package com.vn.aitutor.dto.message;

import com.vn.aitutor.dto.request.ExtractStructureRequest;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookExtractionMessage {

    private UUID bookId;
    private UUID requestedBy;
    private String sourcePath;
    private int pdfPageOffset;
    private String documentType;
    private List<ExtractStructureRequest.ChapterNode> chapters;
}


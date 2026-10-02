package com.vn.aitutor.dto.request;

import java.util.List;
import lombok.Data;

@Data
public class ExtractStructureRequest {

    private Integer pdfPageOffset;
    private String documentType;
    private List<ChapterNode> chapters;

    @Data
    public static class ChapterNode {
        private String chapterName;
        private String chapterCode;
        private List<LessonNode> lessons;
    }

    @Data
    public static class LessonNode {
        private String lessonName;
        private String lessonCode;
        private Integer startPage;
        private Integer endPage;
        private String documentType;
    }
}

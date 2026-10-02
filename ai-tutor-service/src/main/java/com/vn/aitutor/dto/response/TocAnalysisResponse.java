package com.vn.aitutor.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TocAnalysisResponse {

    private int pdfPageCount;
    private Integer pdfPageOffset;
    private List<Chapter> chapters;

    @Getter
    @Builder
    public static class Chapter {
        private String chapterName;
        private boolean appendix;
        private List<Lesson> lessons;
    }

    @Getter
    @Builder
    public static class Lesson {
        private String lessonName;
        private Integer startPage;
        private Integer endPage;
        private boolean appendix;
        private String warning;
    }
}

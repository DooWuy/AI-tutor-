package com.vn.aitutor.curriculum;

import java.util.List;

public final class TocDrafts {

    private TocDrafts() {
    }

    public record TocLessonDraft(
            String lessonName,
            Integer startPage,
            Integer endPage,
            boolean appendix,
            String warning) {

        public TocLessonDraft withRange(Integer start, Integer end, boolean appendixFlag, String nextWarning) {
            return new TocLessonDraft(lessonName, start, end, appendixFlag, nextWarning);
        }
    }

    public record TocChapterDraft(String chapterName, List<TocLessonDraft> lessons, boolean appendix) {
    }
}

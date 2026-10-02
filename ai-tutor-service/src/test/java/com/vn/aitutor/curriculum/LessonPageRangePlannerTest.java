package com.vn.aitutor.curriculum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.curriculum.TocDrafts.TocChapterDraft;
import com.vn.aitutor.curriculum.TocDrafts.TocLessonDraft;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class LessonPageRangePlannerTest {

    @Test
    void fillsEndsFromTheNextLessonAndDetachesTheGlossary() {
        List<TocChapterDraft> planned = LessonPageRangePlanner.plan(List.of(
                chapter("Ôn tập và bổ sung", 6, 9, 11, 14, 16, 20, 23, 26, 29),
                chapter("Số thập phân", 32, 38, 42, 47, 51),
                chapter("Một số đơn vị đo diện tích", 53, 56, 60, 62),
                chapter("Các phép tính với số thập phân", 65, 68, 71, 76, 83, 88),
                chapter("Một số hình phẳng", 91, 98, 105, 113, 116),
                chapter("Ôn tập học kì 1", 120, 123, 127, 130, 133, 135),
                chapter("Cuối sách", lesson("Một số thuật ngữ dùng trong sách", 139))));

        assertEquals(7, planned.size());
        TocLessonDraft first = planned.get(0).lessons().get(0);
        assertEquals(6, first.startPage());
        assertEquals(8, first.endPage());
        assertNull(first.warning());

        assertEquals(29, planned.get(0).lessons().get(8).startPage());
        assertEquals(31, planned.get(0).lessons().get(8).endPage());
        assertEquals(135, planned.get(5).lessons().get(5).startPage());
        assertEquals(138, planned.get(5).lessons().get(5).endPage());

        TocChapterDraft appendix = planned.get(6);
        assertEquals("Phụ lục", appendix.chapterName());
        assertTrue(appendix.appendix());
        assertEquals(139, appendix.lessons().get(0).startPage());
        assertTrue(appendix.lessons().get(0).appendix());
        assertTrue(planned.subList(0, 6).stream()
                .flatMap(chapter -> chapter.lessons().stream())
                .noneMatch(lesson -> lesson.lessonName().contains("thuật ngữ")));
    }

    private static TocChapterDraft chapter(String name, int... starts) {
        List<TocLessonDraft> lessons = new ArrayList<>();
        for (int start : starts) {
            lessons.add(lesson("Bài " + start, start));
        }
        return new TocChapterDraft(name, lessons, false);
    }

    private static TocChapterDraft chapter(String name, TocLessonDraft lesson) {
        return new TocChapterDraft(name, List.of(lesson), false);
    }

    private static TocLessonDraft lesson(String name, int start) {
        return new TocLessonDraft(name, start, null, false, null);
    }
}

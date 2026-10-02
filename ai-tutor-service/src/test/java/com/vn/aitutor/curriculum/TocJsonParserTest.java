package com.vn.aitutor.curriculum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.curriculum.TocDrafts.TocChapterDraft;
import com.vn.aitutor.exception.ServiceUnavailableException;
import java.util.List;
import org.junit.jupiter.api.Test;

class TocJsonParserTest {

    @Test
    void parsesFencedJsonAndMergesSeveralImages() {
        String first = """
                Đây là kết quả:
                ```json
                [{"chapterName":"Chương 1","lessons":[{"lessonName":"Bài 1","startPage":6}]}]
                ```
                """;
        String second = """
                {"chapters":[{"name":"Chương 2","items":[{"lesson":"Bài 10","page":"32"}]}]}
                """;

        List<TocChapterDraft> chapters = TocJsonParser.parseAll(List.of(first, second));

        assertEquals(2, chapters.size());
        assertEquals("Chương 1", chapters.get(0).chapterName());
        assertEquals("Bài 1", chapters.get(0).lessons().get(0).lessonName());
        assertEquals(6, chapters.get(0).lessons().get(0).startPage());
        assertEquals("Chương 2", chapters.get(1).chapterName());
        assertEquals("Bài 10", chapters.get(1).lessons().get(0).lessonName());
        assertEquals(32, chapters.get(1).lessons().get(0).startPage());
    }

    @Test
    void rejectsTextThatIsNotATableOfContents() {
        assertThrows(ServiceUnavailableException.class, () -> TocJsonParser.parse("không phải mục lục"));
    }
}

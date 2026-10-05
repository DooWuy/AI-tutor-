package com.vn.aitutor.curriculum;

import com.vn.aitutor.curriculum.TocDrafts.TocChapterDraft;
import com.vn.aitutor.curriculum.TocDrafts.TocLessonDraft;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class LessonPageRangePlanner {

    private LessonPageRangePlanner() {
    }

    public static List<TocChapterDraft> plan(List<TocChapterDraft> chapters) {
        List<TocLessonDraft> flat = new ArrayList<>();
        List<Integer> chapterIndex = new ArrayList<>();
        for (int i = 0; i < chapters.size(); i++) {
            for (TocLessonDraft lesson : chapters.get(i).lessons()) {
                flat.add(lesson);
                chapterIndex.add(i);
            }
        }
        for (int i = 0; i < flat.size(); i++) {
            TocLessonDraft current = flat.get(i);
            Integer start = current.startPage();
            Integer end = current.endPage();
            if ((end == null || end < 1) && start != null && i + 1 < flat.size()) {
                Integer nextStart = flat.get(i + 1).startPage();
                if (nextStart != null && nextStart > start) {
                    end = nextStart - 1;
                }
            }
            String warning = warningFor(start, end);
            flat.set(i, current.withRange(start, end, current.appendix(), warning));
        }

        List<List<TocLessonDraft>> grouped = new ArrayList<>();
        for (int i = 0; i < chapters.size(); i++) {
            grouped.add(new ArrayList<>());
        }
        for (int i = 0; i < flat.size(); i++) {
            grouped.get(chapterIndex.get(i)).add(flat.get(i));
        }

        List<TocChapterDraft> withEnds = new ArrayList<>();
        for (int i = 0; i < chapters.size(); i++) {
            withEnds.add(new TocChapterDraft(chapters.get(i).chapterName(), grouped.get(i), chapters.get(i).appendix()));
        }
        return detachAppendix(withEnds);
    }

    public static boolean isAppendix(String lessonName) {
        if (lessonName == null) {
            return false;
        }
        return lessonName.toLowerCase(Locale.ROOT).contains("thuật ngữ");
    }

    private static List<TocChapterDraft> detachAppendix(List<TocChapterDraft> chapters) {
        List<TocChapterDraft> result = new ArrayList<>();
        List<TocLessonDraft> appendix = new ArrayList<>();
        for (TocChapterDraft chapter : chapters) {
            List<TocLessonDraft> kept = new ArrayList<>();
            for (TocLessonDraft lesson : chapter.lessons()) {
                if (isAppendix(lesson.lessonName())) {
                    appendix.add(lesson.withRange(lesson.startPage(), lesson.endPage(), true, lesson.warning()));
                } else {
                    kept.add(lesson);
                }
            }
            if (!kept.isEmpty()) {
                result.add(new TocChapterDraft(chapter.chapterName(), kept, chapter.appendix()));
            }
        }
        if (!appendix.isEmpty()) {
            result.add(new TocChapterDraft("Phụ lục", appendix, true));
        }
        return result;
    }

    private static String warningFor(Integer start, Integer end) {
        if (start == null || start < 1) {
            return "Thiếu trang bắt đầu";
        }
        if (end == null || end < 1) {
            return "Thiếu trang kết thúc";
        }
        if (end < start) {
            return "Trang kết thúc nhỏ hơn trang bắt đầu";
        }
        return null;
    }
}

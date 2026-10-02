package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.CurriculumCodes;
import com.vn.aitutor.dto.request.ExtractStructureRequest.ChapterNode;
import com.vn.aitutor.dto.request.ExtractStructureRequest.LessonNode;
import com.vn.aitutor.entity.Book;
import com.vn.aitutor.entity.Chapter;
import com.vn.aitutor.entity.Document;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.DocumentStatus;
import com.vn.aitutor.entity.enums.DocumentType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.ChapterRepository;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.repository.LessonRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookExtractionTx {

    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    private final DocumentRepository documentRepository;
    private final ICloudinaryService cloudinaryService;

    @Transactional
    public Document persist(
            Book book,
            User user,
            ChapterNode chapterNode,
            LessonNode lessonNode,
            DocumentType fallbackType,
            byte[] pdf) throws Exception {
        Chapter chapter = findOrCreateChapter(book, chapterNode);
        Lesson lesson = findOrCreateLesson(chapter, lessonNode);
        DocumentType type = DocumentType.parseOrDefault(
                lessonNode.getDocumentType(),
                fallbackType == null ? DocumentType.THEORY : fallbackType);
        String path = cloudinaryService.uploadDocumentBytes(pdf, lesson.getLessonCode() + ".pdf");
        Document doc = new Document();
        doc.setTitle(lesson.getTitle());
        doc.setFileName(lesson.getLessonCode() + ".pdf");
        doc.setFilePath(path);
        doc.setFileSize((long) pdf.length);
        doc.setFileType("application/pdf");
        doc.setSubject(book.getSubject());
        doc.setGradeLevel(book.getGradeLevel());
        doc.setLesson(lesson);
        doc.setDocumentType(type);
        doc.setStatus(DocumentStatus.PROCESSING);
        doc.setCreatedBy(user);
        return documentRepository.save(doc);
    }

    private Chapter findOrCreateChapter(Book book, ChapterNode node) {
        String title = CurriculumCodes.requireText(node.getChapterName(), "Tên chương", 2, 150);
        if (node.getChapterCode() != null && !node.getChapterCode().isBlank()) {
            String code = CurriculumCodes.normalize(node.getChapterCode(), "Mã chương");
            return chapterRepository.findByBookIdAndChapterCode(book.getId(), code)
                    .orElseGet(() -> createChapter(book, code, title));
        }
        return chapterRepository.findByBookIdAndTitleIgnoreCase(book.getId(), title)
                .orElseGet(() -> createChapter(book, nextChapterCode(book.getId()), title));
    }

    private Chapter createChapter(Book book, String code, String title) {
        Chapter chapter = new Chapter();
        chapter.setBook(book);
        chapter.setChapterCode(code);
        chapter.setTitle(title);
        chapter.setDisplayOrder(chapterRepository.maxDisplayOrder(book.getId()) + 1);
        return chapterRepository.save(chapter);
    }

    private String nextChapterCode(UUID bookId) {
        for (int i = 1; i < 1000; i++) {
            String code = String.format("C%02d", i);
            if (!chapterRepository.existsByBookIdAndChapterCode(bookId, code)) {
                return code;
            }
        }
        throw new ResourceBadRequestException("Không sinh được mã chương");
    }

    private Lesson findOrCreateLesson(Chapter chapter, LessonNode node) {
        String title = CurriculumCodes.requireText(node.getLessonName(), "Tiêu đề bài học", 2, 150);
        if (node.getLessonCode() != null && !node.getLessonCode().isBlank()) {
            String code = CurriculumCodes.normalize(node.getLessonCode(), "Mã bài học");
            return lessonRepository.findByChapterIdAndLessonCode(chapter.getId(), code)
                    .orElseGet(() -> {
                        if (lessonRepository.existsByLessonCode(code)) {
                            throw new ResourceBadRequestException("Mã bài học đã tồn tại trên hệ thống");
                        }
                        return createLesson(chapter, code, title);
                    });
        }
        return lessonRepository.findByChapterIdAndTitleIgnoreCase(chapter.getId(), title)
                .orElseGet(() -> createLesson(chapter, nextLessonCode(), title));
    }

    private Lesson createLesson(Chapter chapter, String code, String title) {
        Lesson lesson = new Lesson();
        lesson.setChapter(chapter);
        lesson.setLessonCode(code);
        lesson.setTitle(title);
        lesson.setDisplayOrder(lessonRepository.maxDisplayOrder(chapter.getId()) + 1);
        return lessonRepository.save(lesson);
    }

    private String nextLessonCode() {
        int max = 0;
        for (String code : lessonRepository.findGeneratedLessonCodes()) {
            if (code != null && code.matches("L\\d{5}")) {
                max = Math.max(max, Integer.parseInt(code.substring(1)));
            }
        }
        for (int candidate = max + 1; candidate < 100000; candidate++) {
            String code = String.format("L%05d", candidate);
            if (!lessonRepository.existsByLessonCode(code)) {
                return code;
            }
        }
        throw new ResourceBadRequestException("Không sinh được mã bài học");
    }
}

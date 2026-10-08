package com.vn.aitutor.service;

import com.vn.aitutor.curriculum.CurriculumCodes;
import com.vn.aitutor.curriculum.GradeLevels;
import com.vn.aitutor.dto.request.BookUpsertRequest;
import com.vn.aitutor.dto.request.ChapterUpsertRequest;
import com.vn.aitutor.dto.request.LessonUpsertRequest;
import com.vn.aitutor.dto.response.BookResponse;
import com.vn.aitutor.dto.response.ChapterResponse;
import com.vn.aitutor.dto.response.LessonResponse;
import com.vn.aitutor.entity.Book;
import com.vn.aitutor.entity.Chapter;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.enums.SubjectCode;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.BookRepository;
import com.vn.aitutor.repository.ChapterRepository;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CurriculumService {

    private final BookRepository bookRepository;
    private final ChapterRepository chapterRepository;
    private final LessonRepository lessonRepository;
    private final DocumentRepository documentRepository;
    private final QuestionBankRepository questionBankRepository;

    @Transactional
    public BookResponse createBook(BookUpsertRequest request) {
        Book book = new Book();
        applyBook(book, request);
        return toBook(bookRepository.save(book), false);
    }

    @Transactional(readOnly = true)
    public List<BookResponse> listBooks(String subject, String gradeLevel) {
        String subjectCode = blankToNull(subject) == null ? null : SubjectCode.parseRequired(subject).name();
        String grade = blankToNull(gradeLevel) == null ? null : GradeLevels.normalize(gradeLevel);
        List<Book> books;
        if (subjectCode != null && grade != null) {
            books = bookRepository.findBySubjectAndGradeLevelOrderByTitleAsc(subjectCode, grade);
        } else if (subjectCode != null) {
            books = bookRepository.findBySubjectOrderByTitleAsc(subjectCode);
        } else if (grade != null) {
            books = bookRepository.findByGradeLevelOrderByTitleAsc(grade);
        } else {
            books = bookRepository.findAllByOrderByTitleAsc();
        }
        return books.stream().map(book -> {
            List<ChapterResponse> chapters = chapterRepository.findByBookIdOrderByDisplayOrderAsc(book.getId()).stream()
                    .map(chapter -> toChapter(chapter, true))
                    .toList();
            BookResponse response = toBook(book, false);
            return BookResponse.builder()
                    .id(response.getId())
                    .title(response.getTitle())
                    .subject(response.getSubject())
                    .gradeLevel(response.getGradeLevel())
                    .curriculumName(response.getCurriculumName())
                    .createdAt(response.getCreatedAt())
                    .updatedAt(response.getUpdatedAt())
                    .chapters(chapters)
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public BookResponse getBook(UUID bookId) {
        Book book = requireBook(bookId);
        List<ChapterResponse> chapters = chapterRepository.findByBookIdOrderByDisplayOrderAsc(bookId).stream()
                .map(chapter -> toChapter(chapter, true))
                .toList();
        BookResponse response = toBook(book, false);
        return BookResponse.builder()
                .id(response.getId())
                .title(response.getTitle())
                .subject(response.getSubject())
                .gradeLevel(response.getGradeLevel())
                .curriculumName(response.getCurriculumName())
                .createdAt(response.getCreatedAt())
                .updatedAt(response.getUpdatedAt())
                .chapters(chapters)
                .build();
    }

    @Transactional
    public BookResponse updateBook(UUID bookId, BookUpsertRequest request) {
        Book book = requireBook(bookId);
        applyBook(book, request);
        return toBook(bookRepository.save(book), false);
    }

    @Transactional
    public void deleteBook(UUID bookId) {
        Book book = requireBook(bookId);
        if (chapterRepository.existsByBookId(book.getId())) {
            throw new ResourceBadRequestException(
                    "Không thể xóa sách vì vẫn còn chương học. Hãy xóa các chương trước.");
        }
        bookRepository.delete(book);
    }

    @Transactional
    public ChapterResponse createChapter(UUID bookId, ChapterUpsertRequest request) {
        Book book = requireBook(bookId);
        String code = CurriculumCodes.normalize(request.getChapterCode(), "Mã chương");
        if (chapterRepository.existsByBookIdAndChapterCode(bookId, code)) {
            throw new ResourceBadRequestException("Mã chương đã tồn tại trong sách");
        }
        Chapter chapter = new Chapter();
        chapter.setBook(book);
        chapter.setChapterCode(code);
        chapter.setTitle(CurriculumCodes.requireText(request.getTitle(), "Tên chương", 2, 150));
        chapter.setDisplayOrder(request.getDisplayOrder() == null
                ? chapterRepository.maxDisplayOrder(bookId) + 1
                : request.getDisplayOrder());
        return toChapter(chapterRepository.save(chapter), false);
    }

    @Transactional
    public ChapterResponse updateChapter(UUID chapterId, ChapterUpsertRequest request) {
        Chapter chapter = requireChapter(chapterId);
        String code = CurriculumCodes.normalize(request.getChapterCode(), "Mã chương");
        chapterRepository.findByBookIdAndChapterCode(chapter.getBook().getId(), code)
                .filter(existing -> !existing.getId().equals(chapterId))
                .ifPresent(existing -> {
                    throw new ResourceBadRequestException("Mã chương đã tồn tại trong sách");
                });
        chapter.setChapterCode(code);
        chapter.setTitle(CurriculumCodes.requireText(request.getTitle(), "Tên chương", 2, 150));
        if (request.getDisplayOrder() != null) {
            chapter.setDisplayOrder(request.getDisplayOrder());
        }
        return toChapter(chapterRepository.save(chapter), false);
    }

    @Transactional
    public void deleteChapter(UUID chapterId) {
        Chapter chapter = requireChapter(chapterId);
        if (lessonRepository.existsByChapterId(chapter.getId())) {
            throw new ResourceBadRequestException(
                    "Không thể xóa chương vì vẫn còn bài học. Hãy xóa các bài học trước.");
        }
        chapterRepository.delete(chapter);
    }

    @Transactional
    public LessonResponse createLesson(UUID chapterId, LessonUpsertRequest request) {
        Chapter chapter = requireChapter(chapterId);
        String code = CurriculumCodes.normalize(request.getLessonCode(), "Mã bài học");
        if (lessonRepository.existsByLessonCode(code)) {
            throw new ResourceBadRequestException("Mã bài học đã tồn tại trên hệ thống");
        }
        Lesson lesson = new Lesson();
        lesson.setChapter(chapter);
        lesson.setLessonCode(code);
        lesson.setTitle(CurriculumCodes.requireText(request.getTitle(), "Tiêu đề bài học", 2, 150));
        lesson.setDisplayOrder(request.getDisplayOrder() == null
                ? lessonRepository.maxDisplayOrder(chapterId) + 1
                : request.getDisplayOrder());
        return toLesson(lessonRepository.save(lesson));
    }

    @Transactional
    public LessonResponse updateLesson(UUID lessonId, LessonUpsertRequest request) {
        Lesson lesson = requireLesson(lessonId);
        String code = CurriculumCodes.normalize(request.getLessonCode(), "Mã bài học");
        if (lessonRepository.existsByLessonCode(code) && !code.equals(lesson.getLessonCode())) {
            throw new ResourceBadRequestException("Mã bài học đã tồn tại trên hệ thống");
        }
        lesson.setLessonCode(code);
        lesson.setTitle(CurriculumCodes.requireText(request.getTitle(), "Tiêu đề bài học", 2, 150));
        if (request.getDisplayOrder() != null) {
            lesson.setDisplayOrder(request.getDisplayOrder());
        }
        return toLesson(lessonRepository.save(lesson));
    }

    @Transactional
    public void deleteLesson(UUID lessonId) {
        Lesson lesson = requireLesson(lessonId);
        if (documentRepository.existsByLessonId(lesson.getId())) {
            throw new ResourceBadRequestException(
                    "Không thể xóa bài học vì vẫn còn tài liệu liên kết. Hãy xóa các tài liệu trước.");
        }
        if (questionBankRepository.existsByLessonId(lesson.getId())) {
            throw new ResourceBadRequestException(
                    "Không thể xóa bài học vì vẫn còn câu hỏi trong ngân hàng. Hãy xóa các câu hỏi trước.");
        }
        lessonRepository.delete(lesson);
    }

    public Book requireBook(UUID bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách"));
    }

    public Chapter requireChapter(UUID chapterId) {
        return chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương"));
    }

    public Lesson requireLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học"));
    }

    private void applyBook(Book book, BookUpsertRequest request) {
        book.setTitle(CurriculumCodes.requireText(request.getTitle(), "Tên sách", 2, 100));
        book.setSubject(SubjectCode.parseRequired(request.getSubject()).name());
        book.setGradeLevel(GradeLevels.normalize(request.getGradeLevel()));
        book.setCurriculumName(CurriculumCodes.requireText(request.getCurriculumName(), "Chương trình học", 2, 50));
    }

    private BookResponse toBook(Book book, boolean withChapters) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .subject(book.getSubject())
                .gradeLevel(book.getGradeLevel())
                .curriculumName(book.getCurriculumName())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .chapters(withChapters ? List.of() : null)
                .build();
    }

    private ChapterResponse toChapter(Chapter chapter, boolean withLessons) {
        List<LessonResponse> lessons = withLessons
                ? lessonRepository.findByChapterIdOrderByDisplayOrderAsc(chapter.getId()).stream()
                        .map(this::toLesson)
                        .toList()
                : null;
        return ChapterResponse.builder()
                .id(chapter.getId())
                .bookId(chapter.getBook().getId())
                .chapterCode(chapter.getChapterCode())
                .title(chapter.getTitle())
                .displayOrder(chapter.getDisplayOrder())
                .lessons(lessons)
                .build();
    }

    private LessonResponse toLesson(Lesson lesson) {
        return LessonResponse.builder()
                .id(lesson.getId())
                .chapterId(lesson.getChapter().getId())
                .lessonCode(lesson.getLessonCode())
                .title(lesson.getTitle())
                .displayOrder(lesson.getDisplayOrder())
                .build();
    }

    private String blankToNull(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw;
    }
}

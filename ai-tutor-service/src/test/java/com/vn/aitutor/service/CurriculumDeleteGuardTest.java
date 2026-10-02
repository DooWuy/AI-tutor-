package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.entity.Book;
import com.vn.aitutor.entity.Chapter;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.repository.BookRepository;
import com.vn.aitutor.repository.ChapterRepository;
import com.vn.aitutor.repository.DocumentRepository;
import com.vn.aitutor.repository.LessonRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CurriculumDeleteGuardTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private ChapterRepository chapterRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private DocumentRepository documentRepository;
    @InjectMocks
    private CurriculumService curriculumService;

    @Test
    void refusesToDeleteABookThatStillHasChapters() {
        UUID bookId = UUID.randomUUID();
        Book book = new Book();
        book.setId(bookId);
        when(bookRepository.findById(bookId)).thenReturn(Optional.of(book));
        when(chapterRepository.existsByBookId(bookId)).thenReturn(true);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class, () -> curriculumService.deleteBook(bookId));

        assertTrue(error.getMessage().contains("chương"));
        verify(bookRepository, never()).delete(book);
    }

    @Test
    void refusesToDeleteAChapterThatStillHasLessons() {
        UUID chapterId = UUID.randomUUID();
        Chapter chapter = new Chapter();
        chapter.setId(chapterId);
        when(chapterRepository.findById(chapterId)).thenReturn(Optional.of(chapter));
        when(lessonRepository.existsByChapterId(chapterId)).thenReturn(true);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class, () -> curriculumService.deleteChapter(chapterId));

        assertTrue(error.getMessage().contains("bài học"));
        verify(chapterRepository, never()).delete(chapter);
    }

    @Test
    void refusesToDeleteALessonThatStillHasDocuments() {
        UUID lessonId = UUID.randomUUID();
        Lesson lesson = new Lesson();
        lesson.setId(lessonId);
        when(lessonRepository.findById(lessonId)).thenReturn(Optional.of(lesson));
        when(documentRepository.existsByLessonId(lessonId)).thenReturn(true);

        ResourceBadRequestException error = assertThrows(
                ResourceBadRequestException.class, () -> curriculumService.deleteLesson(lessonId));

        assertTrue(error.getMessage().contains("tài liệu"));
        verify(lessonRepository, never()).delete(lesson);
    }
}

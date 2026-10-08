package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuestionChoiceRepository;
import com.vn.aitutor.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuestionBankServiceTest {

    @Mock
    private QuestionBankRepository questionBankRepository;
    @Mock
    private QuestionChoiceRepository questionChoiceRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private DocumentChunkRepository documentChunkRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private QuestionComposer questionComposer;
    @InjectMocks
    private QuestionBankService questionBankService;

    @Test
    void bulkDeleteRemovesTenQuestionsAndTheirChoices() {
        List<UUID> ids = IntStream.range(0, 10).mapToObj(i -> UUID.randomUUID()).toList();
        when(questionBankRepository.countByIdIn(ids)).thenReturn(10L);

        int deleted = questionBankService.bulkDelete(ids);

        assertEquals(10, deleted);
        verify(questionChoiceRepository).deleteByQuestionIdIn(ids);
        verify(questionBankRepository).deleteAllById(ids);
    }

    @Test
    void bulkDeleteStopsWhenAQuestionIsMissing() {
        List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID());
        when(questionBankRepository.countByIdIn(ids)).thenReturn(1L);

        assertThrows(ResourceNotFoundException.class, () -> questionBankService.bulkDelete(ids));

        verify(questionChoiceRepository, never()).deleteByQuestionIdIn(ids);
        verify(questionBankRepository, never()).deleteAllById(ids);
    }
}

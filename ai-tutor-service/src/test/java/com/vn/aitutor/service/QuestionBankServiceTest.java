package com.vn.aitutor.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.vn.aitutor.dto.response.QuestionImportResponse;
import com.vn.aitutor.entity.Lesson;
import com.vn.aitutor.entity.QuestionBankItem;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.entity.enums.QuestionType;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.quiz.QuestionBankWorkbook;
import com.vn.aitutor.repository.DocumentChunkRepository;
import com.vn.aitutor.repository.LessonRepository;
import com.vn.aitutor.repository.QuestionBankRepository;
import com.vn.aitutor.repository.QuestionChoiceRepository;
import com.vn.aitutor.repository.UserRepository;
import com.vn.aitutor.security.principal.UserPrincipal;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.mockito.ArgumentCaptor;
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

    @Test
    void importExcelSavesValidRowsAndReportsTheInvalidOne() throws IOException {
        UUID lessonId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        UserPrincipal principal = UserPrincipal.builder().users(user).build();
        when(lessonRepository.findWithBook(lessonId)).thenReturn(Optional.of(new Lesson()));
        when(userRepository.getReferenceById(userId)).thenReturn(user);

        QuestionImportResponse result = questionBankService.importExcel(
                lessonId, "bo-cau-hoi.xlsx", withShortStem(QuestionBankWorkbook.template()), principal);

        assertEquals(4, result.getImported());
        assertEquals(1, result.getFailed());
        assertEquals(6, result.getErrors().get(0).getRow());
        assertEquals("Nội dung câu hỏi phải từ 10 đến 2000 ký tự", result.getErrors().get(0).getMessage());
        ArgumentCaptor<QuestionBankItem> saved = ArgumentCaptor.forClass(QuestionBankItem.class);
        verify(questionBankRepository, times(4)).save(saved.capture());
        assertEquals(QuestionType.MULTIPLE_CHOICE, saved.getAllValues().get(0).getQuestionType());
        assertEquals(QuestionType.TRUE_FALSE, saved.getAllValues().get(1).getQuestionType());
        assertEquals(QuestionType.FILL_BLANK, saved.getAllValues().get(2).getQuestionType());
        assertEquals("8", saved.getAllValues().get(2).getCorrectText());
        assertEquals(QuestionType.MULTI_SELECT, saved.getAllValues().get(3).getQuestionType());
        assertEquals(2, saved.getAllValues().get(3).getChoices().stream().filter(choice -> choice.isCorrect()).count());
    }

    @Test
    void importExcelRejectsAFileThatIsNotXlsx() {
        assertThrows(ResourceBadRequestException.class, () -> questionBankService.importExcel(
                UUID.randomUUID(), "cau-hoi.csv", new byte[] {1, 2, 3}, UserPrincipal.builder().build()));

        verify(questionBankRepository, never()).save(any());
    }

    private static byte[] withShortStem(byte[] template) throws IOException {
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(template));
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            var row = workbook.getSheetAt(0).createRow(5);
            row.createCell(0).setCellValue("Trắc nghiệm");
            row.createCell(1).setCellValue("ngắn");
            row.createCell(2).setCellValue("Lời giải này đủ dài.");
            row.createCell(3).setCellValue(2);
            row.createCell(5).setCellValue("1");
            row.createCell(6).setCellValue("2");
            row.createCell(11).setCellValue("A");
            workbook.write(out);
            return out.toByteArray();
        }
    }
}

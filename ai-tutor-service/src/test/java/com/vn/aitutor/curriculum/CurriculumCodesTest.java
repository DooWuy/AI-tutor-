package com.vn.aitutor.curriculum;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.vn.aitutor.exception.ResourceBadRequestException;
import org.junit.jupiter.api.Test;

class CurriculumCodesTest {

    @Test
    void uppercasesCodesAndRejectsPunctuation() {
        assertEquals("BAI01", CurriculumCodes.normalize(" bai01 ", "Mã bài học"));
        assertThrows(ResourceBadRequestException.class, () -> CurriculumCodes.normalize("bài-1", "Mã bài học"));
        assertThrows(ResourceBadRequestException.class, () -> CurriculumCodes.normalize("A", "Mã chương"));
    }

    @Test
    void normalizesGradeTenElevenAndTwelve() {
        assertEquals("10", GradeLevels.normalize("Lớp 10"));
        assertEquals("11", GradeLevels.normalize("Khối 11"));
        assertEquals("12", GradeLevels.normalize("12"));
        assertThrows(ResourceBadRequestException.class, () -> GradeLevels.normalize("Lớp 5"));
    }

    @Test
    void checksTextLength() {
        assertEquals("Toán 10", CurriculumCodes.requireText(" Toán 10 ", "Tên sách", 2, 100));
        assertThrows(ResourceBadRequestException.class, () -> CurriculumCodes.requireText("A", "Tên sách", 2, 100));
    }
}

package com.vn.aitutor.notification;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.vn.aitutor.entity.enums.SubjectCode;
import org.junit.jupiter.api.Test;

class SubjectNamesTest {

    @Test
    void mapsVietnameseSubjectLabels() {
        assertEquals(SubjectCode.HOA, SubjectNames.match("Hóa Học").orElseThrow());
        assertEquals(SubjectCode.HOA, SubjectNames.match("Hóa").orElseThrow());
        assertEquals(SubjectCode.HOA, SubjectNames.match("hoa hoc").orElseThrow());
        assertEquals(SubjectCode.TOAN, SubjectNames.match("Toán học").orElseThrow());
        assertEquals(SubjectCode.LY, SubjectNames.match("Vật lý").orElseThrow());
        assertEquals(SubjectCode.ANH, SubjectNames.match("Tiếng Anh").orElseThrow());
    }

    @Test
    void unknownLabelDoesNotGuess() {
        assertTrue(SubjectNames.match("Thể dục").isEmpty());
        assertTrue(SubjectNames.match("  ").isEmpty());
        assertTrue(SubjectNames.match(null).isEmpty());
    }
}

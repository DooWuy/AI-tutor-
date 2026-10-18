package com.vn.aitutor.service.workbook;

import static org.junit.jupiter.api.Assertions.*;

import com.vn.aitutor.entity.enums.Gender;
import com.vn.aitutor.exception.ResourceBadRequestException;
import java.util.List;
import org.junit.jupiter.api.Test;

class StudentWorkbookTest {

    @Test
    void templateGeneratesValidExcelBytes() {
        byte[] bytes = StudentWorkbook.template();
        assertNotNull(bytes);
        assertTrue(bytes.length > 0);

        List<StudentWorkbook.StudentExcelRow> rows = StudentWorkbook.read(bytes);
        assertNotNull(rows);
        assertEquals(2, rows.size());

        StudentWorkbook.StudentExcelRow first = rows.get(0);
        assertEquals("hocsinh01", first.getUsername());
        assertEquals("hocsinh01@example.com", first.getEmail());
        assertEquals("Nguyễn Văn An", first.getFullName());
        assertEquals(Gender.MALE, first.getGender());
        assertEquals("THPT Chuyên Lê Hồng Phong", first.getSchoolName());
        assertEquals("Khối 11", first.getGradeLevel());
        assertEquals("11A1", first.getClassName());
    }

    @Test
    void readThrowsExceptionOnEmptyContent() {
        assertThrows(ResourceBadRequestException.class, () -> StudentWorkbook.read(null));
        assertThrows(ResourceBadRequestException.class, () -> StudentWorkbook.read(new byte[0]));
    }
}

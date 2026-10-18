package com.vn.aitutor.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.classroom.ScheduleCreateRequest;
import com.vn.aitutor.dto.response.ApiResponse;
import com.vn.aitutor.dto.response.classroom.OcrExtractionResponse;
import com.vn.aitutor.dto.response.classroom.ScheduleResponse;
import com.vn.aitutor.dto.response.classroom.ScheduleSlotDto;
import com.vn.aitutor.entity.User;
import com.vn.aitutor.security.principal.UserPrincipal;
import com.vn.aitutor.service.classroom.IScheduleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class ScheduleControllerTest {

    @Mock
    private IScheduleService scheduleService;

    private ScheduleController controller;
    private UserPrincipal principal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        controller = new ScheduleController(scheduleService);
        userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        principal = UserPrincipal.builder().users(user).build();
    }

    @Test
    void extractScheduleFromImage_returnsExtractedSlots() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "schedule.jpg", "image/jpeg", "image".getBytes());
        OcrExtractionResponse ocrResponse = OcrExtractionResponse.builder()
                .name("Thời khóa biểu")
                .slots(Collections.emptyList())
                .build();

        when(scheduleService.extractScheduleFromImage(file)).thenReturn(ocrResponse);

        ResponseEntity<ApiResponse<OcrExtractionResponse>> response = controller.extractScheduleFromImage(file);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Thời khóa biểu", response.getBody().getData().getName());
    }

    @Test
    void createSchedule_returnsCreated() {
        ScheduleCreateRequest request = new ScheduleCreateRequest();
        ScheduleResponse scheduleResponse = ScheduleResponse.builder()
                .id(UUID.randomUUID())
                .name("TKB Mới")
                .isActive(true)
                .build();

        when(scheduleService.createSchedule(userId, request)).thenReturn(scheduleResponse);

        ResponseEntity<ApiResponse<ScheduleResponse>> response = controller.createSchedule(principal, request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("TKB Mới", response.getBody().getData().getName());
    }

    @Test
    void getActiveSchedule_returnsActive() {
        ScheduleResponse scheduleResponse = ScheduleResponse.builder()
                .id(UUID.randomUUID())
                .name("TKB Hiện Tại")
                .isActive(true)
                .build();

        when(scheduleService.getActiveSchedule(userId)).thenReturn(scheduleResponse);

        ResponseEntity<ApiResponse<ScheduleResponse>> response = controller.getActiveSchedule(principal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("TKB Hiện Tại", response.getBody().getData().getName());
    }

    @Test
    void addScheduleSlot_returnsSlot() {
        ScheduleSlotDto slotDto = ScheduleSlotDto.builder().subjectName("Vật lý").build();
        when(scheduleService.addScheduleSlot(userId, slotDto)).thenReturn(slotDto);

        ResponseEntity<ApiResponse<ScheduleSlotDto>> response = controller.addScheduleSlot(principal, slotDto);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Vật lý", response.getBody().getData().getSubjectName());
    }

    @Test
    void deleteScheduleSlot_returnsSuccess() {
        UUID slotId = UUID.randomUUID();

        ResponseEntity<ApiResponse<Void>> response = controller.deleteScheduleSlot(principal, slotId);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        verify(scheduleService).deleteScheduleSlot(userId, slotId);
    }
}

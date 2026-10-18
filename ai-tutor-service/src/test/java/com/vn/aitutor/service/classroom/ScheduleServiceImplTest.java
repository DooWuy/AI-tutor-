package com.vn.aitutor.service.classroom;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.vn.aitutor.dto.request.classroom.ScheduleCreateRequest;
import com.vn.aitutor.dto.response.classroom.ScheduleResponse;
import com.vn.aitutor.dto.response.classroom.ScheduleSlotDto;
import com.vn.aitutor.entity.Schedule;
import com.vn.aitutor.entity.ScheduleSlot;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.ScheduleRepository;
import com.vn.aitutor.repository.ScheduleSlotRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.service.system.ISystemSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceImplTest {

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleSlotRepository scheduleSlotRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ISystemSettingsService systemSettingsService;

    private ScheduleServiceImpl service;
    private UUID userId;
    private Student student;

    @BeforeEach
    void setUp() {
        service = new ScheduleServiceImpl(
                scheduleRepository,
                scheduleSlotRepository,
                studentRepository,
                systemSettingsService
        );

        userId = UUID.randomUUID();
        student = new Student();
        student.setId(UUID.randomUUID());
    }

    @Test
    void createSchedule_studentNotFound_throwsNotFound() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.empty());

        ScheduleCreateRequest request = new ScheduleCreateRequest();
        request.setSlots(List.of(ScheduleSlotDto.builder().build()));

        assertThrows(ResourceNotFoundException.class, () ->
                service.createSchedule(userId, request));
    }

    @Test
    void createSchedule_emptySlots_throwsBadRequest() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));

        ScheduleCreateRequest request = new ScheduleCreateRequest();
        request.setSlots(Collections.emptyList());

        assertThrows(ResourceBadRequestException.class, () ->
                service.createSchedule(userId, request));
    }

    @Test
    void createSchedule_invalidTimeRange_throwsBadRequest() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));

        ScheduleSlotDto slot = ScheduleSlotDto.builder()
                .dayOfWeek(2)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(8, 0)) // startTime >= endTime
                .subjectName("Toán")
                .build();

        ScheduleCreateRequest request = new ScheduleCreateRequest();
        request.setSlots(List.of(slot));

        assertThrows(ResourceBadRequestException.class, () ->
                service.createSchedule(userId, request));
    }

    @Test
    void createSchedule_overlappingSlots_withoutAllowOverlap_throwsBadRequest() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));

        ScheduleSlotDto slot1 = ScheduleSlotDto.builder()
                .dayOfWeek(2)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(9, 30))
                .subjectName("Toán")
                .build();

        ScheduleSlotDto slot2 = ScheduleSlotDto.builder()
                .dayOfWeek(2)
                .startTime(LocalTime.of(9, 0)) // Trùng giờ từ 9:00 đến 9:30
                .endTime(LocalTime.of(10, 30))
                .subjectName("Văn")
                .build();

        ScheduleCreateRequest request = new ScheduleCreateRequest();
        request.setAllowOverlap(false);
        request.setSlots(List.of(slot1, slot2));

        ResourceConflictException ex = assertThrows(ResourceConflictException.class, () ->
                service.createSchedule(userId, request));
        assertTrue(ex.getMessage().contains("Trùng lịch"));
    }

    @Test
    void createSchedule_overlappingSlots_withAllowOverlapTrue_success() {
        when(studentRepository.findByUserId(userId)).thenReturn(Optional.of(student));

        ScheduleSlotDto slot1 = ScheduleSlotDto.builder()
                .dayOfWeek(2)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(9, 30))
                .subjectName("Toán")
                .build();

        ScheduleSlotDto slot2 = ScheduleSlotDto.builder()
                .dayOfWeek(2)
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 30))
                .subjectName("Văn")
                .build();

        ScheduleCreateRequest request = new ScheduleCreateRequest();
        request.setAllowOverlap(true); // Cho phép ghi đè/trùng lịch
        request.setName("TKB Học Kỳ 1");
        request.setSlots(List.of(slot1, slot2));

        when(scheduleRepository.findByStudentId(student.getId())).thenReturn(Collections.emptyList());
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        ScheduleResponse response = service.createSchedule(userId, request);

        assertNotNull(response);
        assertEquals("TKB Học Kỳ 1", response.getName());
        assertTrue(response.isActive());
        assertEquals(2, response.getSlots().size());
        verify(scheduleSlotRepository).saveAll(anyList());
    }

    @Test
    void getActiveSchedule_whenNoneExists_returnsInactiveSchedule() {
        when(scheduleRepository.findActiveScheduleByUserId(userId)).thenReturn(Optional.empty());

        ScheduleResponse response = service.getActiveSchedule(userId);

        assertNotNull(response);
        assertFalse(response.isActive());
        assertTrue(response.getSlots().isEmpty());
    }

    @Test
    void getActiveSchedule_whenExists_returnsActiveScheduleWithSlots() {
        Schedule schedule = new Schedule();
        schedule.setId(UUID.randomUUID());
        schedule.setName("Thời khóa biểu chính khóa");
        schedule.setActive(true);

        ScheduleSlot slot = new ScheduleSlot();
        slot.setId(UUID.randomUUID());
        slot.setDayOfWeek(3);
        slot.setStartTime(LocalTime.of(7, 30));
        slot.setEndTime(LocalTime.of(9, 0));
        slot.setSubjectName("Tiếng Anh");

        when(scheduleRepository.findActiveScheduleByUserId(userId)).thenReturn(Optional.of(schedule));
        when(scheduleSlotRepository.findByScheduleId(schedule.getId())).thenReturn(List.of(slot));

        ScheduleResponse response = service.getActiveSchedule(userId);

        assertNotNull(response);
        assertEquals("Thời khóa biểu chính khóa", response.getName());
        assertTrue(response.isActive());
        assertEquals(1, response.getSlots().size());
        assertEquals("Tiếng Anh", response.getSlots().get(0).getSubjectName());
    }
}

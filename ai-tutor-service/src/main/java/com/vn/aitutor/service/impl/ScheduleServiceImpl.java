package com.vn.aitutor.service.impl;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import com.vn.aitutor.dto.ScheduleSlotDto;
import com.vn.aitutor.dto.request.ScheduleCreateRequest;
import com.vn.aitutor.dto.response.OcrExtractionResponse;
import com.vn.aitutor.dto.response.ScheduleResponse;
import com.vn.aitutor.entity.Schedule;
import com.vn.aitutor.entity.ScheduleSlot;
import com.vn.aitutor.entity.Student;
import com.vn.aitutor.exception.ResourceBadRequestException;
import com.vn.aitutor.exception.ResourceConflictException;
import com.vn.aitutor.exception.ResourceNotFoundException;
import com.vn.aitutor.repository.ScheduleRepository;
import com.vn.aitutor.repository.ScheduleSlotRepository;
import com.vn.aitutor.repository.StudentRepository;
import com.vn.aitutor.service.IScheduleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ScheduleServiceImpl implements IScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key:default_key_placeholder}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent}")
    private String geminiApiUrl;

    // Giới hạn file 5MB chống OOM DoS
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository, 
                               ScheduleSlotRepository scheduleSlotRepository, 
                               StudentRepository studentRepository) {
        this.scheduleRepository = scheduleRepository;
        this.scheduleSlotRepository = scheduleSlotRepository;
        this.studentRepository = studentRepository;
        
        // [Security Fix] Cấu hình ObjectMapper bỏ qua trường lạ từ AI
        this.objectMapper = JsonMapper.builder()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .build();
                
        // [Security Fix] Thiết lập Timeout (Connect: 5s, Read: 120s)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(120000); // Tăng lên 120s vì AI xử lý ảnh mất nhiều thời gian
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public OcrExtractionResponse extractScheduleFromImage(MultipartFile file) throws Exception {
        // [Security Fix] File Validation an toàn hơn
        if (file.isEmpty() || file.getSize() > MAX_FILE_SIZE) {
            throw new ResourceBadRequestException("File tải lên phải nhỏ hơn 5MB và không được để trống.");
        }
        
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new ResourceBadRequestException("Chỉ chấp nhận định dạng ảnh JPEG, PNG, WEBP.");
        }

        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String prompt = "Trích xuất thông tin thời khóa biểu trong ảnh thành mảng JSON. " +
            "Ánh xạ các 'tiết học' thành giờ thực tế 'startTime' (VD: 07:00:00) và 'endTime' (VD: 09:15:00). " +
            "Trả về CHỈ một mảng JSON array chứa các object: dayOfWeek (2 đến 8), subjectName, startTime, endTime, teacherName, room. " +
            "KHÔNG bọc trong markdown (```json).";

        Map<String, Object> requestBody = buildGeminiRequest(prompt, base64Image, mimeType);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            String url = geminiApiUrl + "?key=" + geminiApiKey;
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            String extractedJsonText = extractTextFromGeminiResponse(response.getBody());
            // [Fix] Regex xử lý chặt hơn các format markdown thừa
            extractedJsonText = extractedJsonText.replaceAll("(?is)^```json\\s*|\\s*```$", "").trim();

            List<ScheduleSlotDto> slots = objectMapper.readValue(extractedJsonText, new TypeReference<List<ScheduleSlotDto>>() {});

            return OcrExtractionResponse.builder()
                    .status("success")
                    .data(slots)
                    .build();

        } catch (RestClientException e) {
            log.error("AI Service Timeout/Connection Error: {}", e.getMessage());
            throw new ResourceBadRequestException("Dịch vụ nhận diện ảnh đang bận, vui lòng thử lại sau.");
        } catch (JacksonException e) {
            log.error("AI trả về định dạng JSON không hợp lệ.");
            throw new ResourceBadRequestException("Hệ thống không thể nhận diện thời khóa biểu này. Vui lòng chụp rõ hơn hoặc nhập tay.");
        }
    }

    @Override
    @Transactional
    public ScheduleResponse createSchedule(UUID userId, ScheduleCreateRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh với User ID: " + userId));

        // Validate đầu vào
        if (request.getSlots() == null || request.getSlots().isEmpty()) {
            throw new ResourceBadRequestException("Danh sách môn học không được để trống.");
        }

        // Validate thời gian và trùng lặp
        validateScheduleSlots(request.getSlots());

        // Hủy kích hoạt các lịch cũ
        List<Schedule> oldSchedules = scheduleRepository.findByStudentId(student.getId());
        for (Schedule old : oldSchedules) {
            old.setActive(false);
        }
        scheduleRepository.saveAll(oldSchedules);

        // Tạo lịch mới
        Schedule schedule = new Schedule();
        schedule.setStudent(student);
        schedule.setName(request.getName() != null ? request.getName() : "Thời khóa biểu");
        schedule.setActive(true);
        Schedule savedSchedule = scheduleRepository.save(schedule);

        List<ScheduleSlot> slotsToSave = request.getSlots().stream().map(dto -> {
            ScheduleSlot slot = new ScheduleSlot();
            slot.setSchedule(savedSchedule);
            slot.setDayOfWeek(dto.getDayOfWeek());
            slot.setStartTime(dto.getStartTime());
            slot.setEndTime(dto.getEndTime());
            slot.setSubjectName(dto.getSubjectName());
            slot.setTeacherName(dto.getTeacherName());
            slot.setRoom(dto.getRoom());
            slot.setScheduleType(dto.getScheduleType());
            return slot;
        }).collect(Collectors.toList());

        scheduleSlotRepository.saveAll(slotsToSave);

        return mapToResponse(savedSchedule, request.getSlots());
    }

    @Override
    public ScheduleResponse getActiveSchedule(UUID userId) {
        Schedule schedule = scheduleRepository.findActiveScheduleByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thời khóa biểu đang hoạt động cho User này"));
        List<ScheduleSlot> slots = scheduleSlotRepository.findByScheduleId(schedule.getId());
        
        List<ScheduleSlotDto> slotDtos = slots.stream().map(slot -> ScheduleSlotDto.builder()
                .id(slot.getId())
                .dayOfWeek(slot.getDayOfWeek())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .subjectName(slot.getSubjectName())
                .teacherName(slot.getTeacherName())
                .room(slot.getRoom())
                .scheduleType(slot.getScheduleType())
                .build()).collect(Collectors.toList());

        return mapToResponse(schedule, slotDtos);
    }

    private void validateScheduleSlots(List<ScheduleSlotDto> slots) {
        // Group by day of week
        Map<Integer, List<ScheduleSlotDto>> slotsByDay = slots.stream()
                .collect(Collectors.groupingBy(ScheduleSlotDto::getDayOfWeek));

        for (Map.Entry<Integer, List<ScheduleSlotDto>> entry : slotsByDay.entrySet()) {
            Integer day = entry.getKey();
            if (day == null || day < 2 || day > 8) {
                throw new ResourceBadRequestException("Thứ trong tuần phải nằm trong khoảng từ 2 (Thứ 2) đến 8 (Chủ nhật).");
            }

            List<ScheduleSlotDto> daySlots = entry.getValue();
            
            // Validate: Start time must be before End time
            for (ScheduleSlotDto slot : daySlots) {
                if (slot.getStartTime() == null || slot.getEndTime() == null) {
                    throw new ResourceBadRequestException("Thời gian bắt đầu và kết thúc không được để trống.");
                }
                if (!slot.getStartTime().isBefore(slot.getEndTime())) {
                    throw new ResourceBadRequestException("Giờ kết thúc phải sau giờ bắt đầu ở môn " + slot.getSubjectName());
                }
            }

            // Sort by start time to check overlaps
            daySlots.sort(Comparator.comparing(ScheduleSlotDto::getStartTime));

            for (int i = 0; i < daySlots.size() - 1; i++) {
                ScheduleSlotDto current = daySlots.get(i);
                ScheduleSlotDto next = daySlots.get(i + 1);

                // Condition for overlap: current.endTime > next.startTime
                if (current.getEndTime().isAfter(next.getStartTime())) {
                    throw new ResourceConflictException(String.format("Trùng lịch học vào Thứ %d: Môn '%s' và Môn '%s'", 
                            current.getDayOfWeek(), current.getSubjectName(), next.getSubjectName()));
                }
            }
        }
    }

    private Map<String, Object> buildGeminiRequest(String text, String base64Image, String mimeType) {
        Map<String, Object> inlineData = Map.of(
                "mime_type", mimeType,
                "data", base64Image
        );
        Map<String, Object> imagePart = Map.of("inline_data", inlineData);
        Map<String, Object> textPart = Map.of("text", text);
        Map<String, Object> content = Map.of("parts", List.of(textPart, imagePart));
        return Map.of("contents", List.of(content));
    }

    private String extractTextFromGeminiResponse(Map responseBody) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            log.error("Cấu trúc trả về từ AI không đúng chuẩn.");
            throw new ResourceBadRequestException("Lỗi xử lý phản hồi từ AI Vision.");
        }
    }

    private ScheduleResponse mapToResponse(Schedule schedule, List<ScheduleSlotDto> slots) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .name(schedule.getName())
                .isActive(schedule.isActive())
                .slots(slots)
                .build();
    }
}
